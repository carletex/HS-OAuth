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

// Object vars

var accessToken;
var refreshToken;

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

	return new RSVP.Promise(function(resolve, reject) {
		var params = {
	    client_id: process.env.HS_CONSUMER_KEY,
	    response_type: 'code',
	    redirect_uri: CALLBACK_URI
	  }

		var options = {
			url: HS_AUTHORIZE_URL + '?' + querystring.stringify(params),
		};

		request.get(options, function(error, response, body) {

			var query = {
				url: HS_AUTHORIZE_URL,
				form: params
			}

			// TODO: Not necesary if we already have the auth
			request.post(query, function(error, response, body) {

				var authCode = url.parse(response.headers.location).pathname.split('/')[3];
				resolve(authCode);

			});

		});
	});
}

function getAccessToken(authCode) {

	return new RSVP.Promise(function(resolve, reject) {
		var params = {
			grant_type: "authorization_code",
			code: authCode,
			redirect_uri: CALLBACK_URI,
			client_id: process.env.HS_CONSUMER_KEY
		}

		var query = {
			url: HS_ACCESS_TOKEN_URL,
			form: params,
			auth: {
				user: process.env.HS_CONSUMER_KEY,
				pass: process.env.HS_CONSUMER_SECRET
			}
		}

		request.post(query, function(error, response, body) {
			resolve(JSON.parse(body));
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

function HSRequest(command) {

	return new RSVP.Promise(function(resolve, reject) {
		var query = {
			url: HS_BASE_URL + command,
			headers: {
				'Authorization': 'Bearer ' + accessToken
			}
		};

		request.get(query, function(error, response, body) {
			resolve(JSON.parse(body));
		});
	})

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
	return getAccessToken(authCode);
})
.then(function(tokenData) {
	console.log('Your token info:', tokenData);

	accessToken = tokenData.access_token;
	refreshToken = tokenData.refresh_token;

	return HSRequest('/api/v1/people/me');
})
.then(function(response){
	console.log(response);
});