const express = require('express');
const router = express.Router();
const fs = require('fs');
const $ = require('jquery');

/* GET home page */
router.get('/', function(req, res) {
  res.render('index', { title: 'Home', user: req.user });
});

/* GET about page */
router.get('/about', function(req, res) {
  res.render('about', { title: 'About', user: req.user });
});

/* GET video page */
router.get('/video', function(req, res) {
  res.render('video', { title: 'Mood Playlist', user: req.user });
});

/* GET profile page */
router.get('/profile', function(req, res) {
  if(req.user) {
    res.render('profile', { title: 'Profile', user: req.user });
  } else {
    res.redirect('/login');
  }
  
});

/* GET login page */
router.get('/login', function(req, res) {
  res.render('login', { title: 'Log In', user: req.user });
});



router.post('/videos', function(req, res, next) {
  for (var i in req.body) {
    var dataURL = i;
  }
  var videoBuffer = readBase64Video(dataURL);
  var fileName = 'test.webm';
  fs.writeFile('tmp/' + fileName, videoBuffer.data, function() {
    res.redirect('/videos/api');
  });
  // write data to temp file - DONE
  // send temp file to api - below in /api
  // run thru algorithm to trigger/compile playlists - on /api response
  // get back uri of spotify playlist & return that to hit AJAX .done callback in webcam.js
});

router.get('/videos/api', function(req, res, next) {
  console.log('redirected to someplace to build request and save the file')
  // build out request
  // on DONE redirect response to run thru kairos matching algorithm
});

function readBase64Video(data) {
  var matches = data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  var response = {};
  response.type = matches[1];
  response.data = new Buffer(matches[2], 'base64');
  return response;
};

module.exports = router;