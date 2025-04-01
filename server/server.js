require('dotenv').config();
const express = require('express');
const SpotifyWebApi = require('spotify-web-api-node');
const cors = require('cors');
const bodyParser = require('body-parser');

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
  const seedArtists = seedTrack.artists.map(a => a.id);
  const candidateArtists = candidateTrack.artists.map(a => a.id);
  const sharedArtists = seedArtists.filter(id => candidateArtists.includes(id));
  score += sharedArtists.length * 50; // Weight shared artists heavily

  // Genre overlap (if available)
  if (seedTrack.genres && candidateTrack.genres) {
    const sharedGenres = seedTrack.genres.filter(g => candidateTrack.genres.includes(g));
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
  const artistIds = track.body.artists.map(a => a.id);
  const artists = await spotifyApi.getArtists(artistIds);

  return {
    id: track.body.id,
    name: track.body.name,
    artists: track.body.artists.map(a => ({ id: a.id, name: a.name })),
    popularity: track.body.popularity,
    genres: artists.body.artists.flatMap(a => a.genres), // Combine genres from all artists
  };
}

// Recommendations endpoint
app.post('/recommendations', async (req, res) => {
  const { trackId, accessToken, limit = 5 } = req.body;

  if (!trackId || !accessToken) {
    return res.status(400).json({ error: 'Missing trackId or accessToken' });
  }

  try {
    const spotifyApi = getSpotifyApi(accessToken);

    // Get seed track data
    const seedTrack = await getTrackData(trackId, spotifyApi);

    // Fetch candidate tracks (e.g., search by artist or genre)
    const searchQuery = seedTrack.genres[0] || seedTrack.artists[0].name;
    const searchResults = await spotifyApi.searchTracks(searchQuery, { limit: 50 });

    const candidateTracks = searchResults.body.tracks.items
      .filter(track => track.id !== trackId) // Exclude seed track
      .slice(0, 20); // Limit candidates for performance

    // Fetch detailed data for candidates
    const candidateIds = candidateTracks.map(t => t.id);
    const detailedTracks = await spotifyApi.getTracks(candidateIds);

    const candidatesWithData = await Promise.all(
      detailedTracks.body.tracks.map(async (track) => {
        const artistIds = track.artists.map(a => a.id);
        const artists = await spotifyApi.getArtists(artistIds);
        return {
          id: track.id,
          name: track.name,
          artists: track.artists.map(a => ({ id: a.id, name: a.name })),
          popularity: track.popularity,
          genres: artists.body.artists.flatMap(a => a.genres),
        };
      })
    );

    // Calculate similarity scores
    const recommendations = candidatesWithData
      .map(track => ({
        id: track.id,
        name: track.name,
        artists: track.artists.map(a => a.name),
        similarity: calculateSimilarity(seedTrack, track),
      }))
      .sort((a, b) => b.similarity - a.similarity) // Higher score = more similar
      .slice(0, limit); // Top N results

    res.json(recommendations);
  } catch (err) {
    console.error('Recommendation error:', err.response ? err.response.data : err);
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});

app.post('/refresh', (req, res) => {
  const refreshToken = req.body.refreshToken;
  const spotifyApi = new SpotifyWebApi({
    redirectUri: process.env.REDIRECT_URI,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
  });

  spotifyApi.setRefreshToken(refreshToken);

  spotifyApi
    .refreshAccessToken()
    .then(data => {
      res.json({
        accessToken: data.body.access_token,
        expiresIn: data.body.expires_in,
      });
    })
    .catch(err => {
      console.log('Refresh error:', err.response ? err.response.data : err);
      res.sendStatus(400);
    });
});

app.post('/login', function(req, res) {
  const code = req.body.code;
  const spotifyApi = new SpotifyWebApi({
    redirectUri: 'http://localhost:3000',
    clientId: '73c8acfed3c743a685e0ea411471218d',
    clientSecret: 'f95c11d8b24447678b2760d57cccf1c2',
  });

  spotifyApi.authorizationCodeGrant(code).then(data => {
    res.json({
      accessToken: data.body.access_token,
      refreshToken: data.body.refresh_token,
      expiresIn: data.body.expires_in,
    });
  }).catch(err => {
    console.log('Login error:', err.response ? err.response.data : err);
    res.sendStatus(400);
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});