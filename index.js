var https = require('https');
var querystring = require('querystring');
var request = require('request');
var RSVP = require('rsvp');
var read = require("read")


// Enable cookies for requests
var j = request.jar()
var bodyequest = request.defaults({jar: j});

var CALLBACK_URI = 'urn:ietf:wg:oauth:2.0:oob'
// Auth server end-points
var HS_BASE_URL = 'https://www.hackerschool.com'
var HS_AUTHORIZE_URL= '/oauth/authorize'
var HS_ACCESS_TOKEN_URL= '/oauth/token'


function HSLogin (credentials) {

	// Get the Authenticity form token in /login
	return new RSVP.Promise(function(resolve, reject) {

		request.get(HS_BASE_URL + '/login', function(error, response, body) {

			var regex = /<meta.*content="(.*?)".*name="csrf-token".*\/>/;
			var authenticityToken = body.match(regex)[1];

			var params = {
				'authenticity_token': authenticityToken,
				'email': credentials.username,
				'password': credentials.password,
				'commit': 'Log+in'
			}

			var query = {
				url: HS_BASE_URL + '/sessions',
				form: params
			}

			request.post(query, function(error, response, body) {
				console.log('RES:', error, body);
				resolve();
			});

		});

	});

}

// function getAuthToken() {

// 	var query = {
//     'client_id': process.env.HS_CONSUMER_KEY,
//     'response_type': 'code',
//     'redirect_uri': CALLBACK_URI
//   }

// 	var options = {
// 		url: HS_BASE_URL + HS_AUTHORIZE_URL + '?' + querystring.stringify(query),
// 	};

// 	request.get(options, function(error, response, body) {
// 		console.log(error, response, body);

// 	});
// }

function getHSCredentials() {
	return new RSVP.Promise(function(resolve, reject){
		var credentials = {};

		return new RSVP.Promise(function(resolve, reject) {
			read({prompt: 'HS username: '}, function(error, text) {
				credentials.username = text;
				resolve();
			});
		})
		.then(function() {
			read({prompt: 'HS password: ', silent: true}, function(error, text) {
				credentials.password = text;
				resolve(credentials);
			});
		});
	});
}


// MAIN

getHSCredentials()
.then(function(credentials) {
	return HSLogin(credentials);
})
.then(function(session) {

});