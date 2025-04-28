import { useState, useEffect } from "react";
import useAuth from "./useAuth";
import SpotifyWebApi from "spotify-web-api-node";
import Player from "./Player";
import Sidebar from "./Sidebar";
import Search from "./Search";
import Home from "./Home";
import Playlists from "./Playlists";
import PlaylistDetail from "./PlaylistDetail";
import Users from "./Users";
import Recommendation from "./Recommendation";
import ArtistInfo from "./ArtistInfo";
import "./Dashboard.css";
import "./Sidebar.css";
import TrackSearchResult from "./TrackSearchResult";

const spotifyApi = new SpotifyWebApi({
  clientId: "73c8acfed3c743a685e0ea411471218d",
});

export default function Dashboard({ code }) {
  // State management for authentication, playback, and navigation
  const accessToken = useAuth(code);
  const [trackUris, setTrackUris] = useState([]); // Tracks to play
  const [playlistContext, setPlaylistContext] = useState(null); // Playlist playback context
  const [activeSection, setActiveSection] = useState("home"); // Current section (home, playlists, etc.)
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(null); // Selected playlist ID
  const [selectedArtistId, setSelectedArtistId] = useState(null); // Selected artist ID
  const [displayedResults, setDisplayedResults] = useState([]); // Search results
  const [searchQuery, setSearchQuery] = useState(""); // Search input query

  const chooseTrack = (
    track,
    additionalTracks = [],
    playlistUri = null,
    offset = null
  ) => {
    const uris = [track.uri, ...additionalTracks.map((t) => t.uri)];
    setTrackUris(uris);
    setPlaylistContext(
      playlistUri && offset !== null ? { uri: playlistUri, offset } : null
    );
  };

  // Effect to set Spotify API access token when available
  useEffect(() => {
    if (!accessToken) return;
    spotifyApi.setAccessToken(accessToken);
  }, [accessToken]);

  const handleSectionChange = (section, id = null) => {
    setActiveSection(section);
    setSelectedPlaylistId(section === "playlist" ? id : null);
    setSelectedArtistId(section === "artist" ? id : null);
    setDisplayedResults([]); // Clear search results on section change
  };


  const handlePlayerArtistClick = (artistId) => {
    setSelectedPlaylistId(null);
    setSelectedArtistId(artistId);
    setActiveSection("artist");
    setDisplayedResults([]);
  };


  const renderContent = () => {
    switch (activeSection) {
      case "playlists":
        return (
          <Playlists
            accessToken={accessToken}
            spotifyApi={spotifyApi}
            onPlaylistClick={handleSectionChange}
          />
        );
      case "playlist":
        return (
          <PlaylistDetail
            accessToken={accessToken}
            spotifyApi={spotifyApi}
            playlistId={selectedPlaylistId}
            chooseTrack={chooseTrack}
            onArtistClick={handleSectionChange}
          />
        );
      case "users":
        return <Users spotifyApi={spotifyApi} accessToken={accessToken} />;
      case "recommendation":
        return (
          <Recommendation
            spotifyApi={spotifyApi}
            accessToken={accessToken}
            chooseTrack={chooseTrack}
          />
        );
      case "artist":
        return selectedArtistId ? (
          <ArtistInfo
            accessToken={accessToken}
            spotifyApi={spotifyApi}
            artistId={selectedArtistId}
            chooseTrack={chooseTrack}
          />
        ) : (
          <div className="status-message">Loading artist...</div>
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
      {/* Sidebar for navigation */}
      <Sidebar
        onSectionChange={handleSectionChange}
        activeSection={activeSection}
      />

      <div className="main-content">
        {/* Search bar for querying tracks */}
        <Search
          spotifyApi={spotifyApi}
          accessToken={accessToken}
          chooseTrack={chooseTrack}
          setDisplayedResults={setDisplayedResults}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        {/* Main content area for rendering sections */}
        <div className="content-area">{renderContent()}</div>

        {/* Overlay for displaying search results */}
        {displayedResults.length > 0 && (
          <div
            className="search-results-overlay"
            onClick={() => setDisplayedResults([])}
          >
            {displayedResults.map((track) => (
              <TrackSearchResult
                track={track}
                key={track.uri}
                chooseTrack={chooseTrack}
              />
            ))}
          </div>
        )}

        {/* Player fixed at the bottom */}
        <div className="player-wrapper">
          <Player
            accessToken={accessToken}
            trackUri={trackUris}
            playlistContext={playlistContext}
            chooseTrack={chooseTrack}
            onPlayerArtistClick={handlePlayerArtistClick}
          />
        </div>
      </div>
    </div>
  );
}
