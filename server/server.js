require("dotenv").config();
const express = require("express");
const SpotifyWebApi = require("spotify-web-api-node");
const cors = require("cors");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
const port = 3001;

app.use(cors());
app.use(bodyParser.json());

// Helper function to initialize Spotify API with access token
const getSpotifyApi = (accessToken) => {
  const spotifyApi = new SpotifyWebApi({
    redirectUri: process.env.REDIRECT_URI,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
  });
  spotifyApi.setAccessToken(accessToken);
  return spotifyApi;
};

// Calculate similarity between two tracks
function calculateSimilarity(seedTrack, candidateTrack) {
  let score = 0;

  // Shared artists (exact match)
  const seedArtists = seedTrack.artists.map((a) => a.id);
  const candidateArtists = candidateTrack.artists.map((a) => a.id);
  const sharedArtists = seedArtists.filter((id) =>
    candidateArtists.includes(id)
  );
  score += sharedArtists.length * 50; // Weight shared artists heavily

  // Genre overlap (if available)
  if (seedTrack.genres && candidateTrack.genres) {
    const sharedGenres = seedTrack.genres.filter((g) =>
      candidateTrack.genres.includes(g)
    );
    score += sharedGenres.length * 20; // Weight genres
  }

  // Popularity proximity (0-100 scale)
  const popDiff = Math.abs(seedTrack.popularity - candidateTrack.popularity);
  score += (100 - popDiff) / 2; // Closer popularity = higher score

  return score;
}

// Fetch track and artist data
async function getTrackData(trackId, spotifyApi) {
  const track = await spotifyApi.getTrack(trackId);
  const artistIds = track.body.artists.map((a) => a.id);
  const artists = await spotifyApi.getArtists(artistIds);

  return {
    id: track.body.id,
    name: track.body.name,
    artists: track.body.artists.map((a) => ({ id: a.id, name: a.name })),
    popularity: track.body.popularity,
    genres: artists.body.artists.flatMap((a) => a.genres), // Combine genres from all artists
  };
}

// Recommendations endpoint
app.post("/recommendations", async (req, res) => {
  const { trackId, accessToken, limit = 5 } = req.body;

  if (!trackId || !accessToken) {
    return res.status(400).json({ error: "Missing trackId or accessToken" });
  }

  try {
    const spotifyApi = getSpotifyApi(accessToken);

    // Get seed track data
    const seedTrack = await getTrackData(trackId, spotifyApi);

    // Fetch candidate tracks (e.g., search by artist or genre)
    const searchQuery = seedTrack.genres[0] || seedTrack.artists[0].name;
    const searchResults = await spotifyApi.searchTracks(searchQuery, {
      limit: 50,
    });

    const candidateTracks = searchResults.body.tracks.items
      .filter((track) => track.id !== trackId) // Exclude seed track
      .slice(0, 20); // Limit candidates for performance

    // Fetch detailed data for candidates
    const candidateIds = candidateTracks.map((t) => t.id);
    const detailedTracks = await spotifyApi.getTracks(candidateIds);

    const candidatesWithData = await Promise.all(
      detailedTracks.body.tracks.map(async (track) => {
        const artistIds = track.artists.map((a) => a.id);
        const artists = await spotifyApi.getArtists(artistIds);
        return {
          id: track.id,
          name: track.name,
          artists: track.artists.map((a) => ({ id: a.id, name: a.name })),
          popularity: track.popularity,
          genres: artists.body.artists.flatMap((a) => a.genres),
        };
      })
    );

    // Calculate similarity scores
    const recommendations = candidatesWithData
      .map((track) => ({
        id: track.id,
        name: track.name,
        artists: track.artists.map((a) => a.name),
        similarity: calculateSimilarity(seedTrack, track),
      }))
      .sort((a, b) => b.similarity - a.similarity) // Higher score = more similar
      .slice(0, limit); // Top N results

    res.json(recommendations);
  } catch (err) {
    console.error(
      "Recommendation error:",
      err.response ? err.response.data : err
    );
    res.status(500).json({ error: "Failed to generate recommendations" });
  }
});

