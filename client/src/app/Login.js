import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import './Login.css';

// URL that will be used to authenticate users with Spotify (Scopes included)
const AUTH_URL = 
"https://accounts.spotify.com/authorize?client_id=73c8acfed3c743a685e0ea411471218d&response_type=code&redirect_uri=http://localhost:3000&scope=streaming%20user-read-email%20user-read-private%20user-library-read%20user-library-modify%20user-read-playback-state%20user-modify-playback-state%20user-read-recently-played%20playlist-modify-private%20playlist-modify-public%20playlist-read-private"

export default function Login() {
  return (
    <div className="login-page">
      <Container
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: '100vh' }}
      >
        <Row className="w-100">
          <Col md={6} lg={4} className="mx-auto">
            <div className="login-card">
              <div className="login-header">
                <img
                  src="/logo.png"
                  alt="Perfect Melody Logo"
                  className="login-logo"
                />
                <p className="login-subtitle">
                  Find your perfect melody with Spotify.
                </p>
              </div>
              <div className="login-body">
                <a className="btn btn-success btn-lg" href={AUTH_URL}>
                  Login With Spotify
                </a>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
      <footer className="login-footer">
        <p>
          © {new Date().getFullYear()} Perfect Melody.{' '}
          <a href="/about">About</a> | <a href="/terms">Terms</a>
        </p>
      </footer>
    </div>
  );
}