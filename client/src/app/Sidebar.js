import React from 'react';
import './Sidebar.css';

export default function Sidebar() {
    return (
        <div className="sidebar">
            <a href="#home">Home</a>
            <a href="#playlists">Playlists</a>
            <a href="#users">Users</a>
        </div>
    );
};