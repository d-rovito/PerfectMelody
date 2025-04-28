import { useState, useEffect } from "react";
import SpotifyWebApi from "spotify-web-api-node";
import Image from 'next/image';
import './Player.css';
import playIcon from './assets/play.svg';
import pauseIcon from './assets/pause.svg';
import skipIcon from './assets/skip.svg';
import previousIcon from './assets/previous.svg';
import volumeHighIcon from './assets/volume-high.svg';
import volumeLowIcon from './assets/volume-low.svg';
import volumeMuteIcon from './assets/volume-mute.svg';
import queueIcon from './assets/queue.svg';

const spotifyApi = new SpotifyWebApi();

export default function Player({ accessToken, trackUri, playlistContext, chooseTrack, onPlayerArtistClick }) {
    const [player, setPlayer] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [deviceId, setDeviceId] = useState(null);
    const [currentTrack, setCurrentTrack] = useState(null);
    const [volume, setVolume] = useState(0.5);
    const [position, setPosition] = useState(0);
    const [duration, setDuration] = useState(0);
    const [error, setError] = useState(null);
    const [showQueue, setShowQueue] = useState(false);
    const [queueTracks, setQueueTracks] = useState([]);

    useEffect(() => {
        if (!accessToken) return;

        spotifyApi.setAccessToken(accessToken);

        const script = document.createElement("script");
        script.src = "https://sdk.scdn.co/spotify-player.js";
        script.async = true;
        document.body.appendChild(script);

        window.onSpotifyWebPlaybackSDKReady = () => {
            const spotifyPlayer = new Spotify.Player({
                name: "Next.js Spotify Player",
                getOAuthToken: (cb) => cb(accessToken),
                volume: volume,
            });

            spotifyPlayer.addListener("ready", ({ device_id }) => {
                setDeviceId(device_id);
                setPlayer(spotifyPlayer);
                setError(null);
            });

            spotifyPlayer.addListener("player_state_changed", (state) => {
                if (state) {
                    setIsPlaying(!state.paused);
                    if (state.track_window.current_track) {
                        const sdkTrack = state.track_window.current_track;
                        if (!sdkTrack.artists || !sdkTrack.artists[0]?.id) {
                            spotifyApi.getTrack(sdkTrack.id)
                                .then((response) => {
                                    setCurrentTrack(response.body);
                                    setDuration(state.duration);
                                    setPosition(state.position);
                                })
                                .catch((err) => {
                                    console.error("Error fetching track details:", err);
                                    setCurrentTrack(sdkTrack);
                                    setDuration(state.duration);
                                    setPosition(state.position);
                                    setError("Failed to fetch track details");
                                });
                        } else {
                            setCurrentTrack(sdkTrack);
                            setDuration(state.duration);
                            setPosition(state.position);
                        }
                    }
                }
            });

            spotifyPlayer.addListener("not_ready", ({ device_id }) => {
                setError("Device is offline");
            });

            spotifyPlayer.addListener("initialization_error", ({ message }) => {
                setError(`Player initialization failed: ${message}`);
            });

            spotifyPlayer.connect();
        };

        return () => {
            if (player) player.disconnect();
            document.body.removeChild(script);
        };
    }, [accessToken]);

    useEffect(() => {
        if (!player || !isPlaying) return;

        const interval = setInterval(async () => {
            const state = await player.getCurrentState();
            if (state) {
                setPosition(state.position);
                setDuration(state.duration);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [player, isPlaying]);

    useEffect(() => {
        if (!player || !deviceId || (!trackUri && !playlistContext)) return;

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
                    // Ensure only unique URIs are sent
                    const uniqueUris = [...new Set(trackUri)];
                    await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
                        method: "PUT",
                        body: JSON.stringify({ uris: uniqueUris }),
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${accessToken}`,
                        },
                    });
                }
                setIsPlaying(true);
                setError(null);
            } catch (error) {
                console.error("Error playing track:", error);
                setError("Failed to play track");
            }
        };

        playTrack();
    }, [trackUri, playlistContext, deviceId, player, accessToken]);

    const handleVolumeChange = (e) => {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
        if (player) {
            player.setVolume(newVolume).catch((error) => {
                console.error("Error adjusting volume:", error);
                setError("Failed to adjust volume");
            });
        }
    };

    const playNextTrack = async () => {
        if (!player) return;
        try {
            await player.nextTrack();
            const state = await player.getCurrentState();
            if (state && state.track_window.current_track) {
                setCurrentTrack(state.track_window.current_track);
                setPosition(state.position);
                setDuration(state.duration);
                setError(null);
            }
        } catch (error) {
            console.error("Error playing next track:", error);
            setError("Failed to play next track");
        }
    };

    const playPreviousTrack = async () => {
        if (!player) return;
        try {
            await player.previousTrack();
            const state = await player.getCurrentState();
            if (state && state.track_window.current_track) {
                setCurrentTrack(state.track_window.current_track);
                setPosition(state.position);
                setDuration(state.duration);
                setError(null);
            }
        } catch (error) {
            console.error("Error playing previous track:", error);
            setError("Failed to play previous track");
        }
    };

    const handleSeek = (e) => {
        const newPosition = parseInt(e.target.value, 10);
        setPosition(newPosition);
        if (player) {
            player.seek(newPosition).catch((error) => {
                console.error("Error seeking track:", error);
                setError("Failed to seek track");
            });
        }
    };

    const formatTime = (ms) => {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');
        const trackData = e.dataTransfer.getData('trackData');
        if (trackData) {
            try {
                const droppedTrack = JSON.parse(trackData);
                chooseTrack(droppedTrack);
            } catch (error) {
                console.error("Error processing dropped track:", error);
                setError("Failed to process dropped track");
            }
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.currentTarget.classList.add('drag-over');
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');
    };

    const getVolumeIcon = () => {
        if (volume === 0) return volumeMuteIcon;
        if (volume < 0.5) return volumeLowIcon;
        return volumeHighIcon;
    };

    const fetchQueue = async () => {
        try {
            const response = await fetch('https://api.spotify.com/v1/me/player/queue', {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            if (!response.ok) {
                throw new Error(`Failed to fetch queue: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            // Deduplicate tracks based on URI
            const uniqueTracks = [];
            const seenUris = new Set();
            for (const track of data.queue || []) {
                if (track?.uri && !seenUris.has(track.uri)) {
                    uniqueTracks.push(track);
                    seenUris.add(track.uri);
                }
            }
            setQueueTracks(uniqueTracks);
            setError(null);
        } catch (error) {
            console.error("Error fetching queue:", error.message, error.stack);
            setError("Failed to fetch queue");
            setQueueTracks([]);
        }
    };

    const toggleQueue = () => {
        if (!showQueue) {
            fetchQueue();
        }
        setShowQueue(!showQueue);
    };

    if (!trackUri && !playlistContext) {
        return (
            <div className="player">
                <p className="no-track">No track selected</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="player">
                <p className="error-message">{error}</p>
            </div>
        );
    }

    return (
        <div className="player" onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}>
            {currentTrack ? (
                <div className="player-content">
                    <div className="track-left">
                        <div className={`track-image-container ${isPlaying ? 'playing' : ''}`}>
                            <Image
                                src={currentTrack.album?.images[0]?.url || "/placeholder.png"}
                                alt="Track cover"
                                className="player-track-image"
                                width={80}
                                height={80}
                                objectFit="cover"
                                unoptimized
                            />
                        </div>
                        <div className="track-info">
                            <h3 className="track-title">{currentTrack.name}</h3>
                            <p
                                className="track-artist clickable-artist"
                                onClick={() => {
                                    if (!currentTrack?.artists?.[0]?.id) {
                                        console.warn('No valid artist ID found for current track:', currentTrack);
                                        return;
                                    }
                                    onPlayerArtistClick(currentTrack.artists[0].id);
                                }}
                                style={{ cursor: 'pointer', zIndex: 10 }}
                            >
                                {currentTrack?.artists?.[0]?.name || 'Unknown Artist'}
                            </p>
                        </div>
                    </div>
                    <div className="player-center">
                        <div className="player-controls">
                            <button onClick={playPreviousTrack} disabled={!player} title="Previous Track">
                                <Image src={previousIcon} alt="Previous" className="control-icon" />
                            </button>
                            <button onClick={() => player.togglePlay()} disabled={!player} title={isPlaying ? "Pause" : "Play"}>
                                <Image
                                    src={isPlaying ? pauseIcon : playIcon}
                                    alt={isPlaying ? "Pause" : "Play"}
                                    className="control-icon play-pause"
                                />
                            </button>
                            <button onClick={playNextTrack} disabled={!player} title="Next Track">
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
                            <Image src={getVolumeIcon()} alt="Volume" className="volume-icon" />
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
                        <button
                            onClick={toggleQueue}
                            disabled={!player}
                            title="Show Queue"
                            className="queue-button"
                            aria-label="Show queue"
                        >
                            <Image src={queueIcon} alt="Queue" className="control-icon" />
                        </button>
                    </div>
                </div>
            ) : (
                <div className="player-loading">
                    <div className="spinner"></div>
                    <p>Waiting...</p>
                </div>
            )}

            {showQueue && (
                <div className="queue-modal" role="dialog" aria-labelledby="queue-title">
                    <div className="queue-modal-content">
                        <div className="queue-header">
                            <h3 id="queue-title">Queue</h3>
                            <button
                                onClick={toggleQueue}
                                className="close-queue-button"
                                aria-label="Close queue"
                            >
                                ×
                            </button>
                        </div>
                        <div className="queue-list">
                            {queueTracks.length > 0 ? (
                                queueTracks.map((track, index) => (
                                    <div key={track.uri || index} className="queue-item">
                                        <img
                                            src={track.album?.images[0]?.url || "/placeholder.png"}
                                            alt="Track cover"
                                            className="queue-track-image"
                                            width={40}
                                            height={40}
                                        />
                                        <div className="queue-track-info">
                                            <p className="queue-track-title">{track.name}</p>
                                            <p className="queue-track-artist">{track.artists?.[0]?.name || 'Unknown Artist'}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="no-queue">No tracks in queue</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}