import { useState, useEffect } from "react";
import axios from "axios";

// Singleton to store auth data
const authState = {
  accessToken: null,
  refreshToken: null,
  expiresIn: null,
  hasFetched: false,
  isFetching: false, // New flag to prevent concurrent requests
};

export default function useAuth(code) {
  const [accessToken, setAccessToken] = useState(authState.accessToken);
  const [refreshToken, setRefreshToken] = useState(authState.refreshToken);
  const [expiresIn, setExpiresIn] = useState(authState.expiresIn);

  useEffect(() => {
    // Skip if no code, already fetched, or currently fetching
    if (!code || authState.hasFetched || authState.isFetching) {
      setAccessToken(authState.accessToken);
      setRefreshToken(authState.refreshToken);
      setExpiresIn(authState.expiresIn);
      return;
    }

    authState.isFetching = true; // Mark as fetching to block concurrent requests

    axios
      .post('http://localhost:3001/login', { code })
      .then(res => {
        authState.accessToken = res.data.accessToken;
        authState.refreshToken = res.data.refreshToken;
        authState.expiresIn = res.data.expiresIn;
        authState.hasFetched = true;
        authState.isFetching = false;
        setAccessToken(res.data.accessToken);
        setRefreshToken(res.data.refreshToken);
        setExpiresIn(res.data.expiresIn);
        window.history.pushState({}, null, '/');
      })
      .catch(err => {
        console.log('Login request failed:', err.response ? err.response.data : err);
        authState.isFetching = false;
        window.location = '/';
      });
  }, [code]); // Only depend on code

  useEffect(() => {
    if (!refreshToken || !expiresIn) return;

    const interval = setInterval(() => {
      axios
        .post('http://localhost:3001/refresh', { refreshToken })
        .then(res => {
          authState.accessToken = res.data.accessToken;
          authState.expiresIn = res.data.expiresIn;
          setAccessToken(res.data.accessToken);
          setExpiresIn(res.data.expiresIn);
        })
        .catch(err => {
          console.log('Refresh failed:', err.response ? err.response.data : err);
          window.location = '/';
        });
    }, (expiresIn - 60) * 1000);

    return () => clearInterval(interval);
  }, [refreshToken, expiresIn]);

  return accessToken;
}