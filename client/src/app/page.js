'use client';
import { useState, useEffect } from 'react';
import Dashboard from './Dashboard';
import Login from './Login';
import useAuth from './useAuth';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function Page() {
  const [code, setCode] = useState(null);

  // Effect to check for the auth code in the URL
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const authCode = searchParams.get('code');
    // If the auth code is found, set it in the state
    if (authCode && authCode !== code) {
      setCode(authCode);
    }
  }, [code]);

  const accessToken = useAuth(code);

  // If the user is authenticated, render the Dashboard component
  // Otherwise, render the Login component
  return code ? <Dashboard code={code} /> : <Login />;
}