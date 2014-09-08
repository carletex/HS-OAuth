// Desired API
var hs = require('oauth-hs');

hs.connectHS(usernameOptional, passwordOptional, function(error) {

	var command = '/people/me';

	hs.getHS(command, function(error, response) {
		console.log('Response from HS:', reponse);
	});

});

