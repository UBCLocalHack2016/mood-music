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

var request = require('request'); // "Request" library

  var client_id = 'daed280322f74c999f06197ea71f530e';

 var client_secret = 'd27953a5edce47a49ca46f43475885fa';
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

request.post(authOptions, function(error, response, body) {
  if (!error && response.statusCode === 200) {

    // // use the access token to access the Spotify Web API
    // var token = body.access_token;
    // var options = {
    //   url: 'https://api.spotify.com/v1/users/jmperezperez',
    //   headers: {
    //     'Authorization': 'Bearer ' + token
    //   },
    //   json: true
    // };
    // request.get(options, function(error, response, body) {
    //   console.log(body);
    // });
    console.log(body.access_token);
  }
});


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
