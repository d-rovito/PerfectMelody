"use client"; // Ensure this file runs as a client component

import "bootstrap/dist/css/bootstrap.min.css"
import Login from "./Login"
import Dashboard from "./Dashboard"

const code = new URLSearchParams(window.location.search).get("code")

export default function App() {
  return code ? <Dashboard code={code} /> : <Login />
}

