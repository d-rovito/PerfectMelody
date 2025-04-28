import { useState, useEffect } from "react";
import "./Home.css";

export default function Home({
  spotifyApi,
  accessToken,
  chooseTrack,
  onSectionChange,
}) {
  // State for user data, recent tracks, playlists, loading, and error handling
  const [user, setUser] = useState(null);
  const [recentTracks, setRecentTracks] = useState([]);
  const [userPlaylists, setUserPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  // Effect to fetch user data, recent tracks, and playlists
  useEffect(() => {
    // Skip fetching if required props are missing
    if (!accessToken || !spotifyApi) {
      setLoading(false);
      return;
    }

    spotifyApi.setAccessToken(accessToken);

    /**
     * Fetches user profile, recently played tracks, and playlists concurrently
     */
    const fetchData = async () => {
      try {
        setLoading(true);
        const [userResponse, recentResponse, playlistResponse] =
          await Promise.all([
            spotifyApi.getMe(),
            spotifyApi.getMyRecentlyPlayedTracks({ limit: 10 }).then((res) => {
              // Deduplicate tracks based on track ID
              const uniqueTracks = Array.from(
                new Map(
                  res.body.items.map((item) => [item.track.id, item])
                ).values()
              );
              return uniqueTracks;
            }),
            spotifyApi.getUserPlaylists({ limit: 6 }),
          ]);

        setUser(userResponse.body);
        setRecentTracks(recentResponse);
        setUserPlaylists(playlistResponse.body.items);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching home data:", error);
        setError("Failed to load content. Please try again later.");
        setLoading(false);
      }
    };

    fetchData();
  }, [accessToken, spotifyApi]);

  // Render authentication prompt if access token or API is missing
  if (!accessToken || !spotifyApi) {
    return (
      <div className="home-message">
        Please authenticate to view your music.
      </div>
    );
  }

  // Render loading state
  if (loading) {
    return <div className="home-message">Loading your music...</div>;
  }

  // Render error state
  if (error) {
    return <div className="home-message error">{error}</div>;
  }

  return (
    <div className="home">
      {/* User greeting with dynamic time-based message */}
      {user && (
        <h1 className="home-greeting">
          {getGreeting()}, {user.display_name || "User"}!
        </h1>
      )}

      {/* Recently Played Tracks Section */}
      <section className="home-section home-recently-played">
        <div className="home-section-header">
          <h2>Recently Played</h2>
        </div>
        <div className="home-track-list">
          {recentTracks.length > 0 ? (
            recentTracks.map((item) => (
              <div
                key={item.track.id}
                className="home-track-item"
                onClick={() => chooseTrack(item.track)}
              >
                <div className="home-track-image">
                  <img
                    src={
                      item.track.album.images?.[0]?.url || "/placeholder.jpg"
                    }
                    alt={`${item.track.name} album art`}
                  />
                  <div className="home-track-overlay">
                    <span className="play-icon">▶</span>
                  </div>
                </div>
                <p className="home-track-title">{item.track.name}</p>
                <p className="home-track-artist">
                  {item.track.artists[0].name}
                </p>
              </div>
            ))
          ) : (
            <p>No recently played tracks available.</p>
          )}
        </div>
      </section>

      {/* User Playlists Section */}
      <section className="home-section home-featured-playlists">
        <div className="home-section-header">
          <h2>Your Playlists</h2>
          {userPlaylists.length > 0 && (
            <button
              className="home-view-all"
              onClick={() => onSectionChange("playlists")}
            >
              View All
            </button>
          )}
        </div>
        <div className="home-playlist-grid">
          {userPlaylists.length > 0 ? (
            userPlaylists.map((playlist) => (
              <div
                key={playlist.id}
                className="home-playlist-item"
                onClick={() => onSectionChange("playlist", playlist.id)}
              >
                <div className="home-playlist-image">
                  <img
                    src={playlist.images?.[0]?.url || "/placeholder.jpg"}
                    alt={`${playlist.name} cover`}
                  />
                  <div className="home-playlist-overlay">
                    <span className="play-icon">▶</span>
                  </div>
                </div>
                <p className="home-playlist-title">{playlist.name}</p>
              </div>
            ))
          ) : (
            <p>No playlists available.</p>
          )}
        </div>
      </section>
    </div>
  );
}
