import React, { useState, useEffect } from 'react';
import './Playlists.css';

export default function Playlists({ accessToken, spotifyApi, onPlaylistClick }) {
    const [playlists, setPlaylists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [createMode, setCreateMode] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [selectedSongs, setSelectedSongs] = useState([]);
    const [newPlaylistName, setNewPlaylistName] = useState('');
    const [selectedPlaylistTracks, setSelectedPlaylistTracks] = useState([]);
    const [selectedPlaylistId, setSelectedPlaylistId] = useState(null);

    // Function to fetch playlists from Spotify API
    const fetchPlaylists = async () => {
        try {
            setLoading(true);
            let allPlaylists = [];
            let offset = 0;
            const limit = 50;
            let total = 0;

            do {
                const response = await spotifyApi.getUserPlaylists({
                    limit,
                    offset
                });
                console.log('Fetched playlists:', response.body.items);
                allPlaylists = allPlaylists.concat(response.body.items);
                total = response.body.total;
                offset += limit;
            } while (offset < total);

            setPlaylists(allPlaylists || []);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching playlists:', err);
            setError('Failed to load playlists: ' + err.message);
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!accessToken || !spotifyApi) return;
        console.log('Initial fetch with accessToken:', accessToken);
        fetchPlaylists();
    }, [accessToken, spotifyApi]);

    // Function to handle creating a new playlist from scratch
    const handleCreateEmpty = async () => {
        try {
            const userResponse = await spotifyApi.getMe();
            const userId = userResponse.body.id;
            const createResponse = await spotifyApi.createPlaylist(userId, {
                name: newPlaylistName || 'New Playlist',
                public: false
            });
            console.log('Created playlist:', createResponse.body);
            
            await new Promise(resolve => setTimeout(resolve, 1000));
            await fetchPlaylists();
            setCreateMode(null);
            setNewPlaylistName('');
        } catch (err) {
            console.error('Error creating playlist:', err);
            setError('Failed to create playlist: ' + err.message);
        }
    };

    // Function to fetch tracks from a selected playlist
    const fetchPlaylistTracks = async (playlistId) => {
        try {
            let allTracks = [];
            let offset = 0;
            const limit = 100;
            let total = 0;

            do {
                const response = await spotifyApi.getPlaylistTracks(playlistId, {
                    limit,
                    offset
                });
                allTracks = allTracks.concat(response.body.items);
                total = response.body.total;
                offset += limit;
            } while (offset < total);

            setSelectedPlaylistTracks(allTracks);
            setSelectedPlaylistId(playlistId);
        } catch (err) {
            console.error('Error fetching playlist tracks:', err);
            setError('Failed to load playlist tracks: ' + err.message);
        }
    };

    // Function to toggle song selection
    const toggleSongSelection = (trackUri) => {
        setSelectedSongs(prev => 
            prev.includes(trackUri) 
                ? prev.filter(uri => uri !== trackUri)
                : [...prev, trackUri]
        );
    };

    // Function to handle creating a new playlist from existing songs
    const handleCreateFromExisting = async () => {
        try {
            const userResponse = await spotifyApi.getMe();
            const userId = userResponse.body.id;
            const createResponse = await spotifyApi.createPlaylist(userId, {
                name: newPlaylistName || 'New Playlist',
                public: false
            });
            console.log('Created playlist from existing:', createResponse.body);
            
            if (selectedSongs.length > 0) {
                const chunks = [];
                for (let i = 0; i < selectedSongs.length; i += 100) {
                    chunks.push(selectedSongs.slice(i, i + 100));
                }
                for (const chunk of chunks) {
                    await spotifyApi.addTracksToPlaylist(createResponse.body.id, chunk);
                }
            }
            
            await new Promise(resolve => setTimeout(resolve, 1000));
            await fetchPlaylists();
            setCreateMode(null);
            setSelectedSongs([]);
            setNewPlaylistName('');
            setSelectedPlaylistTracks([]);
            setSelectedPlaylistId(null);
        } catch (err) {
            console.error('Error creating playlist:', err);
            setError('Failed to create playlist: ' + err.message);
        }
    };

    if (loading) return <div>Loading playlists...</div>;
    if (error) return <div>{error}</div>;

    // If createMode is set to 'empty', show the empty playlist creation form
    if (createMode === 'empty') {
        return (
            <div className="playlists-container">
                <h2>Create New Playlist</h2>
                <input
                    type="text"
                    value={newPlaylistName}
                    onChange={(e) => setNewPlaylistName(e.target.value)}
                    placeholder="Enter playlist name"
                    className="playlist-name-input"
                />
                <div>
                    <button onClick={handleCreateEmpty}>Create</button>
                    <button onClick={() => setCreateMode(null)}>Cancel</button>
                </div>
            </div>
        );
    }

    // If createMode is set to 'fromExisting', show the existing playlists
    if (createMode === 'fromExisting' && !selectedPlaylistId) {
        return (
            <div className="playlists-container">
                <h2>Select Source Playlist</h2>
                <input
                    type="text"
                    value={newPlaylistName}
                    onChange={(e) => setNewPlaylistName(e.target.value)}
                    placeholder="Enter new playlist name"
                    className="playlist-name-input"
                />
                <div className="playlists-list">
                    {playlists.map((playlist) => (
                        <div 
                            key={playlist.id} 
                            className="playlist-item"
                            onClick={() => fetchPlaylistTracks(playlist.id)}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className="playlist-info">
                                <h3>{playlist.name}</h3>
                                <p>{playlist.tracks.total} tracks</p>
                            </div>
                            <img
                                src={playlist.images && playlist.images.length > 0 ? playlist.images[0].url : '/placeholder.jpg'}
                                alt={`${playlist.name} cover`}
                                className="playlist-image"
                            />
                        </div>
                    ))}
                </div>
                <button onClick={() => setCreateMode(null)}>Cancel</button>
            </div>
        );
    }

    // If a playlist is selected, show the tracks in that playlist
    if (createMode === 'fromExisting' && selectedPlaylistId) {
        return (
            <div className="playlists-container">
                <h2>Select Songs</h2>
                <div className="tracks-list">
                    {selectedPlaylistTracks.map(({ track }) => (
                        <div key={track.id} className="track-item">
                            <div 
                                className="selection-circle"
                                onClick={() => toggleSongSelection(track.uri)}
                            >
                                <div 
                                    className="inner-circle"
                                    style={{
                                        backgroundColor: selectedSongs.includes(track.uri) ? '#1db954' : 'grey'
                                    }}
                                />
                            </div>
                            <img
                                src={track.album.images[2]?.url || '/placeholder.jpg'}
                                alt={`${track.name} cover`}
                                className="track-image"
                            />
                            <span>{track.name} - {track.artists[0].name}</span>
                        </div>
                    ))}
                </div>
                <div>
                    <button onClick={handleCreateFromExisting}>Done</button>
                    <button onClick={() => setSelectedPlaylistId(null)}>Back</button>
                    <button onClick={() => setCreateMode(null)}>Cancel</button>
                </div>
            </div>
        );
    }

    // Main playlists view
    return (
        <div className="playlists-container">
            <div className="playlists-header">
                <h2>Your Playlists</h2>
                <button 
                    onClick={() => setShowModal(true)}
                    className="create-playlist-btn"
                >
                    Create Playlist
                </button>
            </div>
            
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Create Playlist</h3>
                        <button 
                            onClick={() => {
                                setCreateMode('empty');
                                setShowModal(false);
                            }}
                        >
                            Create from Scratch
                        </button>
                        <button 
                            onClick={() => {
                                setCreateMode('fromExisting');
                                setShowModal(false);
                            }}
                        >
                            Create from Other Playlists
                        </button>
                        <button onClick={() => setShowModal(false)}>
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {playlists.length === 0 ? (
                <p>No playlists found.</p>
            ) : (
                <div className="playlists-list">
                    {playlists.map((playlist) => (
                        <div key={playlist.id} className="playlist-item">
                            <img
                                src={playlist.images && playlist.images.length > 0 ? playlist.images[0].url : '/placeholder.jpg'}
                                alt={`${playlist.name} cover`}
                                className="playlist-image"
                            />
                            <div className="playlist-info">
                                <h3
                                    onClick={() => onPlaylistClick('playlist', playlist.id)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    {playlist.name}
                                </h3>
                                <p>
                                    {playlist.tracks.total} tracks
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}