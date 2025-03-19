// TrackSearchResult.js
import React from 'react';

export default function TrackSearchResult({ track, chooseTrack }) {
    function handlePlay() {
        chooseTrack(track);
    }

    return (
        <div
            className="track-result"
            style={{ cursor: "pointer" }}
            onClick={handlePlay}
        >
            <img src={track.albumUrl} alt={`${track.title} album cover`} />
            <div>
                <p>{track.title}</p>
                <p>{track.artist}</p>
            </div>
        </div>
    );
}