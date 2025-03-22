import { useState, useEffect } from 'react';
import useAuth from './useAuth';
import SpotifyWebApi from 'spotify-web-api-node';
import Player from './Player';
import Sidebar from './Sidebar';
import Search from './Search';
import Home from './Home';
import Playlists from './Playlists';
import Users from './Users';
import './Dashboard.css';
import './Sidebar.css';
import TrackSearchResult from './TrackSearchResult';

// Spotify API setup
const spotifyApi = new SpotifyWebApi({
    clientId: "73c8acfed3c743a685e0ea411471218d"
});

export default function Dashboard({ code }) {
    const accessToken = useAuth(code);
    const [playingTrack, setPlayingTrack] = useState(null);
    const [activeSection, setActiveSection] = useState('home');
    const [displayedResults, setDisplayedResults] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    function chooseTrack(track) {
        setPlayingTrack(track);
    }

    // Effect to set the access token for Spotify API when available
    useEffect(() => {
        if (!accessToken) return;
        spotifyApi.setAccessToken(accessToken);
    }, [accessToken]);

    // Function to handle switching between sections
    const handleSectionChange = (section) => {
        setActiveSection(section);
        setDisplayedResults([]);
    };

    // Function to render the content based on the active section
    const renderContent = () => {
        switch (activeSection) {
            case 'home':
                return <Home />;
            case 'playlists':
                return <Playlists accessToken={accessToken} spotifyApi={spotifyApi} />;
            case 'users':
                return <Users />;
            default:
                return <Home />;
        }
    }

    return (
        <div className="dashboard-container">
            <Sidebar onSectionChange={handleSectionChange} />

            <div className="main-content">
                <Search 
                    spotifyApi={spotifyApi}
                    accessToken={accessToken}
                    chooseTrack={chooseTrack}
                    setDisplayedResults={setDisplayedResults}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                />

                <div className="content-area">
                    {renderContent()}
                </div>

                {/* Display search results as an overlay */}
                {displayedResults.length > 0 && (
                    <div className="search-results-overlay" onClick={() => setDisplayedResults([])}>
                        {displayedResults.map(track => (
                            <TrackSearchResult 
                                track={track} 
                                key={track.uri} 
                                chooseTrack={chooseTrack} 
                            />
                        ))}
                    </div>
                )}

                <div className="player-container">
                    <Player accessToken={accessToken} trackUri={playingTrack?.uri} />
                </div>
            </div>
        </div>
    );
}