import { useState, useEffect } from 'react';
import './Recommendation.css';

export default function Recommendations({ accessToken, spotifyApi, chooseTrack }) {
  const [tracks, setTracks] = useState([]);
  const [selectedTrackId, setSelectedTrackId] = useState('0ssxoYXlw70MY4lh3JsI9q'); // Default track ID
  const [trackDetails, setTrackDetails] = useState([]);
  const [loading, setLoading] = useState(false); // Loading state for disabling button

  // List of Example Songs to Try
  const trackIds = [
    '0ssxoYXlw70MY4lh3JsI9q',
    '2u9S9JJ6hTZS3Vf22HOZKg',
    '0aB0v4027ukVziUGwVGYpG',
    '0nn1kMhCkhQqqZdnKL7Ext'
  ];

  useEffect(() => {
    if (!accessToken || !spotifyApi) return;
    spotifyApi.setAccessToken(accessToken);

    const fetchTrackDetails = async () => {
      try {
        const response = await spotifyApi.getTracks(trackIds);
        setTrackDetails(response.body.tracks);
      } catch (error) {
        console.error('Error fetching track details:', error);
      }
    };

    fetchTrackDetails();
  }, [accessToken]);

  // Function to fetch recommendations based on selected track
  const fetchRecommendations = async () => {
    setLoading(true); // Disable button while fetching
    try {
      const response = await fetch('http://localhost:3001/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackId: selectedTrackId, accessToken, limit: 5 }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      const enrichedTracks = await spotifyApi.getTracks(data.map(track => track.id));
      setTracks(enrichedTracks.body.tracks);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    }
    setLoading(false);
  };

  // Update drag start: store full track data as JSON
  const handleDragStart = (e, track) => {
    e.dataTransfer.setData('trackData', JSON.stringify(track));
  };

  return (
    <div className="recommendations-container">
      <h2>Select a track for recommendations:</h2>
      <div className="track-selection">
        {trackDetails.map(track => (
          <div
            key={track.id}
            className={`track-card ${selectedTrackId === track.id ? 'selected' : ''}`}
            onClick={() => setSelectedTrackId(track.id)}
          >
            <img src={track.album.images[0]?.url} alt={track.name} className="track-img" />
            <p className="track-title">{track.name}</p>
            <p className="track-artist">{track.artists.map(artist => artist.name).join(', ')}</p>
          </div>
        ))}
      </div>

      <button className="fetch-btn" onClick={fetchRecommendations} disabled={loading}>
        {loading ? 'Loading...' : 'Get Recommendations'}
      </button>

      <h2>Recommended Tracks:</h2>
      <div className="track-results">
        {tracks.map(track => (
          <div
            key={track.id}
            className="track-card"
            onClick={() => chooseTrack(track)}
            draggable
            onDragStart={(e) => handleDragStart(e, track)}
            style={{ cursor: 'move' }}
          >
            <img src={track.album.images[0]?.url} alt={track.name} className="track-img" />
            <p className="track-title">{track.name}</p>
            <p className="track-artist">{track.artists.map(artist => artist.name).join(', ')}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
