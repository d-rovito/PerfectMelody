'use client';
import { useState, useEffect } from 'react';
import Dashboard from './Dashboard';
import Login from './Login';
import useAuth from './useAuth';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function MainApp() {
  const [code, setCode] = useState(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const authCode = searchParams.get('code');
    if (authCode && authCode !== code) {
      setCode(authCode);
    }
  }, [code]);

  const accessToken = useAuth(code);

  return code ? <Dashboard code={code} /> : <Login />;
}