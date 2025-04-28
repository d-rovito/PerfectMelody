import React, { useState, useEffect } from 'react';
import './ArtistInfo.css';

export default function ArtistInfo({
  accessToken,
  spotifyApi,
  artistId,
  chooseTrack,
}) {
  // State for artist data, top tracks, loading status, and error handling
  const [artist, setArtist] = useState(null);
  const [topTracks, setTopTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Effect to fetch artist details and top tracks when dependencies change
  useEffect(() => {
    // Skip fetching if required props are missing
    if (!accessToken || !spotifyApi) return;

    // Reset state if no artistId is provided
    if (!artistId) {
      setArtist(null);
      setTopTracks([]);
      setLoading(false);
      return;
    }

    /**
     * Fetches artist details and top tracks from Spotify API
     */
    const fetchArtistData = async () => {
      try {
        setLoading(true);

        // Fetch artist details
        const artistResponse = await spotifyApi.getArtist(artistId);
        setArtist(artistResponse.body);

        // Fetch top tracks (limited to 7) for the US market
        const topTracksResponse = await spotifyApi.getArtistTopTracks(
          artistId,
          "US"
        );
        setTopTracks(topTracksResponse.body.tracks.slice(0, 7));

        setLoading(false);
      } catch (err) {
        console.error("Error fetching artist data:", err);
        setError("Failed to load artist information. Please try again.");
        setLoading(false);
      }
    };

    fetchArtistData();
  }, [accessToken, spotifyApi, artistId]);

  /**
   * Handles track selection and passes track data to the chooseTrack callback
   * @param {object} track - Selected track object
   */
  const handleTrackClick = (track) => {
    if (chooseTrack) {
      // Filter out the selected track from the queue and set position to 0
      const queue = topTracks.filter((t) => t.id !== track.id);
      chooseTrack(track, queue, null, 0);
    }
  };

  // Render loading state
  if (loading) {
    return <div className="status-message">Loading artist info...</div>;
  }

  // Render error state
  if (error) {
    return <div className="status-message error">{error}</div>;
  }

  // Render null if no artist data is available
  if (!artist) {
    return null;
  }

  return (
    <div className="artist-info-container">
      {/* Artist Header Section */}
      <div className="artist-header">
        <img
          src={artist.images?.[0]?.url || "/placeholder.jpg"}
          alt={`${artist.name} profile`}
          className="artist-image"
        />
        <div className="artist-details">
          <h1>{artist.name}</h1>
          <p className="artist-genres">{artist.genres.join(", ")}</p>
          <p className="artist-stats">
            <span>Followers: {artist.followers.total.toLocaleString()}</span> •
            <span>Popularity: {artist.popularity}%</span>
          </p>
        </div>
      </div>

      {/* Top Tracks Section */}
      <div className="top-tracks">
        <h2>Top Tracks</h2>
        {topTracks.map((track) => (
          <div
            key={track.id}
            className="track-item"
            onClick={() => handleTrackClick(track)}
          >
            <img
              src={track.album.images?.[0]?.url || "/placeholder.jpg"}
              alt={track.name}
              className="track-image"
            />
            <p>{track.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}