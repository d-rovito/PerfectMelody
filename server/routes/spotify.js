const express = require("express");
const axios = require("axios");
const router = express.Router();

const CLIENT_ID = "73c8acfed3c743a685e0ea411471218d";
const CLIENT_SECRET = "f95c11d8b24447678b2760d57cccf1c2";
const REDIRECT_URI = "http://localhost:3000/callback";

router.post("/", async (req, res) => {
  const { code } = req.body;
  const codeVerifier = req.session.codeVerifier; // Get stored code verifier

  const tokenUrl = "https://accounts.spotify.com/api/token";

  try {
    const response = await axios.post(tokenUrl, null, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(CLIENT_ID + ":" + CLIENT_SECRET).toString("base64")}`,
      },
      params: {
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI,
        code_verifier: codeVerifier,
      },
    });

    const { access_token, refresh_token } = response.data;
    res.json({ access_token, refresh_token });
  } catch (error) {
    console.error("Error exchanging authorization code:", error);
    res.status(500).json({ error: "Failed to exchange authorization code" });
  }
});

module.exports = router;
