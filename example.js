var OAuthHS = require('./hs-oauth.js');

var hs = new OAuthHS();

hs.connectHS(function(error) {

	if (error) {
		console.log('Something went wrong', error);
		return;
	}

	var command = '/api/v1/people/me';

	hs.getHS(command, function(error, response) {
		if (error) console.log('Something went wrong', error);
		else console.log('Response from HS:', response);
	});

});
