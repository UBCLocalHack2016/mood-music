var http    = require('http');
var twitter = require('twitter');

var client = new Twitter({
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});


console.log(process.env.TWITTER_CONSUMER_KEY + " " + process.env.TWITTER_CONSUMER_SECRET
    + " " + process.env.TWITTER_ACCESS_TOKEN_KEY + " " + process.env.TWITTER_ACCESS_TOKEN_SECRET);