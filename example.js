var hs = require('./oauth-hs.js');

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
