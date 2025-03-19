// Search.js
import { useState, useEffect } from 'react';
import { Container, Form } from 'react-bootstrap';
import TrackSearchResult from './TrackSearchResult';
import './Search.css';

export default function Search({ spotifyApi, accessToken, chooseTrack }) {
    const [search, setSearch] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [displayedResults, setDisplayedResults] = useState([]);

    useEffect(() => {
        if (!search) {
            setSearchResults([]);
            setDisplayedResults([]);
            return;
        }
        if (!accessToken) return;

        let cancel = false;

        spotifyApi.searchTracks(search).then(res => {
            if (cancel) return;
            const results = res.body.tracks.items.map(track => {
                const smallestAlbumImage = track.album.images.reduce(
                    (smallest, image) => {
                        if (image.height < smallest.height) return image;
                        return smallest;
                    }, track.album.images[0]);

                return {
                    artist: track.artists[0].name,
                    title: track.name,
                    uri: track.uri,
                    albumUrl: smallestAlbumImage.url
                };
            });
            setSearchResults(results);
            setDisplayedResults(results.slice(0, 6));
        }).catch(err => {
            console.error('Search error:', err);
        });

        return () => (cancel = true);
    }, [search, accessToken, spotifyApi]);

    const loadMoreResults = () => {
        setDisplayedResults(prevResults => {
            const newResults = searchResults.slice(prevResults.length, prevResults.length + 6);
            return [...prevResults, ...newResults];
        });
    };

    const handleScroll = (e) => {
        const element = e.target;
        const bottom = Math.abs(element.scrollHeight - (element.scrollTop + element.clientHeight)) <= 1;
        if (bottom) {
            loadMoreResults();
        }
    };

    return (
        <Container className="content">
            <div className="search-container">
                <Form.Control 
                    type="search" 
                    placeholder="Search Songs/Artists"
                    value={search} 
                    onChange={e => setSearch(e.target.value)} 
                />
                {search && displayedResults.length > 0 && (
                    <div 
                        className="search-results"
                        style={{ overflowY: "auto", maxHeight: "400px" }}
                        onScroll={handleScroll}
                    >
                        {displayedResults.map(track => (
                            <TrackSearchResult 
                                track={track} 
                                key={track.uri} 
                                chooseTrack={chooseTrack} 
                            />
                        ))}
                    </div>
                )}
            </div>
        </Container>
    );
}