var http    = require('http');
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

var client_id = 'daed280322f74c999f06197ea71f530e';

var client_secret = 'd27953a5edce47a49ca46f43475885fa';

var stream = client.stream('statuses/filter', params);
stream.on('data', function(tweet) {
    console.log(tweet && tweet.text);
    analyzeTweet(tweet.user.screen_name, tweet.text.replace(hashtag, ""));
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

    var postData = "txt=" + text;
    var bodyChunks = [];

    var req = http.request({
        hostname: 'sentiment.vivekn.com',
        port: 80,
        path: '/api/text/',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(postData)
        }
    }, function (results){
        // console.log("results: " + results);
        results.on('data', function(chunk){
            bodyChunks.push(chunk);
            // console.log('on data: ' + chunk.toString());
        });
        results.on('end', function(){
            var resultObj = JSON.parse(Buffer.concat(bodyChunks).toString());
            console.log('resultObj: ' + JSON.stringify(resultObj));
            var confidence = resultObj.result.confidence;
            var sentiment = resultObj.result.sentiment;
            getRecommendation(username, confidence, sentiment, accessToken);
        });

        results.on('error', function(error){
            console.log('on error: ' + JSON.stringify(error));
        });
    });

    req.write(postData);
    req.end();
}

function getRecommendation(username, confidence, sentiment, accessToken) {
    console.log("In get rec");
    var bodyChunks = [];
    var adjective;
    var pathString = '/v1/recommendations?';

    console.log(sentiment);

    var valence = 0.5;
    if (sentiment === "Positive") {
        valence = valence + (0.5 * (confidence / 100));
        pathString += "valence=";
        pathString += valence;
        pathString += "&mode=1";
        adjective = "positive";
    } else if (sentiment === "Negative") {
        valence = valence - (0.5 * (confidence / 100));
        pathString += "valence=";
        pathString += valence;
        pathString += "&mode=0";
        adjective = "negative";
    } else {
        pathString += "valence=";
        pathString += valence;
        adjective = "neutral";
    }

    pathString += "&limit=20"

    console.log("set vars");
    console.log("api.spotify.com" + pathString);

    var https = require('https');

    var req = https.request({
        hostname: 'api.spotify.com',
        path: pathString,
        headers: {
            'Authorization': 'Bearer' + accessToken
        }}, function (results) {
            results.on("data", function (chunk) {
                console.log(chunk);
                bodyChunks.push(chunk);
            });
            results.on("end", function (chunk) {
                var resultObj = JSON.parse(Buffer.concat(bodyChunks).toString());
                var randomInt = Math.floor(Math.random() * resultObj.tracks.length);
                var url = resultObj.tracks[randomInt].external_urls.spotify;
                console.log("sending response");
                sendResponse(username, adjective, url);
            });
            results.on("error", function (error) {
                console.log("on error: " + JSON.stringify(error));
            });
        });
}

function sendResponse(username, desc, url) {
    var statusText = "Hey @" + username + ", you sound " + desc + ". Here's a playlist for you: " + url;
    client.post('statuses/update', {status: statusText}, function (error, tweet, response) {
        if (error) console.log(error);
    });
}
