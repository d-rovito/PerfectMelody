// Dashboard.js
import { useState, useEffect } from 'react';
import useAuth from './useAuth';
import SpotifyWebApi from 'spotify-web-api-node';
import Player from './Player';
import Sidebar from './Sidebar';
import Search from './Search';
import './Dashboard.css';
import './Sidebar.css';

// Create Spotify API instance here
const spotifyApi = new SpotifyWebApi({
    clientId: "73c8acfed3c743a685e0ea411471218d"
});

export default function Dashboard({ code }) {
    const accessToken = useAuth(code);
    const [playingTrack, setPlayingTrack] = useState(null);

    function chooseTrack(track) {
        setPlayingTrack(track);
    }

    useEffect(() => {
        if (!accessToken) return;
        spotifyApi.setAccessToken(accessToken);
    }, [accessToken]);

    return (
        <div className="dashboard-container">
            <Sidebar />
            <Search 
                spotifyApi={spotifyApi}
                accessToken={accessToken}
                chooseTrack={chooseTrack}
            />
            <div className="player-container">
                <Player accessToken={accessToken} trackUri={playingTrack?.uri} />
            </div>
        </div>
    );
}