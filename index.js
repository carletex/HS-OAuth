var https = require('https');
var querystring = require('querystring');
var request = require('request');
var RSVP = require('rsvp');
var read = require('read')
var url = require('url');

// Enable cookies for requests
var j = request.jar()
var request = request.defaults({jar: j});

var CALLBACK_URI = 'urn:ietf:wg:oauth:2.0:oob'
// Auth server end-points
var HS_BASE_URL = 'https://www.hackerschool.com'
var HS_AUTHORIZE_URL = HS_BASE_URL + '/oauth/authorize'
var HS_ACCESS_TOKEN_URL = HS_BASE_URL + '/oauth/token'


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
				resolve();
			});

		});

	});

}

function getAuthGrant() {

	var params = {
    'client_id': process.env.HS_CONSUMER_KEY,
    'response_type': 'code',
    'redirect_uri': CALLBACK_URI
  }

	var options = {
		url: HS_BASE_URL + HS_AUTHORIZE_URL + '?' + querystring.stringify(params),
	};

	return new RSVP.Promise(function(resolve, reject) {

		request.get(options, function(error, response, body) {

			var query = {
				url: HS_AUTHORIZE_URL,
				form: params
			}

			request.post(query, function(error, response, body) {

				var authCode = url.parse(response.headers.location).pathname.split('/')[3];
				resolve(authCode);

			});

		});

	});

}

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
.then(function() {
	console.log('HS Login successfully');
	return getAuthGrant();
})
.then(function(authCode) {
	console.log('You auth code is:', authCode);
});