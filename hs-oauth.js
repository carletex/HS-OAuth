'use strict'

var https = require('https');
var querystring = require('querystring');
var url = require('url');
var request = require('request');
var RSVP = require('rsvp');

// Enable cookies for requests
var j = request.jar();
var request = request.defaults({jar: j});

// Callback and HS endpoints
var CALLBACK_URI = 'urn:ietf:wg:oauth:2.0:oob';
var HS_BASE_URL = 'https://www.hackerschool.com';
var HS_AUTHORIZE_URL = HS_BASE_URL + '/oauth/authorize';
var HS_ACCESS_TOKEN_URL = HS_BASE_URL + '/oauth/token';

var OAuthHS = module.exports =function(config, cb) {

  this.hsID = config.hsID;
  this.hsSecret = config.hsSecret;

  this.accessToken;
  this.refreshToken;

  var _this = this;

  _this._loginHS(config.username, config.password)
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

    cb();
  });

}

OAuthHS.connectHS = function connectHS(conf, cb) {

  var oauth = new OAuthHS(conf, function(error) {
    cb(error, oauth);
  });

}

OAuthHS.prototype.getHS = function getHS(command, callback) {

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

OAuthHS.prototype._loginHS = function _loginHS (username, password) {

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
        'email': username,
        'password': password,
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

OAuthHS.prototype._getAuthGrant = function _getAuthGrant() {

  var _this = this;

  return new RSVP.Promise(function(resolve, reject) {
    var params = {
      client_id: _this.hsID,
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

OAuthHS.prototype._getAccessToken = function _getAccessToken(authCode) {

  var _this = this;

  return new RSVP.Promise(function(resolve, reject) {
    var params = {
      grant_type: "authorization_code",
      code: authCode,
      redirect_uri: CALLBACK_URI,
      client_id: _this.hsID
    }

    var query = {
      url: HS_ACCESS_TOKEN_URL,
      form: params,
      auth: {
        user: _this.hsID,
        pass: _this.hsSecret
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