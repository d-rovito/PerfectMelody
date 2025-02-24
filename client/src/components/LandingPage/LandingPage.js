import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import crypto from "crypto-js";

const CLIENT_ID = "73c8acfed3c743a685e0ea411471218d";
const REDIRECT_URI = "http://localhost:3000/callback"; // Update if necessary
const AUTH_URL = "https://accounts.spotify.com/authorize";
const RESPONSE_TYPE = "code";
const SCOPE = "user-library-read"; // Customize based on your needs

// Function to generate random string for PKCE verifier
const generateRandomString = (length) => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// Function to generate PKCE code challenge
const generatePKCEChallenge = (codeVerifier) => {
  return crypto.SHA256(codeVerifier).toString(crypto.enc.Base64url);
};

const LoginPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const codeVerifier = generateRandomString(128);
    localStorage.setItem("codeVerifier", codeVerifier);
    const codeChallenge = generatePKCEChallenge(codeVerifier);
    localStorage.setItem("codeChallenge", codeChallenge);

    const authUrl = `${AUTH_URL}?response_type=${RESPONSE_TYPE}&client_id=${CLIENT_ID}&scope=${SCOPE}&redirect_uri=${REDIRECT_URI}&code_challenge=${codeChallenge}&code_challenge_method=S256`;

    window.location.href = authUrl;
  }, []);

  return (
    <div>
      <h1>Login to Spotify</h1>
    </div>
  );
};

export default LoginPage;
