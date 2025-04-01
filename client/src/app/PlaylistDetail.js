import React, { useState, useEffect } from 'react';
import './PlaylistDetail.css';

export default function PlaylistDetail({ accessToken, spotifyApi, playlistId, chooseTrack, onArtistClick }) {
    const [playlist, setPlaylist] = useState(null);
    const [tracks, setTracks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editedName, setEditedName] = useState('');
    const [editedDescription, setEditedDescription] = useState('');
    const [editedImage, setEditedImage] = useState(null);

    useEffect(() => {
        if (!accessToken || !spotifyApi || !playlistId) return;
        
        const fetchPlaylistData = async () => {
            try {
                setLoading(true);
                const playlistResponse = await spotifyApi.getPlaylist(playlistId);
                const playlistData = playlistResponse.body;
                setPlaylist(playlistData);
                setEditedName(playlistData.name);
                setEditedDescription(playlistData.description || '');
                
                // Fetch initial tracks
                const initialTracks = await spotifyApi.getPlaylistTracks(playlistId, {
                    limit: 25,
                    offset: 0,
                });
                setTracks(initialTracks.body.items.filter(item => item.track));
                setLoading(false);
                
                // Check if there are more than 25 tracks
                const totalTracks = playlistData.tracks.total;
                if (totalTracks > 25) {
                    // Fetch more tracks in batches of 25 (Help Initial Load Times)
                    setIsFetchingMore(true);
                    let allTracks = [...initialTracks.body.items.filter(item => item.track)];
                    for (let offset = 25; offset < totalTracks; offset += 25) {
                        const moreTracks = await spotifyApi.getPlaylistTracks(playlistId, {
                            limit: 25,
                            offset,
                        });
                        const newTracks = moreTracks.body.items
                            .filter(item => item.track)
                            .filter(newItem => !allTracks.some(track => track.track?.id === newItem.track?.id));
                        allTracks = [...allTracks, ...newTracks];
                        setTracks([...allTracks]);
                    }
                    setIsFetchingMore(false);
                }
            } catch (err) {
                console.error('Error fetching playlist:', err);
                setError('Failed to load playlist details. Please try again.');
                setLoading(false);
            }
        };

        fetchPlaylistData();
    }, [accessToken, spotifyApi, playlistId]);

    // Function to handle track click
    const handleTrackClick = (clickedTrack, index) => {
        const remainingTracks = tracks.slice(index + 1).map(item => item.track);
        chooseTrack(clickedTrack, remainingTracks, playlist.uri, index);
    };

    // Function to handle drag start event
    const handleDragStart = (e, track) => {
        e.dataTransfer.setData('trackData', JSON.stringify(track));
        e.dataTransfer.effectAllowed = 'move';
    };

    // Function to handle drag over event
    const toggleEditMode = () => {
        setIsEditing(!isEditing);
        if (!isEditing) {
            setEditedName(playlist.name);
            setEditedDescription(playlist.description || '');
            setEditedImage(null);
        }
    };

    // Function to handle image change event
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setEditedImage(file);
        }
    };

    // Function to save changes to the playlist
    const saveChanges = async () => {
        try {
            await spotifyApi.changePlaylistDetails(playlistId, {
                name: editedName,
                description: editedDescription,
            });

            setPlaylist(prev => ({
                ...prev,
                name: editedName,
                description: editedDescription,
            }));

            // Upload new cover image if provided
            if (editedImage) {
                const reader = new FileReader();
                reader.onloadend = async () => {
                    const base64Image = reader.result.split(',')[1];
                    await spotifyApi.uploadCustomPlaylistCoverImage(playlistId, base64Image);
                    const updatedPlaylist = await spotifyApi.getPlaylist(playlistId);
                    setPlaylist(updatedPlaylist.body);
                };
                reader.readAsDataURL(editedImage);
            }

            setIsEditing(false);
            setEditedImage(null);
        } catch (err) {
            console.error('Error saving playlist changes:', err);
            setError('Failed to save changes: ' + err.message);
        }
    };

    // Function to handle artist click
    const handleArtistClick = (artistId) => {
        if (onArtistClick) {
            onArtistClick('artist', artistId);
        }
    };

    if (loading) return <div>Loading playlist...</div>;
    if (error) return <div>{error}</div>;
    if (!playlist) return null;

    return (
        <div className="playlist-detail-container">
            <div className="playlist-header-sticky">
                {isEditing ? (
                    <>
                        <input
                            type="file"
                            accept="image/jpeg,image/png"
                            onChange={handleImageChange}
                            className="image-upload"
                        />
                        {editedImage ? (
                            <img
                                src={URL.createObjectURL(editedImage)}
                                alt="New playlist cover preview"
                                className="playlist-detail-image"
                            />
                        ) : (
                            <img
                                src={playlist.images && playlist.images.length > 0 ? playlist.images[0].url : '/placeholder.jpg'}
                                alt={`${playlist.name} cover`}
                                className="playlist-detail-image"
                            />
                        )}
                        <div className="playlist-info">
                            <input
                                type="text"
                                value={editedName}
                                onChange={(e) => setEditedName(e.target.value)}
                                placeholder="Playlist name"
                                className="edit-input"
                            />
                            <textarea
                                value={editedDescription}
                                onChange={(e) => setEditedDescription(e.target.value)}
                                placeholder="Playlist description"
                                className="edit-textarea"
                            />
                            <p className="edit-notice">Edits may take at least 30 seconds to show in App and Spotify</p>
                            <div className="edit-buttons">
                                <button onClick={saveChanges}>Save</button>
                                <button onClick={toggleEditMode}>Cancel</button>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <img
                            src={playlist.images && playlist.images.length > 0 ? playlist.images[0].url : '/placeholder.jpg'}
                            alt={`${playlist.name} cover`}
                            className="playlist-detail-image"
                        />
                        <div className="playlist-info">
                            <h1>{playlist.name}</h1>
                            <p>{playlist.description}</p>
                            <p>{playlist.tracks.total} tracks</p>
                            <button onClick={toggleEditMode} className="edit-button">Edit Playlist</button>
                        </div>
                    </>
                )}
            </div>
            <div >
                {tracks.map((item, index) => (
                    <div
                        key={item.track?.id || index}
                        className="track-item"
                        onClick={() => handleTrackClick(item.track, index)}
                        draggable
                        onDragStart={(e) => handleDragStart(e, item.track)}
                    >
                        <img 
                            src={item.track.album.images[0]?.url} 
                            alt={item.track.name} 
                            className="track-image" 
                        />
                        <p>
                            {item.track.name} -{' '}
                            <span 
                                className="artist-link"
                                onClick={(e) => {
                                    e.stopPropagation(); // Prevent track click
                                    handleArtistClick(item.track.artists[0].id);
                                }}
                            >
                                {item.track.artists[0].name}
                            </span>
                        </p>
                    </div>
                ))}
                {isFetchingMore && <div>Loading more tracks...</div>}
            </div>
        </div>
    );
}