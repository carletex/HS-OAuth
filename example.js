var hs = require('./hs-oauth.js');

config = {
	username: process.env.HS_EMAIL,
	password: process.env.HS_PASS,
	hsID: process.env.HS_CONSUMER_KEY,
	hsSecret: process.env.HS_CONSUMER_SECRET
}

hs.connectHS(config, function(error, conn) {

	if (error) {
		console.log('Something went wrong', error);
		return;
	}

	var command = '/api/v1/people/me';

	conn.getHS(command, function(error, response) {
		if (error) console.log('Something went wrong', error);
		else console.log('Response from HS:', response);
	});

});
