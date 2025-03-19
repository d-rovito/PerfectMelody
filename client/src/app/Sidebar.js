import React from 'react';
import Image from 'next/image';
import './Sidebar.css';
import homeIcon from './assets/home.svg';
import playlistIcon from './assets/playlist.svg'; // Corrected name
import personIcon from './assets/person.svg';

export default function Sidebar() {
    return (
        <div className="sidebar">
            <a href="#home">
                <Image src={homeIcon} alt="Home" className="sidebar-icon" />
            </a>
            <a href="#playlists">
                <Image src={playlistIcon} alt="Playlists" className="sidebar-icon" />
            </a>
            <a href="#users">
                <Image src={personIcon} alt="Users" className="sidebar-icon" />
            </a>
        </div>
    );
}