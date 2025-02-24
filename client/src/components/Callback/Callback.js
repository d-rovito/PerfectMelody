import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const CallbackPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");

    if (code) {
      fetch("http://localhost:3001/callback", {
        method: "POST",
        body: new URLSearchParams({ code }),
      })
        .then((res) => res.json())
        .then((data) => {
          localStorage.setItem("access_token", data.access_token);
          localStorage.setItem("refresh_token", data.refresh_token);
          navigate("/dashboard");
        })
        .catch((err) => console.error("Error during token exchange:", err));
    }
  }, [navigate]);

  return <div>Loading...</div>;
};

export default CallbackPage;
