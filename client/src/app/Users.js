import { useState, useEffect } from 'react';
import { logout } from './useAuth';
import './Users.css';

export default function Users({ spotifyApi, accessToken }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [themeColor, setThemeColor] = useState(() => localStorage.getItem('themeColor') || '#1db954');

    useEffect(() => {
        if (!accessToken || !spotifyApi) {
            setError('Missing authentication or API client');
            setLoading(false);
            return;
        }

        spotifyApi.setAccessToken(accessToken);

        const fetchUserData = async () => {
            try {
                setLoading(true);
                const userResponse = await spotifyApi.getMe();
                setUser(userResponse.body);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching user data:', err);
                setError('Failed to load user info. Please try again.');
                setLoading(false);
            }
        };

        fetchUserData();
    }, [accessToken, spotifyApi]);

    useEffect(() => {
        document.documentElement.style.setProperty('--theme-color', themeColor);
        localStorage.setItem('themeColor', themeColor);
    }, [themeColor]);

    const handleLogout = () => {
        logout();
    };

    const handleColorChange = (e) => {
        setThemeColor(e.target.value);
    };

    if (loading) return <div className="loading">Loading user info...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="users">
            {user && (
                <div className="user-profile">
                    <img 
                        src={user.images && user.images.length > 0 ? user.images[0].url : '/placeholder.jpg'} 
                        alt="Profile picture" 
                        className="profile-picture"
                    />
                    <h2 className="user-name">{user.display_name || 'User'}</h2>
                    <p className="user-email">{user.email || 'No email available'}</p>
                    <p className="user-followers">Followers: {user.followers.total}</p>

                    <div className="theme-picker">
                        <label htmlFor="themeColorPicker">Select Theme Color:</label>
                        <input
                            type="color"
                            id="themeColorPicker"
                            value={themeColor}
                            onChange={handleColorChange}
                        />
                    </div>

                    <button className="logout-button" onClick={handleLogout}>
                        Log Out
                    </button>
                </div>
            )}
        </div>
    );
}
