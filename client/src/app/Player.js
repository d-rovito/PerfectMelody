import { useState, useEffect } from "react";
import SpotifyWebApi from "spotify-web-api-node";
import Image from 'next/image';
import './Player.css';
import playIcon from './assets/play.svg';
import pauseIcon from './assets/pause.svg';
import skipIcon from './assets/skip.svg';
import previousIcon from './assets/previous.svg';

const spotifyApi = new SpotifyWebApi();

export default function Player({ accessToken, trackUri, playlistContext, chooseTrack }) {
    const [player, setPlayer] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [deviceId, setDeviceId] = useState(null);
    const [currentTrack, setCurrentTrack] = useState(null);
    const [volume, setVolume] = useState(0.5);
    const [position, setPosition] = useState(0);
    const [duration, setDuration] = useState(0);

    // Effect to initialize player
    useEffect(() => {
        if (!accessToken) return;

        spotifyApi.setAccessToken(accessToken);
        
        // Load the Spotify Web Playback SDK script
        const script = document.createElement("script");
        script.src = "https://sdk.scdn.co/spotify-player.js";
        script.async = true;

        // Append the script to the document body
        document.body.appendChild(script);

        // Initialize the player when the SDK is ready
        window.onSpotifyWebPlaybackSDKReady = () => {
            const spotifyPlayer = new Spotify.Player({
                name: "Next.js Spotify Player",
                getOAuthToken: (cb) => cb(accessToken),
                volume: volume,
            });

            // Add event listeners for player events
            spotifyPlayer.addListener("ready", ({ device_id }) => {
                console.log("Player ready with Device ID:", device_id);
                setDeviceId(device_id);
                setPlayer(spotifyPlayer);
            });
            
            // Add event listener for player state changes
            spotifyPlayer.addListener("player_state_changed", (state) => {
                if (state) {
                    setIsPlaying(!state.paused);
                    if (state.track_window.current_track) {
                        setCurrentTrack(state.track_window.current_track);
                        setDuration(state.duration);
                        setPosition(state.position);
                    }
                }
            });

            // Add event listener for player errors
            spotifyPlayer.addListener("not_ready", ({ device_id }) => {
                console.log("Device ID has gone offline", device_id);
            });
            
            spotifyPlayer.connect();
        };

        // Cleanup function to disconnect the player and remove the script
        return () => {
            if (player) player.disconnect();
            document.body.removeChild(script);
        };
    }, [accessToken]);

    // Effect to update the volume when it changes
    useEffect(() => {
        if (!player || !isPlaying) return;

        // Set the volume when the player is ready
        const interval = setInterval(async () => {
            const state = await player.getCurrentState();
            if (state) {
                setPosition(state.position);
                setDuration(state.duration);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [player, isPlaying]);

    // Effect to play the track or playlist when the component mounts or when trackUri or playlistContext changes
    useEffect(() => {
        if (!player || !deviceId || (!trackUri && !playlistContext)) return;

        // Function to play the track or playlist
        const playTrack = async () => {
            try {
                if (playlistContext) {
                    await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
                        method: "PUT",
                        body: JSON.stringify({
                            context_uri: playlistContext.uri,
                            offset: { position: playlistContext.offset },
                        }),
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${accessToken}`,
                        },
                    });
                } else if (trackUri && trackUri.length > 0) {
                    await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
                        method: "PUT",
                        body: JSON.stringify({ uris: trackUri }),
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${accessToken}`,
                        },
                    });
                }
                setIsPlaying(true);
            } catch (error) {
                console.error("Error playing track:", error);
            }
        };

        playTrack();
    }, [trackUri, playlistContext, deviceId, player, accessToken]);

    // Function to handle volume change
    const handleVolumeChange = (e) => {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
        if (player) {
            player.setVolume(newVolume).catch((error) => {
                console.error("Error setting volume:", error);
            });
        }
    };

    // Function to play the next track
    const playNextTrack = async () => {
        if (!player) return;
        try {
            await player.nextTrack();
            const state = await player.getCurrentState();
            if (state && state.track_window.current_track) {
                setCurrentTrack(state.track_window.current_track);
                setPosition(state.position);
                setDuration(state.duration);
            }
        } catch (error) {
            console.error("Error playing next track:", error);
        }
    };

    // Function to play the previous track
    const playPreviousTrack = async () => {
        if (!player) return;
        try {
            await player.previousTrack();
            const state = await player.getCurrentState();
            if (state && state.track_window.current_track) {
                setCurrentTrack(state.track_window.current_track);
                setPosition(state.position);
                setDuration(state.duration);
            }
        } catch (error) {
            console.error("Error playing previous track:", error);
        }
    };

    // Function to handle seeking
    const handleSeek = (e) => {
        const newPosition = parseInt(e.target.value, 10);
        setPosition(newPosition);
        if (player) {
            player.seek(newPosition).catch((error) => {
                console.error("Error seeking:", error);
            });
        }
    };

    // Function to format time in mm:ss
    const formatTime = (ms) => {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    };

    // Function to handle track drop
    const handleDrop = (e) => {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over'); // Remove class on drop
        const trackData = e.dataTransfer.getData('trackData');
        if (trackData) {
          try {
            const droppedTrack = JSON.parse(trackData);
            chooseTrack(droppedTrack);
          } catch (error) {
            console.error('Error parsing dropped track data:', error);
          }
        }
      };

    // Handle the drag over event to allow dropping
    const handleDragOver = (e) => {
        e.preventDefault();
        e.currentTarget.classList.add('drag-over');
    };

    // Handle the drag leave event to remove the drag-over class
    const handleDragLeave = (e) => {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');
      };

    if (!trackUri && !playlistContext) return <div className="player">No track selected</div>;

    return (
        <div className="player" onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}>
            {currentTrack ? (
                <div className="player-content">
                    <div className="track-left">
                        <img
                            src={currentTrack.album?.images[0]?.url || "/placeholder.jpg"}
                            alt="Track cover"
                            className="track-image"
                        />
                        <div className="track-info">
                            <h3 className="track-title">{currentTrack.name}</h3>
                            <p className="track-artist">{currentTrack.artists[0].name}</p>
                        </div>
                    </div>
                    <div className="player-center">
                        <div className="player-controls">
                            <button onClick={playPreviousTrack} disabled={!player}>
                                <Image src={previousIcon} alt="Previous" className="control-icon" />
                            </button>
                            <button onClick={() => player.togglePlay()} disabled={!player}>
                                <Image
                                    src={isPlaying ? pauseIcon : playIcon}
                                    alt={isPlaying ? "Pause" : "Play"}
                                    className="control-icon"
                                />
                            </button>
                            <button onClick={playNextTrack} disabled={!player}>
                                <Image src={skipIcon} alt="Next" className="control-icon" />
                            </button>
                        </div>
                        <div className="playback-bar">
                            <span className="time">{formatTime(position)}</span>
                            <input
                                type="range"
                                min="0"
                                max={duration}
                                value={position}
                                onChange={handleSeek}
                                className="progress-slider"
                                disabled={!player}
                            />
                            <span className="time">{formatTime(duration)}</span>
                        </div>
                    </div>
                    <div className="player-right">
                        <div className="volume-container">
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={volume}
                                onChange={handleVolumeChange}
                                className="volume-slider"
                                disabled={!player}
                            />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="player">Loading...</div>
            )}
        </div>
    );
}
