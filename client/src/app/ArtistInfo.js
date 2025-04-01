import React, { useState, useEffect } from 'react';
import './ArtistInfo.css';

export default function ArtistInfo({ accessToken, spotifyApi, artistId, chooseTrack }) {
    const [artist, setArtist] = useState(null);
    const [topTracks, setTopTracks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Effect to fetch artist data and top tracks
    useEffect(() => {
        if (!accessToken || !spotifyApi || !artistId) return;

        const fetchArtistData = async () => {
            try {
                setLoading(true);

                // Fetch artist details
                const artistResponse = await spotifyApi.getArtist(artistId);
                const artistData = artistResponse.body;
                setArtist(artistData);

                // Fetch top tracks
                const topTracksResponse = await spotifyApi.getArtistTopTracks(artistId, 'US'); // 'US' as country code, adjust as needed
                setTopTracks(topTracksResponse.body.tracks.slice(0, 5)); // Limit to top 5

                setLoading(false);
            } catch (err) {
                console.error('Error fetching artist data:', err);
                setError('Failed to load artist information. Please try again.');
                setLoading(false);
            }
        };

        fetchArtistData();
    }, [accessToken, spotifyApi, artistId]);

    // Function to handle track click
    const handleTrackClick = (track) => {
        if (chooseTrack) {
            chooseTrack(track, topTracks.filter(t => t.id !== track.id), null, 0); // Play track with remaining top tracks
        }
    };

    if (loading) return <div>Loading artist info...</div>;
    if (error) return <div>{error}</div>;
    if (!artist) return null;

    return (
        <div className="artist-info-container">
            <div className="artist-header">
                <img
                    src={artist.images && artist.images.length > 0 ? artist.images[0].url : '/placeholder.jpg'}
                    alt={`${artist.name} profile`}
                    className="artist-image"
                />
                <div className="artist-details">
                    <h1>{artist.name}</h1>
                    <p className="artist-genres">{artist.genres.join(', ')}</p>
                    <p className="artist-stats">
                        <span>Followers: {artist.followers.total.toLocaleString()}</span> • 
                        <span> Popularity: {artist.popularity}%</span>
                    </p>
                </div>
            </div>
            <div className="top-tracks">
                <h2>Top Tracks</h2>
                {topTracks.map((track) => (
                    <div
                        key={track.id}
                        className="track-item"
                        onClick={() => handleTrackClick(track)}
                    >
                        <img
                            src={track.album.images[0]?.url || '/placeholder.jpg'}
                            alt={track.name}
                            className="track-image"
                        />
                        <p>{track.name}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}