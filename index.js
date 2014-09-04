var https = require('https');
var querystring = require('querystring');

var CALLBACK_URI = 'urn:ietf:wg:oauth:2.0:oob'

// Auth server end-points
var HS_BASE_URL = 'www.hackerschool.com'
var HS_AUTHORIZE_URL= '/oauth/authorize'
var HS_ACCESS_TOKEN_URL= '/oauth/token'


function getAuthToken() {

	var query = {
    'client_id': process.env.HS_CONSUMER_KEY,
    'response_type': 'code',
    'redirect_uri': CALLBACK_URI
  }

	var options = {
		hostname: HS_BASE_URL,
		port: 443,
		path: HS_AUTHORIZE_URL + '?' + querystring.stringify(query),
	};

	https.get(options, function(res) {

		console.log("Status Code:", res.statusCode);
		console.log("Headers:", res.headers);

		res.on('data', function(data) {
		  console.log('Response:', data.toString());
		});

	}).on('error', function(e) {
  	console.error('Something went wrong:', e);
	});;
}

getAuthToken();