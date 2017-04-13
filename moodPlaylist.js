"use strict";
const request = require('request-promise');
const passport = require('passport');
const session = require('express-session')
const userAgent = "DJ-Mood-Student-Project-DEVBOOTCAMP-(https://github.com/jordanyryan/DJ-Mood)-tomchang93@gmail.com";
const User = require("./models/user");
const removeDiacritics = require('diacritics').remove;

let getRandomSubarray = function(arr, size) {
  var shuffled = arr.slice(0), i = arr.length, min = i - size, temp, index;
  while (i-- > min) {
    index = Math.floor((i + 1) * Math.random());
    temp = shuffled[index];
    shuffled[index] = shuffled[i];
    shuffled[i] = temp;
  }
  return shuffled.slice(min);
}

let getTracks = function(req, callback){
  request({
    url: `http://ws.audioscrobbler.com/2.0/?method=tag.gettoptracks&tag=${ req[0] }&api_key=${process.env.LASTFMKEY}&format=json&limit=200`,
    headers: {
      'User-Agent': userAgent
    },
    json: true
  })
  .then(function(json){
    let tracks = json["tracks"]["track"];
    let randomTracks = getRandomSubarray(tracks, 50);
    callback(randomTracks);
  })
  .catch(function(error){
    callback(null);
  })
};

let getIds = function(tracks, req, callback){
  let trackUri = []
  let j = 0;
  tracks.forEach( (track) => {
    let title = removeDiacritics(track["name"].match(/^[^\(]+/g)[0].trim());
    if (title.includes("Undefined") || title.includes("_") ) {
      return
    }
    let titleJoined = title.split(" ").join("+");
    let artist = track["artist"]["name"];
    console.log(track["name"], title, titleJoined)
    request({
      url: ("https://api.spotify.com/v1/search?q=" + titleJoined + "&type=track"),
      json: true
    }).then(function(json){
      let result = null
      j++
      if(json["tracks"]["items"].length > 0){
        let results = json["tracks"]["items"];
        for (var i = 0; i < results.length; i++ ){
          let compArtist = results[i]["artists"].map((artist) => {
            return artist["name"];
          });
          let compTitle = removeDiacritics(results[i]["name"]);
          if ( (compTitle == title) && (compArtist.includes(artist)) ){
            result = results[i]["uri"];
            trackUri.push(result)
            break;
          }
        };
        if(j === tracks.length){
          callback(trackUri);
        }
      }
    }).then(null, function(error){
      j++
      console.log(error)
      return
    })
  })
};

let createPlaylist = function(req, trackUri , callback){
  request({
    method: 'POST',
    url: `https://api.spotify.com/v1/users/${req[1].user.username}/playlists`,
    body: JSON.stringify({
      "description": "A playlist generated by DJ Mood",
      "public": true,
      "name": "DJ Mood"
    }),
    headers: {
      "Authorization": 'Bearer ' + req[1].user.accessToken,
      'Content-Type': 'application/json'
    },
    scope: 'playlist-modify-public'
  },
  function(error, response, body){
    let playlist = JSON.parse(body).id
    User.update({_id: req[1].user.id }, { $set: { playlist: playlist}}, function(req, res) {
    })
    callback(playlist)
  });
};

let addTracks = function(req, tracks, playlist, callback){
  let songsUrl = tracks.join(',');
  request({
    method: 'POST',
    url: (`https://api.spotify.com/v1/users/${req[1].user.username}/playlists/` + playlist + '/tracks?position=0&uris=' + songsUrl),
    headers: {
      "Authorization": 'Bearer ' + req[1].user.accessToken,
      'Content-Type': 'application/json'
    }
  }).then(function(json){
    return playlist
  })
}

let runner = function( req ){
  return getTracks( req, function( tracks ){
    return getIds(tracks, req, function(trackUri){
      return createPlaylist( req, trackUri, function( playlist ){
        return addTracks(req, trackUri,  playlist, function(){
        })
      })
    });
  })
}

module.exports = {
  getRandomSubarray,
  getTracks,
  getIds,
  createPlaylist,
  addTracks,
  runner
};
