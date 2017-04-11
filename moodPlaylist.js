"use strict";
const request = require('request-promise');
const userAgent = "DJ-Mood-Student-Project-DEVBOOTCAMP-(https://github.com/jordanyryan/DJ-Mood)-tomchang93@gmail.com";

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

let getTracks = function(emotion, callback){
  console.log("yay")
  request({
    // needs to switch the tag out with the mood
    url: `http://ws.audioscrobbler.com/2.0/?method=tag.gettoptracks&tag=${ emotion }&api_key=${process.env.LASTFMKEY}&format=json&limit=200`,
    headers: {
      'User-Agent': userAgent
    },
    json: true
  })
  .then(function(json){
    console.log("running");
    let tracks = json["tracks"]["track"];
    console.log("Grabbed the tracks");
    let randomTracks = getRandomSubarray(tracks, 25);
    console.log(tracks);
    callback(randomTracks);
  })
  .catch(function(error){
    console.log(error)
    callback(null);
  })
};

let getIds = function(tracks, callback){
  let trackUri = []
  let j = 0;

  tracks.forEach( (track) => {
    let title = track["name"];
    let titleJoined = track["name"].split(" ").join("+");
    let artist = track["artist"]["name"];
    request({
      url: ("https://api.spotify.com/v1/search?q=" + titleJoined + "&type=track"),
      json: true
    }).then(function(json){
      let result = null
      let results = json["tracks"]["items"];
      j++

      for (var i = 0; i < results.length; i++ ){
        let compArtist = results[i]["artists"].map((artist) => {
          return artist["name"];
        });
        let compTitle = results[i]["name"];
        if ( (compTitle == title) && (compArtist.includes(artist)) ){
          result = results[i]["uri"];
          trackUri.push(result)
          break;
        };
      };

      if(j === tracks.length){

        console.log(trackUri);
        callback(trackUri);
      }
    })
    .catch(function(error){
      console.log(error);
    })
      
  })
  // while(array.length === 0){
    
  // }
};

let getUsername = function(trackUri, callback){
  request({
    url: 'https://api.spotify.com/v1/me',
    headers: {
      // needs a proper authorization token
      "Authorization": 'Bearer ' + accessToken,
      'Content-Type': 'application/json'
    }
  }).then(function(json){
    let username = json["id"];
    callback(username);
  })
}

let createPlaylist = function(username, trackUri , callback){
  let playlist = null;
  request({
    method: 'POST',
    // needs to switch out hard coded username
    url: `https://api.spotify.com/v1/users/${username}/playlists`,
    body: JSON.stringify({
      "description": "A playlist generated by DJ Mood",
      "public": true,
      "name": "Hi JD"
    }),
    headers: {
      // needs a proper authorization token
      "Authorization": 'Bearer ' + accessToken,
      'Content-Type': 'application/json'
    }
  },
  function(error, response, body){
    playlist = JSON.parse(body).id
    console.log(playlist)
    callback(playlist)
  });
};

let addTracks = function(username, tracks, playlist, callback){
  let songsUrl = tracks.join(',');
  request({
    method: 'POST',
    // switch out username
    url: (`https://api.spotify.com/v1/users/${username}/playlists/` + playlist + '/tracks?position=0&uris=' + songsUrl),
    headers: {
      // needs a proper authorization token
      "Authorization": 'Bearer ' + accessToken,
      'Content-Type': 'application/json'
    }
  }).then(function(json){
    console.log("finished")
  })
}

let runner = function( emotion ){
  getTracks( emotion, function( tracks ){
    console.log("got track")
    getIds(tracks, function(trackUri){
      console.log("got track uri")
      getUsername(trackUri, function( username ){
        console.log("got username")
        createPlaylist( trackUri, username, function( playlist ){
          console.log("got playlist")
          addTracks(trackUri, username,  playlist, function(){
            console.log("tracks added")
          })
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