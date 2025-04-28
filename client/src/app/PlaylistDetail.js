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

    // Helper function to format duration from milliseconds to mm:ss
    const formatDuration = (ms) => {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        if (!accessToken || !spotifyApi || !playlistId) return;

        const fetchPlaylist = async () => {
            try {
                setLoading(true);
                const playlistRes = await spotifyApi.getPlaylist(playlistId);
                const playlistData = playlistRes.body;
                setPlaylist(playlistData);
                setEditedName(playlistData.name);
                setEditedDescription(playlistData.description || '');

                const initialTracks = await spotifyApi.getPlaylistTracks(playlistId, { limit: 25, offset: 0 });
                setTracks(initialTracks.body.items.filter(item => item.track));
                setLoading(false);

                if (playlistData.tracks.total > 25) {
                    setIsFetchingMore(true);
                    let allTracks = [...initialTracks.body.items.filter(item => item.track)];
                    for (let offset = 25; offset < playlistData.tracks.total; offset += 25) {
                        const moreTracks = await spotifyApi.getPlaylistTracks(playlistId, { limit: 25, offset });
                        const newTracks = moreTracks.body.items.filter(item => item.track)
                            .filter(newItem => !allTracks.some(track => track.track?.id === newItem.track?.id));
                        allTracks = [...allTracks, ...newTracks];
                        setTracks(allTracks);
                    }
                    setIsFetchingMore(false);
                }
            } catch (err) {
                console.error('Error fetching playlist:', err);
                setError('Failed to load playlist details. Please try again.');
                setLoading(false);
            }
        };

        fetchPlaylist();
    }, [accessToken, spotifyApi, playlistId]);

    const handleTrackClick = (track, index) => {
        const upcomingTracks = tracks.slice(index + 1).map(item => item.track);
        chooseTrack(track, upcomingTracks, playlist.uri, index);
    };

    const handleDragStart = (e, track) => {
        e.dataTransfer.setData('trackData', JSON.stringify(track));
        e.dataTransfer.effectAllowed = 'move';
    };

    const toggleEditMode = () => {
        if (!isEditing) {
            setEditedName(playlist.name);
            setEditedDescription(playlist.description || '');
            setEditedImage(null);
        }
        setIsEditing(!isEditing);
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) setEditedImage(file);
    };

    const saveChanges = async () => {
        try {
            await spotifyApi.changePlaylistDetails(playlistId, { name: editedName, description: editedDescription });
            setPlaylist(prev => ({ ...prev, name: editedName, description: editedDescription }));

            if (editedImage) {
                const reader = new FileReader();
                reader.onloadend = async () => {
                    const base64 = reader.result.split(',')[1];
                    await spotifyApi.uploadCustomPlaylistCoverImage(playlistId, base64);
                    const updated = await spotifyApi.getPlaylist(playlistId);
                    setPlaylist(updated.body);
                };
                reader.readAsDataURL(editedImage);
            }
            setIsEditing(false);
            setEditedImage(null);
        } catch (err) {
            console.error('Error saving changes:', err);
            setError('Failed to save changes: ' + err.message);
        }
    };

    const handleArtistClick = (artistId, e) => {
        e.stopPropagation();
        if (onArtistClick) onArtistClick('artist', artistId);
    };

    if (loading) return <div className="status-message">Loading playlist...</div>;
    if (error) return <div className="status-message error">{error}</div>;
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
              <img
                src={
                  editedImage
                    ? URL.createObjectURL(editedImage)
                    : playlist.images?.[0]?.url || "/placeholder.jpg"
                }
                alt="Playlist cover"
                className="playlist-detail-image"
              />
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
                <p className="edit-notice">
                  Edits may take 30+ seconds to reflect on Spotify.
                </p>
                <div className="edit-buttons">
                  <button onClick={saveChanges}>Save</button>
                  <button onClick={toggleEditMode}>Cancel</button>
                </div>
              </div>
            </>
          ) : (
            <>
              <img
                src={
                  editedImage
                    ? URL.createObjectURL(editedImage)
                    : playlist.images?.[0]?.url || "/placeholder.jpg"
                }
                alt="Playlist cover"
                className="playlist-detail-image"
              />
              <div className="playlist-info">
                <h1>{playlist.name}</h1>
                <p>{playlist.description}</p>
                <p>{playlist.tracks.total} tracks</p>
                <button onClick={toggleEditMode} className="edit-button">
                  Edit Playlist
                </button>
              </div>
            </>
          )}
        </div>

        <div className="track-list">
          {tracks.map((item, index) => (
            <div
              key={item.track?.id || index}
              className="track-item"
              onClick={() => handleTrackClick(item.track, index)}
              draggable
              onDragStart={(e) => handleDragStart(e, item.track)}
            >
              <img
                src={item.track.album.images?.[0]?.url}
                alt={item.track.name}
                className="track-image"
              />
              <p>
                {item.track.name} —{" "}
                <span
                  className="artist-link"
                  onClick={(e) =>
                    handleArtistClick(item.track.artists[0].id, e)
                  }
                >
                  {item.track.artists[0].name}
                </span>
              </p>
              <span className="track-duration">
                {formatDuration(item.track.duration_ms)}
              </span>
            </div>
          ))}
          {isFetchingMore && (
            <div className="status-message">Loading more tracks...</div>
          )}
        </div>
      </div>
    );
}