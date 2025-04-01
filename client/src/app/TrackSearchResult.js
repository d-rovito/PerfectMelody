import React from 'react';

export default function TrackSearchResult({ track, chooseTrack }) {
  const handlePlay = () => {
    chooseTrack(track);
  };

  // Add drag start handler to store the full track data as JSON
  const handleDragStart = (e) => {
    e.dataTransfer.setData('trackData', JSON.stringify(track));
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div 
      className="track-result" 
      style={{ cursor: 'pointer' }} 
      onClick={handlePlay}
      draggable
      onDragStart={handleDragStart}
    >
      <img src={track.albumUrl} alt={`${track.title} album cover`} />
      <div>
        <p>{track.title}</p>
        <p>{track.artist}</p>
      </div>
    </div>
  );
}
