import { useState, useEffect } from 'react';
import useAuth from './useAuth';
import SpotifyWebApi from 'spotify-web-api-node';
import Player from './Player';
import Sidebar from './Sidebar';
import Search from './Search';
import Home from './Home';
import Playlists from './Playlists';
import PlaylistDetail from './PlaylistDetail';
import Users from './Users';
import Recommendation from './Recommendation';
import ArtistInfo from './ArtistInfo'; // Import ArtistInfo
import './Dashboard.css';
import './Sidebar.css';
import TrackSearchResult from './TrackSearchResult';

// Spotify API setup
const spotifyApi = new SpotifyWebApi({
    clientId: "73c8acfed3c743a685e0ea411471218d"
});

export default function Dashboard({ code }) {
    const accessToken = useAuth(code);
    const [trackUris, setTrackUris] = useState([]);
    const [playlistContext, setPlaylistContext] = useState(null);
    const [activeSection, setActiveSection] = useState('home');
    const [selectedPlaylistId, setSelectedPlaylistId] = useState(null);
    const [selectedArtistId, setSelectedArtistId] = useState(null); // New state for artist
    const [displayedResults, setDisplayedResults] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    // Function to choose a track and set the playlist context
    function chooseTrack(track, additionalTracks = [], playlistUri = null, offset = null) {
        console.log('Track chosen:', track);
        if (playlistUri && offset !== null) {
            setPlaylistContext({ uri: playlistUri, offset });
            setTrackUris([track.uri, ...additionalTracks.map(t => t.uri)]);
        } else {
            setTrackUris([track.uri, ...additionalTracks.map(t => t.uri)]);
            setPlaylistContext(null);
        }
    }

    // Effect to set the access token for Spotify API
    useEffect(() => {
        if (!accessToken) return;
        spotifyApi.setAccessToken(accessToken);
    }, [accessToken]);

    // Function to handle switching between sections info and logic
    const handleSectionChange = (section, id = null) => {
        setActiveSection(section);
        if (section === 'playlist') {
            setSelectedPlaylistId(id);
            setSelectedArtistId(null);
        } else if (section === 'artist') {
            setSelectedArtistId(id);
            setSelectedPlaylistId(null);
        } else {
            setSelectedPlaylistId(null);
            setSelectedArtistId(null);
        }
        setDisplayedResults([]);
    };

    // Function to handle switching between sections
    const renderContent = () => {
        switch (activeSection) {
            case 'playlists':
                return (
                    <Playlists 
                        accessToken={accessToken} 
                        spotifyApi={spotifyApi} 
                        onPlaylistClick={handleSectionChange} 
                    />
                );
            case 'playlist':
                return (
                    <PlaylistDetail
                        accessToken={accessToken}
                        spotifyApi={spotifyApi}
                        playlistId={selectedPlaylistId}
                        chooseTrack={chooseTrack}
                        onArtistClick={handleSectionChange}
                    />
                );
            case 'users':
                return <Users spotifyApi={spotifyApi} accessToken={accessToken} />;
            case 'recommendation':
                return (
                    <Recommendation 
                        spotifyApi={spotifyApi} 
                        accessToken={accessToken} 
                        chooseTrack={chooseTrack} 
                    />
                );
            case 'artist':
                return (
                    <ArtistInfo
                        accessToken={accessToken}
                        spotifyApi={spotifyApi}
                        artistId={selectedArtistId}
                        chooseTrack={chooseTrack}
                    />
                );
            default:
                return (
                    <Home 
                        spotifyApi={spotifyApi} 
                        accessToken={accessToken} 
                        chooseTrack={chooseTrack} 
                        onSectionChange={handleSectionChange} 
                    />
                );
        }
    };

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
                    <Player 
                        accessToken={accessToken} 
                        trackUri={trackUris}
                        playlistContext={playlistContext}
                        chooseTrack={chooseTrack}
                    />
                </div>
            </div>
        </div>
    );
}