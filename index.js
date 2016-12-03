var http    = require('http');
var Twitter = require('twitter');

var client = new Twitter({
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});
console.log(process.env.TWITTER_CONSUMER_KEY + " " + process.env.TWITTER_CONSUMER_SECRET + " " + process.env.TWITTER_ACCESS_TOKEN_KEY + " " + process.env.TIWTTER_ACCESS_TOKEN_SECRET);
console.log('Consumer key: ' + client.consumer_key);
console.log('Consumer secret: ' + client.consumer_secret);
console.log('Access token key: ' + client.access_token_key);
console.log('Access token secret: ' + client.access_token_secret);

var params = {track: '#MoodMusicPls'};

var stream = client.stream('statuses/filter', params);
stream.on('data', function(event) {
    console.log(event && event.text);
});
stream.on('error', function(error) {
    console.log(error);
});