// New /ai-recommendations endpoint
app.post("/ai-recommendations", async (req, res) => {
  const { trackIds, accessToken } = req.body;

  const spotifyApi = getSpotifyApi(accessToken);

  try {
    // Fetch track details for AI prompt
    const trackResponse = await spotifyApi.getTracks(trackIds);
    const tracks = trackResponse.body.tracks;
    const songList = tracks
      .map(
        (track) =>
          `${track.name} by ${track.artists.map((a) => a.name).join(", ")}`
      )
      .join("; ");

    // Query xAI Grok API
    const xaiResponse = await axios.post(
      "https://api.x.ai/v1/chat/completions",
      {
        model: "grok-beta",
        messages: [
          {
            role: "user",
            content: `A user likes these songs: ${songList}. Recommend 20 songs similar to those listed, in the format: Song Name - Artist. Avoid using the same artist more than 3 times (excluding features). Prioritize newer music (last 3 years). Avoid hallucinations and only include songs that exist on Spotify. Do not include any other text.`,
          },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.XAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    // Parse Grok response
    const aiSongs = xaiResponse.data.choices[0].message.content
      .split("\n")
      .filter((line) => line.includes(" - "))
      .slice(0, 20);

    // Search Spotify for AI-recommended songs
    const trackIdsFound = [];
    for (const song of aiSongs) {
      const [songName, artist] = song.split(" - ");
      try {
        const searchResponse = await spotifyApi.searchTracks(
          `track:${songName} artist:${artist}`,
          { limit: 1 }
        );
        const foundTrack = searchResponse.body.tracks.items[0];
        if (foundTrack) trackIdsFound.push(foundTrack.id);
      } catch (error) {
        console.error(`Error searching for ${song}:`, error);
      }
    }

    if (trackIdsFound.length === 0) {
      return res
        .status(404)
        .json({ error: "No AI-recommended tracks found on Spotify" });
    }

    res.json(trackIdsFound);
  } catch (error) {
    console.error("Error in /ai-recommendations:", error);
    res.status(500).json({ error: error.message });
  }
});

// New endpoint to add a track to "Perfect Melody Likes" playlist
app.post("/add-to-playlist", async (req, res) => {
  const { trackId, accessToken } = req.body;

  if (!trackId || !accessToken) {
    return res.status(400).json({ error: "Missing trackId or accessToken" });
  }

  try {
    const spotifyApi = getSpotifyApi(accessToken);

    // Get the user's ID
    const user = await spotifyApi.getMe();
    const userId = user.body.id;

    // Fetch user's playlists
    let playlistId = null;
    let playlists = [];
    let offset = 0;
    const limit = 50;

    // Paginate through playlists to find "Perfect Melody Likes"
    while (true) {
      const response = await spotifyApi.getUserPlaylists(userId, {
        limit,
        offset,
      });
      playlists = response.body.items;
      const targetPlaylist = playlists.find(
        (p) => p.name === "Perfect Melody Likes" && p.owner.id === userId
      );

      if (targetPlaylist) {
        playlistId = targetPlaylist.id;
        break;
      }

      if (response.body.next === null) break;
      offset += limit;
    }

    // Create playlist if it doesn't exist
    if (!playlistId) {
      const newPlaylist = await spotifyApi.createPlaylist(
        "Perfect Melody Likes",
        {
          description: "Songs liked from recommendations",
          public: false,
        }
      );
      playlistId = newPlaylist.body.id;
    }

    // Add track to playlist
    await spotifyApi.addTracksToPlaylist(playlistId, [
      `spotify:track:${trackId}`,
    ]);

    res.json({ message: `Track ${trackId} added to Perfect Melody Likes` });
  } catch (err) {
    console.error(
      "Error adding track to playlist:",
      err.response ? err.response.data : err
    );
    res.status(500).json({ error: "Failed to add track to playlist" });
  }
});

app.post("/refresh", (req, res) => {
  const refreshToken = req.body.refreshToken;
  const spotifyApi = new SpotifyWebApi({
    redirectUri: process.env.REDIRECT_URI,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
  });

  spotifyApi.setRefreshToken(refreshToken);

  spotifyApi
    .refreshAccessToken()
    .then((data) => {
      res.json({
        accessToken: data.body.access_token,
        expiresIn: data.body.expires_in,
      });
    })
    .catch((err) => {
      console.log("Refresh error:", err.response ? err.response.data : err);
      res.sendStatus(400);
    });
});

app.post("/login", function (req, res) {
  const code = req.body.code;
  const spotifyApi = new SpotifyWebApi({
    redirectUri: process.env.REDIRECT_URI,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
  });

  spotifyApi
    .authorizationCodeGrant(code)
    .then((data) => {
      res.json({
        accessToken: data.body.access_token,
        refreshToken: data.body.refresh_token,
        expiresIn: data.body.expires_in,
      });
    })
    .catch((err) => {
      console.log("Login error:", err.response ? err.response.data : err);
      res.sendStatus(400);
    });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
