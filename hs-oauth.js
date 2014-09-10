'use strict'

var https = require('https'),
    querystring = require('querystring'),
    request = require('request'),
    RSVP = require('rsvp'),
    read = require('read'),
    url = require('url'),
    // Enable cookies for requests
    j = request.jar(),
    request = request.defaults({jar: j});

var CALLBACK_URI = 'urn:ietf:wg:oauth:2.0:oob',
    HS_BASE_URL = 'https://www.hackerschool.com',
    HS_AUTHORIZE_URL = HS_BASE_URL + '/oauth/authorize',
    HS_ACCESS_TOKEN_URL = HS_BASE_URL + '/oauth/token';

var OAuthHS = {};

OAuthHS.accessToken;
OAuthHS.refreshToken;

OAuthHS.connectHS = function connectHS(callback) {

  var _this = this;

  this._getCredentialsHS()
  .then(function(credentials) {
    return _this._loginHS(credentials);
  })
  .then(function() {
    console.log('HS Login successfully');
    return _this._getAuthGrant();
  })
  .then(function(authCode) {
    console.log('You auth code is:', authCode);
    return _this._getAccessToken(authCode);
  })
  .then(function(tokenData) {
    console.log('Your token info:', tokenData);

    _this.accessToken = tokenData.access_token;
    _this.refreshToken = tokenData.refresh_token;

    callback();
  });

}

OAuthHS.getHS = function getHS(command, callback) {

  var query = {
    url: HS_BASE_URL + command,
    headers: {
      'Authorization': 'Bearer ' + this.accessToken
    }
  };

  request.get(query, function(error, response, body) {
    if (error) {
      callback(error, null);
    }
    callback(null, JSON.parse(body));
  });

}

OAuthHS._getCredentialsHS = function _getCredentialsHS() {
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

OAuthHS._loginHS = function _loginHS (credentials) {
  // Get the Authenticity form token in /login
  return new RSVP.Promise(function(resolve, reject) {
    request.get(HS_BASE_URL + '/login', function(error, response, body) {
      if (error) {
        console.log('Something went wrong:', error);
        reject();
      }

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
        if (error) {
          console.log('Something went wrong:', error);
          reject();
        } else if (response.statusCode !== 302) {
          // HS don't redirect to dashboard => authentication failed
          console.log('HS authentication failed');
          reject();
        }
        resolve();
      });

    });
  });

}

OAuthHS._getAuthGrant = function _getAuthGrant() {

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
      if (error) {
        console.log('Something went wrong:', error);
        reject();
      }

      var query = {
        url: HS_AUTHORIZE_URL,
        form: params
      }

      // TODO: Not necesary if we already have the auth
      request.post(query, function(error, response, body) {
        if (error) {
          console.log('Something went wrong:', error);
          reject();
        }
        var authCode = url.parse(response.headers.location).pathname.split('/')[3];
        resolve(authCode);
      });

    });
  });

}

OAuthHS._getAccessToken = function _getAccessToken(authCode) {

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
      if (error) {
        console.log('Something went wrong:', error);
        reject();
      }
      resolve(JSON.parse(body));
    });

  });

}

module.exports = OAuthHS;
