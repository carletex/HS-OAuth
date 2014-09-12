# HS-OAuth

This node.js package deals with the OAuth 2.0 authorization for the Hacker School API for your cli applications.

## Install

Install the package with npm:

`npm install git+https://github.com/carletex/HS-OAuth`

## Usage

First, create a Hacker School app using `urn:ietf:wg:oauth:2.0:oob` as a redirect URI

### Public interface

__connectHS(config, callback)__

Tries to authenticate with the Hacker School API, where config:

- username: Your HS user login (email)
- password: Your HS password
- hsID: You HS app ID
- hsSecret: your HS app secret

The callback get 2 arguments `function(error, conn)`, where conn is the new instance connected to the HS API if no error ocurred.

__getHS(command, callback)__

Make a get request to the protected HS resource.

- command: The request to the HS API `/you/api/command`. You don't need to write the full URL with http://www.hackerschool.com
- callback: Takes 2 arguments `function(error, response)` where response is the parsed JSON as an object.


### Example of use:

	```javascript
	var hs = require('hs-oauth');

	config = {
		username: 'your-hs-username',
		password: 'your-hs-password',
		hsID: 'your-hs-app-ID',
		hsSecret: 'your-hs-app-Secret'
	}

	hs.connectHS(config, function(error, conn) {

		if (error) {
			console.log('Something went wrong:', error);
			return;
		}

		var command = '/the/api/command';

		conn.getHS(command, function(error, response) {
			if (error) console.log('Something went wrong', error);
			else console.log('Response from HS:', response);
		});

	});

	```

## Credits

Thanks to @bruslim and @maryrosecook