import React from 'react';
import { Container } from 'react-bootstrap';

// URL that will be used to authenticate users with Spotify (Scopes included)
const AUTH_URL = 
"https://accounts.spotify.com/authorize?client_id=73c8acfed3c743a685e0ea411471218d&response_type=code&redirect_uri=http://localhost:3000&scope=streaming%20user-read-email%20user-read-private%20user-library-read%20user-library-modify%20user-read-playback-state%20user-modify-playback-state%20user-read-recently-played%20playlist-modify-private%20playlist-modify-public";

export default function Login() {
  return (
    <Container
      className="d-flex justify-content-center align-items-center"
      style={{ minHeight: "100vh" }}
    >
      <a className="btn btn-success btn-lg" href={AUTH_URL}>
        Login With Spotify
      </a>
    </Container>
  )
}