import { useState, useEffect } from 'react';
import './Home.css';

export default function Home({ spotifyApi, accessToken, chooseTrack, onSectionChange }) {
    const [user, setUser] = useState(null);
    const [recentTracks, setRecentTracks] = useState([]);
    const [userPlaylists, setUserPlaylists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!accessToken || !spotifyApi) {
            setLoading(false); // Avoid immediate error
            return;
        }

        spotifyApi.setAccessToken(accessToken);
        
        // Function to fetch user data, recent tracks, and playlists
        const fetchData = async () => {
            try {
                setLoading(true);
                const [userResponse, recentResponse, playlistResponse] = await Promise.all([
                    spotifyApi.getMe()
                        .catch(err => { console.error('Error fetching user:', err); throw err; }),
                    spotifyApi.getMyRecentlyPlayedTracks({ limit: 10 })
                        .then(res => {
                            // Remove duplicates based on track.id
                            const uniqueTracks = Array.from(
                                new Map(res.body.items.map(item => [item.track.id, item])).values()
                            );
                            return uniqueTracks; // Return unique tracks
                        })
                        .catch(err => { console.error('Error fetching recent tracks:', err); throw err; }),
                    spotifyApi.getUserPlaylists({ limit: 6 })
                        .catch(err => { console.error('Error fetching playlists:', err); throw err; })
                ]);
                // Set the state with the fetched data
                setUser(userResponse.body);
                setRecentTracks(recentResponse);
                setUserPlaylists(playlistResponse.body.items);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching home data:', error);
                setError('Failed to load home content. Please try again.');
                setLoading(false);
            }
        };

        fetchData();
    }, [accessToken, spotifyApi]);
    
    if (!accessToken || !spotifyApi) {
        return <div className="loading">Waiting for authentication...</div>;
    }
    if (loading) return <div className="loading">Loading your music...</div>;
    if (error) return <div>{error}</div>;

    return (
        <div className="home">
            {user && (
                <h1 className="welcome">Welcome, {user.display_name || 'User'}!</h1>
            )}
            <div className="home-recently-played">
                <h2>Recently Played</h2>
                <div className="home-track-list">
                    {recentTracks.length > 0 ? (
                        recentTracks.map(item => (
                            <div
                                key={item.track.id}
                                className="home-track-item"
                                onClick={() => chooseTrack(item.track)}
                            >
                                <img src={item.track.album.images[0]?.url} alt="Album art" />
                                <p>{item.track.name}</p>
                                <p>{item.track.artists[0].name}</p>
                            </div>
                        ))
                    ) : (
                        <p>No recently played tracks available.</p>
                    )}
                </div>
            </div>
            <div className="home-featured-playlists">
                <h2>Your Playlists</h2>
                <div className="home-playlist-grid">
                    {userPlaylists.length > 0 ? (
                        userPlaylists.map(playlist => (
                            <div
                                key={playlist.id}
                                className="home-playlist-item"
                                onClick={() => onSectionChange('playlist', playlist.id)}
                            >
                                <img 
                                    src={playlist.images && playlist.images.length > 0 ? playlist.images[0].url : '/placeholder.jpg'} 
                                    alt="Playlist cover" 
                                />
                                <p>{playlist.name}</p>
                            </div>
                        ))
                    ) : (
                        <p>No playlists available.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
