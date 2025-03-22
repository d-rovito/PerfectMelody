import { useState, useEffect } from 'react';
import { Container, Form } from 'react-bootstrap';
import './Search.css';

export default function Search({ spotifyApi, accessToken, chooseTrack, setDisplayedResults, searchQuery, setSearchQuery }) {
    const [searchResults, setSearchResults] = useState([]);

    // Effect to search for tracks when the search query changes
    useEffect(() => {
        if (!searchQuery) {
            setSearchResults([]);
            setDisplayedResults([]);
            return;
        }
        if (!accessToken) return;

        //  Cancel the previous search request if a new one is made
        let cancel = false;
        
        // Search for tracks using the Spotify API
        spotifyApi.searchTracks(searchQuery).then(res => {
            if (cancel) return;
            const results = res.body.tracks.items.map(track => {
                // Find the smallest album image
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
            // Set the search results and displayed results
            setSearchResults(results);
            setDisplayedResults(results);
        }).catch(err => {
            console.error('Search error:', err);
        });
        
        return () => (cancel = true);
    }, [searchQuery, accessToken, spotifyApi, setDisplayedResults]);

    return (
        <Container className="content">
            <div className="search-container">
                <Form.Control 
                    type="search" 
                    placeholder="Search Songs/Artists"
                    value={searchQuery} 
                    onChange={e => setSearchQuery(e.target.value)} 
                />
            </div>
        </Container>
    );
}