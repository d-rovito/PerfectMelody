import React, { useState, useEffect } from 'react';
import './Playlists.css';

export default function Playlists({ accessToken, spotifyApi }) {
    const [playlists, setPlaylists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch the user's playlists when the component mounts
    useEffect(() => {
        if (!accessToken || !spotifyApi) return;

        const fetchPlaylists = async () => {
            try {
                setLoading(true);
                const response = await spotifyApi.getUserPlaylists({
                    limit: 50,
                    offset: 0
                });
                
                setPlaylists(response.body.items || []);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching playlists:', err);
                setError('Failed to load playlists. Please try again.');
                setLoading(false);
            }
        };

        fetchPlaylists();
    }, [accessToken, spotifyApi]);

    // 
    if (loading) {
        return <div>Loading playlists...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    return (
        <div className="playlists-container">
            <h2>Your Playlists</h2>
            {playlists.length === 0 ? (
                <p>No playlists found.</p>
            ) : (
                <div className="playlists-list">
                    {playlists.map((playlist) => (
                        <div key={playlist.id} className="playlist-item">
                            <div className="playlist-info">
                                <h3>{playlist.name}</h3>
                                <p>
                                    {playlist.tracks.total} tracks
                                    {playlist.description && ` • ${playlist.description}`}
                                </p>
                            </div>
                            {/* Find Playlist Image, Assign Placeholder if none */}
                            <img
                                src={playlist.images && playlist.images.length > 0 ? playlist.images[0].url : '/placeholder.jpg'}
                                alt={`${playlist.name} cover`}
                                className="playlist-image"
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}