import React from 'react';
import Image from 'next/image';
import './Sidebar.css';
import homeIcon from './assets/home.svg';
import playlistIcon from './assets/playlist.svg';
import personIcon from './assets/person.svg';
import recommendationIcon from './assets/recommendation.svg';

export default function Sidebar({ onSectionChange, activeSection }) {
    const handleClick = (section) => {
        onSectionChange(section);
    };

    return (
        <div className="sidebar">
            <a
                href="#home"
                onClick={() => handleClick('home')}
                className={activeSection === 'home' ? 'active' : ''}
            >
                <Image src={homeIcon} alt="Home" className="sidebar-icon" />
            </a>
            <a
                href="#playlists"
                onClick={() => handleClick('playlists')}
                className={activeSection === 'playlists' || activeSection === 'playlist' ? 'active' : ''}
            >
                <Image src={playlistIcon} alt="Playlists" className="sidebar-icon" />
            </a>
            <a
                href="#recommendation"
                onClick={() => handleClick('recommendation')}
                className={activeSection === 'recommendation' ? 'active' : ''}
            >
                <Image src={recommendationIcon} alt="Recommendation" className="sidebar-icon" />
            </a>
            <a
                href="#users"
                onClick={() => handleClick('users')}
                className={activeSection === 'users' ? 'active' : ''}
            >
                <Image src={personIcon} alt="Users" className="sidebar-icon" />
            </a>
        </div>
    );
}