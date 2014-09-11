var hs = require('./hs-oauth.js');

hs.connectHS(conf, function(error, instance) {

	if (error) {
		console.log('Something went wrong', error);
		return;
	}

	var command = '/api/v1/people/me';

	instance.getHS(command, function(error, response) {
		if (error) console.log('Something went wrong', error);
		else console.log('Response from HS:', response);
	});

});
