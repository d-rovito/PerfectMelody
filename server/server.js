const express = require('express');
const spotifyWebApi = require('spotify-web-api-node');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = 3001;

// Use CORS middleware to allow requests from localhost:3000
app.use(cors());
app.use(bodyParser.json());

app.post("/refresh", (req, res) => {
    const refreshToken = req.body.refreshToken
    console.log("hi")
    const spotifyApi = new SpotifyWebApi({
      redirectUri: process.env.REDIRECT_URI,
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      refreshToken,
    })
  
    spotifyApi
      .refreshAccessToken()
      .then(data => {
        res.json({
          accessToken: data.body.accessToken,
          expiresIn: data.body.expiresIn,
        })
        console.log(data.body)
      })
      .catch(err => {
        console.log(err)
        res.sendStatus(400)
      })
  })
  

app.post('/login', function(req, res) {
    const code = req.body.code;
    const spotifyApi = new spotifyWebApi({
        redirectUri: 'http://localhost:3000',
        clientId: '73c8acfed3c743a685e0ea411471218d',
        clientSecret: 'f95c11d8b24447678b2760d57cccf1c2'
    });

    spotifyApi.authorizationCodeGrant(code).then(data => {
        res.json({
            accessToken: data.body.access_token,
            refreshToken: data.body.refresh_token,
            expiresIn: data.body.expires_in
        });
    }).catch(err => {
        console.log(err);
        res.sendStatus(400);
    });
});

app.listen(3001, () => {
    console.log(`Server is running on port ${port}`);
});
