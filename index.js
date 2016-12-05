var http    = require('http');    //node http requests library
var https   = require('https');   //node https requests library
var Twitter = require('twitter'); //Twitter API wrapper library
var request = require('request'); //authorization request library

//hashtag we will listen for
var hashtag = "#MoodMusicPls";

//Spotify access token
var accessToken = '';

//Spotify auth details
var client_id = process.env.SPOTIFY_CLIENT_ID;
var client_secret = process.env.SPOTIFY_CLIENT_SECRET;

//Spotify authorization request options
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

//request Spotify access token
request.post(authOptions, function(error, response, body) {
  if (!error && response.statusCode === 200) {
      accessToken = body.access_token;
  }
});

//create new Twitter listener via API wrapper library
var params = {track: hashtag};
var client = new Twitter({
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});

//listen for Tweets with our hashtag
var stream = client.stream('statuses/filter', params);
stream.on('data', (tweet) => {
    analyzeTweet(tweet.user.screen_name, tweet.text.replace(hashtag, ''));
});
stream.on('error', (error) => {
    console.log(error);
});

//send tweet to sentiment analysis API
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

//convert sentiment into recommendation params and get recommendation from Spotify API
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

    var options = {
        hostname: 'api.spotify.com',
        path: pathString,
        headers: {
            'Authorization': 'Bearer ' + accessToken
        }
    }

    var req = https.request(options, (res) => {
            res.on('data', function (chunk) {
                bodyChunks.push(chunk);
            });
            res.on('end', function (chunk) {
                var resultObj = JSON.parse(Buffer.concat(bodyChunks).toString());
                var randomInt = Math.floor(Math.random() * resultObj.tracks.length);
                var url = resultObj.tracks[randomInt].external_urls.spotify;
                sendResponse(username, adjective, url);
            });
            res.on('error', function (error) {
                console.log('Error on call to Spotify API: ' + error);
            });
        });

    req.end();
}

//send response tweet to user
function sendResponse(username, desc, url) {
    var statusText = 'Hey @' + username + ', you sound ' + desc + '. Here\'s a playlist for you: ' + url;
    client.post('statuses/update', {status: statusText}, function (error, tweet, response) {
        if (error) console.log(error);
    });
}
