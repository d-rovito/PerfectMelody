"use client";
import React, { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import TinderCard from "react-tinder-card";
import "./Recommendation.css";
import LikeIcon from "./assets/like.svg";
import DislikeIcon from "./assets/dislike.svg";
import PlayIcon from "./assets/play.svg";

export default function Recommendations({
  accessToken,
  spotifyApi,
  chooseTrack,
}) {
  const [tracks, setTracks] = useState([]);
  const [selectedTrackId, setSelectedTrackId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showTrackSelection, setShowTrackSelection] = useState(true);
  const [likedSongs, setLikedSongs] = useState([]);

  React.useEffect(() => {
    if (!accessToken || !spotifyApi) return;
    spotifyApi.setAccessToken(accessToken);
  }, [accessToken, spotifyApi]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const response = await spotifyApi.searchTracks(searchQuery, {
        limit: 10,
      });
      setSearchResults(response.body.tracks.items);
    } catch (error) {
      console.error("Error searching tracks:", error);
    }
    setLoading(false);
  };

  const fetchRecommendations = async () => {
    if (!selectedTrackId) return;
    setLoading(true);
    try {
      const response = await fetch("http://localhost:3001/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackId: selectedTrackId,
          accessToken,
          limit: 5,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      const enrichedTracks = await spotifyApi.getTracks(
        data.map((track) => track.id)
      );
      setTracks(enrichedTracks.body.tracks);
      setShowTrackSelection(false);
      // Add selected track to likedSongs
      const selectedTrack = searchResults.find(
        (track) => track.id === selectedTrackId
      );
      if (
        selectedTrack &&
        !likedSongs.some((song) => song.id === selectedTrack.id)
      ) {
        setLikedSongs([selectedTrack]);
      }
    } catch (error) {
      console.error("Error fetching recommendations:", error);
    }
    setLoading(false);
  };

  const fetchAIRecommendations = async (retryAttempt = 0) => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:3001/ai-recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackIds: likedSongs.map((song) => song.id),
          accessToken,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        console.error("Bad response:", data.error);
        return;
      }

      if (!Array.isArray(data) || data.length === 0) {
        console.error("No valid AI-recommended tracks received.");
        if (retryAttempt < 1) {
          console.warn("Retrying Grok once...");
          return fetchAIRecommendations(retryAttempt + 1);
        }
        return;
      }

      const validTrackIds = data.filter(
        (id) => id && typeof id === "string" && id.trim() !== ""
      );
      if (validTrackIds.length === 0) {
        console.error("No valid Spotify track IDs to fetch.");
        if (retryAttempt < 1) {
          console.warn("Retrying Grok once...");
          return fetchAIRecommendations(retryAttempt + 1);
        }
        return;
      }

      const enrichedTracks = await spotifyApi.getTracks(validTrackIds);

      setTracks((prev) => [
        ...prev,
        ...enrichedTracks.body.tracks.filter((track) => track),
      ]);
    } catch (error) {
      console.error("Error fetching AI recommendations:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (tracks.length > 0 && tracks.length <= 3 && likedSongs.length >= 3) {
      fetchAIRecommendations();
    }
  }, [tracks.length, likedSongs.length]);

  const handleBack = () => {
    setShowTrackSelection(true);
    setSearchQuery("");
    setSearchResults([]);
    setSelectedTrackId(null);
  };

  const childRefs = useMemo(
    () =>
      Array(tracks.length)
        .fill(0)
        .map(() => React.createRef()),
    [tracks.length]
  );

  const handlePlay = (track, event) => {
    event.stopPropagation();
    console.log(`Play button clicked for: ${track.name}`);
    console.log(`Playing: ${track.name}`);
    chooseTrack(track);
  };

  const handleCardClick = (event) => {
    console.log("Tinder card clicked:", event.target);
  };

  const addToPlaylist = async (trackId) => {
    try {
      const response = await fetch("http://localhost:3001/add-to-playlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackId, accessToken }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      console.log(data.message);
    } catch (error) {
      console.error("Error adding track to playlist:", error);
    }
  };

  const onSwipe = (direction, track, index) => {
    if (
      direction === "right" &&
      !likedSongs.some((song) => song.id === track.id)
    ) {
      setLikedSongs((prev) => [...prev, track]);
      addToPlaylist(track.id);
      if (likedSongs.length + 1 >= 3) {
        fetchAIRecommendations();
      }
    }
    setTracks((prev) => prev.filter((_, i) => i !== index));
  };

  const swipe = (dir, index) => {
    const card = childRefs[index].current;
    if (card) card.swipe(dir);
  };

  const onCardMove = (x, y, card) => {
    const threshold = 100;
    if (x > threshold) {
      card.style.border = "2px solid #1db954";
      card.style.transform = `translate(${x}px, ${y}px) rotate(10deg)`;
    } else if (x < -threshold) {
      card.style.border = "2px solid #ff4d4f";
      card.style.transform = `translate(${x}px, ${y}px) rotate(-10deg)`;
    } else {
      card.style.border = "2px solid transparent";
      card.style.transform = `translate(${x}px, ${y}px)`;
    }
  };

  return (
    <div className="recommendations-container">
      {showTrackSelection ? (
        <>
          <h2>Search for a track to get recommendations:</h2>
          <div className="search-container">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter song name..."
              className="search-input"
            />
            <button
              className="fetch-btn"
              onClick={handleSearch}
              disabled={loading || !searchQuery.trim()}
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </div>
          {searchResults.length > 0 && (
            <div className="track-selection">
              {searchResults.map((track) => (
                <div
                  key={track.id}
                  className={`track-card ${
                    selectedTrackId === track.id ? "selected" : ""
                  }`}
                  onClick={() => setSelectedTrackId(track.id)}
                >
                  <img
                    src={track.album.images[0]?.url}
                    alt={track.name}
                    className="track-img"
                    draggable="false"
                  />
                  <p className="rec-track-title">{track.name}</p>
                  <p className="rec-track-artist">
                    {track.artists.map((artist) => artist.name).join(", ")}
                  </p>
                </div>
              ))}
            </div>
          )}
          {searchResults.length > 0 && (
            <button
              className="fetch-btn"
              onClick={fetchRecommendations}
              disabled={loading || !selectedTrackId}
            >
              {loading ? "Loading..." : "Get Recommendations"}
            </button>
          )}
        </>
      ) : (
        <button className="back-btn" onClick={handleBack}>
          Back
        </button>
      )}

      <h2>Recommended Tracks:</h2>
      <div className="tinder-card-container">
        {tracks
          .slice(0)
          .reverse()
          .map((track, index) => (
            <TinderCard
              ref={childRefs[index]}
              className="swipe"
              key={track.id}
              onSwipe={(dir) => onSwipe(dir, track, index)}
              onCardMove={onCardMove}
              preventSwipe={["up", "down"]}
              swipeRequirementType="position"
              swipeThreshold={150}
              onClick={handleCardClick}
            >
              <div className="tinder-card">
                <img
                  src={track.album.images[0]?.url}
                  alt={track.name}
                  className="tinder-track-img"
                  draggable="false"
                />
                <h3 className="tinder-track-title">{track.name}</h3>
                <p className="tinder-track-artist">
                  {track.artists.map((artist) => artist.name).join(", ")}
                </p>
                <div className="play-btn-wrapper">
                  <button
                    className="play-btn"
                    onClick={(e) => handlePlay(track, e)}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <Image src={PlayIcon} alt="Play" className="button-icon" />
                  </button>
                </div>
                <div className="tinder-buttons">
                  <button
                    className="tinder-btn pass"
                    onClick={(e) => {
                      e.stopPropagation();
                      swipe("left", index);
                    }}
                  >
                    <Image
                      src={DislikeIcon}
                      alt="Dislike"
                      className="button-icon"
                    />
                  </button>
                  <button
                    className="tinder-btn like"
                    onClick={(e) => {
                      e.stopPropagation();
                      swipe("right", index);
                    }}
                  >
                    <Image src={LikeIcon} alt="Like" className="button-icon" />
                  </button>
                </div>
              </div>
            </TinderCard>
          ))}
      </div>
      {loading && (
        <div className="spinner-container">
          <div className="spinner"></div>
        </div>
      )}
    </div>
  );
}
