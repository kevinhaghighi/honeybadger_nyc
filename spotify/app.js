const express = require('express');
const logger = require('morgan');
const request = require('request-promise');
const exphbs  = require('express-handlebars');
const favicon = require('serve-favicon');
const path = require('path');
const { clientId, clientSecret }= require('./apikey');
const app = express();

app.use(logger('dev'));
app.engine('handlebars', exphbs({defaultLayout: 'index'}));
app.set('view engine', 'handlebars');
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(express.static('public'));
app.use('/jquery', express.static(__dirname + '/node_modules/jquery/dist/'))

var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    method: 'POST',
    headers: {
        'Authorization': 'Basic ' + (new Buffer(`${clientId}:${clientSecret}`).toString('base64'))
    },
    form: {
        grant_type: 'client_credentials'
    },
    json: true
};

function getAccessToken() {
    return request(authOptions).then(function(data) {
       return data.access_token;
    })
}

function getRequestOptions(url, access_token, queryOptions = {}) {
    var options = {
        url: url,
        qs: queryOptions,
        headers: {
            'Authorization': `Bearer ${access_token}`
        },
        json: true
    };

    return options;
}

function getArtistByName(access_token, artist) {
    var options = getRequestOptions('https://api.spotify.com/v1/search', access_token, { q: artist, type: 'artist' })

    return request(options).then(function(artistData) {
        return artistData;
    });
}

function getTopTracks(access_token, id) {
    var options = getRequestOptions(`https://api.spotify.com/v1/artists/${id}/top-tracks`, access_token, { country: 'US'});

    return request(options).then(function(topTracks) {
        return topTracks;
        
    })
}

function normalizeTrackData(track) {
    const {
        album: {
            name: albumName,
            images: [{
                url: albumArtUrl
            }]
        },
        name: trackName,
        artists: [{
            name: artistName
        }],
        id: trackId
        
    } = track;

    return {
        albumName,
        trackName,
        artistName,
        albumArtUrl,
        trackId
    }
}
function getTrackById(access_token, id) {
    var options = getRequestOptions(`https://api.spotify.com/v1/tracks/${id}`, access_token, { id: id , type: 'artist' });

    return request(options).then(function(trackData) {
        return trackData;
        
    })
}
app.get('/:artist', function(req, res) {
    const artist = req.params.artist;
    let _access_token;

    getAccessToken()
        .then(function(access_token) {
            _access_token = access_token;

            return getArtistByName(_access_token, artist)
        })
        .then(function(data) {
            const artist = data.artists.items[0] || {};
            const id = artist.id;

            return getTopTracks(_access_token, id);
        })
        .then(function(topTracks) {
            const normalizedTracks = topTracks.tracks.map(function(track) {
                return normalizeTrackData(track);
            })

            const result = {
                tracks: normalizedTracks
            }

            res.render('artists', result);
        })
});
app.get('/track/:id', function(req,res){
    const id = req.params.id;
    console.log(id);
    getAccessToken()
    .then(function(access_token) {
        _access_token = access_token;

        return getTrackById(_access_token, id)
    .then(function(trackData){
        const previewURL = trackData.preview_url;
        console.log(previewURL);
    })
})})

app.listen(3000, function() {
    console.log('Listening on port 3000');
});
