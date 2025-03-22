import {useState, useEffect} from "react";
import SpotifyPlayer from "react-spotify-web-playback";

// Music Player component
export default function Player({ accessToken, trackUri }) {
    const [play, setPlay] = useState(false);

    useEffect(() => setPlay(true), [trackUri]);
    
    if (!accessToken) return null;
    return (
    <SpotifyPlayer
        token={accessToken}
        showSaveIcon
        callback={state => {
            if(!state.isPlaying) setPlay(false);
        }}
        play={play}
        uris={trackUri ? [trackUri] : []}
        styles = {{
            activeColor: "#fff",
            bgColor: "#333",
            color: "#fff",
            loaderColor: "#fff",
            sliderColor: "#C41E3A",
            trackArtistColor: "#ccc",
            trackNameColor: "#fff"
        }}
    />
    );
}