var http    = require('http');
var Twitter = require('twitter');

var client = new Twitter({
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});
var hashtag = "#MoodMusicPls";
var params = {track: hashtag};

var stream = client.stream('statuses/filter', params);
stream.on('data', function(tweet) {
    console.log(tweet && tweet.text);
    analyzeTweet(tweet.text.replace(hashtag, ""));
});
stream.on('error', function(error) {
    console.log(error);
});

var SpotifyWebApi = require('spotify-web-api-node');

var spotifyApi = new SpotifyWebApi({
  clientId : 'daed280322f74c999f06197ea71f530e',
  clientSecret : 'd27953a5edce47a49ca46f43475885fa',
});

function spotifyAuth () {
  //TODO not working yet

  var postData = "grant_type=client_credentials";
    var req = http.request({
        hostname:"https://accounts.spotify.com/api/token",
        method: 'POST',
        headers:{
          'Authorization': "Basic " + spotifyApi.clientId +":"+ spotifyApi.clientSecret,
          'Content-Length': Buffer.byteLength(postData)
        }
    }, function(res){
        console.log("Spotify auth" + res);
    });

    req.write(postData);
    req.end();
}

spotifyAuth();

function analyzeTweet(text){

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
            tweetRecommendation(confidence, sentiment);
            console.log('on end');
        });

        results.on('error', function(error){
            console.log('on error: ' + JSON.stringify(error));
        });
    });

    req.write(postData);
    req.end();
}

function tweetRecommendation(confidence, sentiment){
    console.log("confidence: " + confidence);
    console.log("sentiment: " + sentiment);
}

function sendResponse(username, desc, url) {
    var statusText = "Hey @" + username + ", you sound " + desc + ". Here's a playlist for you: " + url;
    client.post('statuses/update', {status: statusText}, function (error, tweet, response) {
        if (error) console.log(error);
    });
}
