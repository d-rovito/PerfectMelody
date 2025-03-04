import { useState, useEffect } from 'react';
import useAuth from './useAuth';
import { Container, Form } from 'react-bootstrap';
import SpotifyWebApi from 'spotify-web-api-node';
import TrackSearchResult from './TrackSearchResult';
import Player from './Player';
import Sidebar from './Sidebar';
import './Dashboard.css';
import './Sidebar.css';

const spotifyApi = new SpotifyWebApi({
    clientId: "73c8acfed3c743a685e0ea411471218d"
});

export default function Dashboard({ code }) {
    const accessToken = useAuth(code);
    const [search, setSearch] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [playingTrack, setPlayingTrack] = useState(null);
    const [displayedResults, setDisplayedResults] = useState([]);

    function chooseTrack(track) {
        setPlayingTrack(track);
        setSearch("");
    }

    useEffect(() => {
        if (!accessToken) return
        spotifyApi.setAccessToken(accessToken)
    }, [accessToken])

    useEffect(() => {
      if (!search) return setSearchResults([]);
      if (!accessToken) return;
      let cancel = false;
  
      spotifyApi.searchTracks(search).then(res => {
          cancel = false;
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
          setDisplayedResults(results.slice(0, 6)); // Initially show only 6 results
      });
  
      return () => (cancel = true);
  }, [search, accessToken]);
  
  const loadMoreResults = () => {
    setDisplayedResults(prevResults => {
        const newResults = searchResults.slice(prevResults.length, prevResults.length + 6);
        return [...prevResults, ...newResults];
    });
};

return (
  <div className="dashboard-container">
      <Sidebar />
      <Container className="content">
          <div className="search-container">
              <Form.Control 
                  type="search" 
                  placeholder="Search Songs/Artists"
                  value={search} 
                  onChange={e => setSearch(e.target.value)} 
              />
              <div 
                  className="flex-grow-1 my-2"
                  style={{ overflowY: "auto", maxHeight: "400px" }}
                  onScroll={e => {
                      const bottom = e.target.scrollHeight === e.target.scrollTop + e.target.clientHeight;
                      if (bottom) loadMoreResults();
                  }}
              >
                  {displayedResults.map(track => (
                      <TrackSearchResult track={track} key={track.uri} chooseTrack={chooseTrack} />
                  ))}
              </div>
          </div>
      </Container>
      <div className="player-container">
          <Player accessToken={accessToken} trackUri={playingTrack?.uri} />
      </div>
  </div>
);

}
