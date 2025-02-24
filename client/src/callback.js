import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const CallbackPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Retrieve the authorization code from the URL
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");

    if (code) {
      // Send the authorization code to your backend for token exchange
      fetch("http://localhost:3001/callback", {
        method: "POST",
        body: new URLSearchParams({ code }),
      })
        .then((res) => res.json())
        .then((data) => {
          // Store the tokens in localStorage or session
          localStorage.setItem("access_token", data.access_token);
          localStorage.setItem("refresh_token", data.refresh_token);
          // Redirect to the dashboard or home page
          navigate("/dashboard");
        })
        .catch((err) => {
          console.error("Error during token exchange:", err);
        });
    }
  }, [navigate]);

  return <div>Loading...</div>;
};

export default CallbackPage;
