var http    = require('http');
var https = require('https');
var Twitter = require('twitter');
var SpotifyWebApi = require('spotify-web-api-node');
var request = require('request'); // "Request" library

var client = new Twitter({
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});
var hashtag = "#MoodMusicPls";
var params = {track: hashtag};

var client_id = process.env.SPOTIFY_CLIENT_ID;
var client_secret = process.env.SPOTIFY_CLIENT_SECRET;

var stream = client.stream('statuses/filter', params);
stream.on('data', function(tweet) {
    console.log(tweet && tweet.text);
    analyzeTweet(tweet.user.screen_name, tweet.text.replace(hashtag, ''));
});
stream.on('error', function(error) {
    console.log(error);
});


// var authOptions={
//     url:  'https://accounts.spotify.com/api/token',
//     method:"POST",
//     headers: {
//         'Authorization': 'Basic' + (new Buffer(spotifyApi.client_id + ':' + spotifyApi.client_secret).toString('base64'))
//     },
//     body: "grant_type=client_credentials&scope=playlist-modify-public playlist-modify-private"
// };
//
// requests(authOptions,fuction(err, res, body)){
//     console.log('error', err);
//     console.log('status', res.statusCode);
//     console.log('body', body);
// });
// }



// your application requests authorization
var authOptions = {
  url: 'https://accounts.spotify.com/api/token',
  headers: {
    'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
  },
  form: {
    grant_type: 'client_credentials'
  },
  json: true
};

var accessToken = '';

request.post(authOptions, function(error, response, body) {
  if (!error && response.statusCode === 200) {
      accessToken = body.access_token;
  }
});


function analyzeTweet(username, text){
    var postData = 'txt=' + text;
    var bodyChunks = [];

    var options = {
        hostname: 'sentiment.vivekn.com',
        path: '/api/text/',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    var req = http.request(options, (res) => {
        res.on('data', function(chunk){
            bodyChunks.push(chunk);
        });
        res.on('end', function(){
            var resultObj = JSON.parse(Buffer.concat(bodyChunks).toString());
            console.log('resultObj: ' + JSON.stringify(resultObj));
            var confidence = resultObj.result.confidence;
            var sentiment = resultObj.result.sentiment;
            getRecommendation(username, confidence, sentiment, accessToken);
            //authSpotify(username, confidence, sentiment);
        });
        res.on('error', function(error){
            console.log('Error occurred in sentiment analysis request: ' + error);
        });
    });

    req.write(postData);
    req.end();
}

// function authSpotify(username, confidence, sentiment) {
//     var bodyChunks = [];
//     var options = {
//         hostname: 'accounts.spotify.com',
//         path: '/api/token',
//         method: 'POST',
//         headers: {
//             'Authorization': 'Basic ' + client_id + client_secret
//         }
//     };
//     var req = https.request(options, (res) => {
//         res.setEncoding('utf8');
//         res.on('data', (chunk) => {
//             bodyChunks.push(chunk);
//         });
//         res.on('end', () => {
//             console.log('Data received: ' + bodyChunks);
//             getRecommendation(username, confidence, sentiment, JSON.stringify(bodyChunks).access_token);
//         });
//         res.on('error', (err) => {
//             console.log(err);
//         });
//     });
//
//     req.write('grant_type=client_credentials');
//     req.end();
// }

function getRecommendation(username, confidence, sentiment, accessToken) {
    var bodyChunks = [];
    var adjective = 'neutral';
    var pathString = '/v1/recommendations?';
    var valence = 0.5;
    var mode;

    pathString += 'seed_genres=dance'

    if (sentiment === 'Positive') {
        valence = valence + (0.5 * (confidence / 100));
        mode = 1;
        adjective = 'positive';
    } else if (sentiment === 'Negative') {
        valence = valence - (0.5 * (confidence / 100));
        mode = 0;
        adjective = 'negative';
    }
    pathString += '&valence=' + valence;
    if (mode !== undefined) {
        pathString += '&mode=' + mode;
    }

    console.log('api.spotify.com' + pathString);

    var options = {
        hostname: 'api.spotify.com',
        path: pathString,
        headers: {
            'Authorization': 'Bearer ' + accessToken
        }
    }

    var req = https.request(options, (res) => {
            res.on('data', function (chunk) {
                console.log(chunk);
                bodyChunks.push(chunk);
            });
            res.on('end', function (chunk) {
                var resultObj = JSON.parse(Buffer.concat(bodyChunks).toString());
                console.log('resultObj: ' + JSON.stringify(resultObj));
                console.log(resultObj);
                var randomInt = Math.floor(Math.random() * resultObj.tracks.length);
                var url = resultObj.tracks[randomInt].external_urls.spotify;
                console.log('Sending response');
                sendResponse(username, adjective, url);
            });
            res.on('error', function (error) {
                console.log('Error on call to Spotify API: ' + error);
            });
        });

    req.end();
}

function sendResponse(username, desc, url) {
    var statusText = 'Hey @' + username + ', you sound ' + desc + '. Here\'s a playlist for you: ' + url;
    client.post('statuses/update', {status: statusText}, function (error, tweet, response) {
        if (error) console.log(error);
    });
}
