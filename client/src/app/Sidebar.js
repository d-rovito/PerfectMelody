import React from 'react';
import Image from 'next/image';
import './Sidebar.css';
import homeIcon from './assets/home.svg';
import playlistIcon from './assets/playlist.svg';
import personIcon from './assets/person.svg';
import recommendationIcon from './assets/recommendation.svg';

export default function Sidebar({ onSectionChange }) {
    const handleClick = (section) => {
        onSectionChange(section);
    };

    return (
        <div className="sidebar">
            <a href="#home" onClick={() => handleClick('home')}>
                <Image src={homeIcon} alt="Home" className="sidebar-icon" />
            </a>
            <a href="#playlists" onClick={() => handleClick('playlists')}>
                <Image src={playlistIcon} alt="Playlists" className="sidebar-icon" />
            </a>
            <a href="#recommendation" onClick={() => handleClick('recommendation')}>
                <Image src={recommendationIcon} alt="recommendation" className="sidebar-icon" />
            </a>
            <a href="#users" onClick={() => handleClick('users')}>
                <Image src={personIcon} alt="Users" className="sidebar-icon" />
            </a>
        </div>
    );
}