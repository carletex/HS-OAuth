/* jshint node: true*/
'use strict';

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

var AUTH_REGEX = /<meta.*content="(.*?)".*name="csrf-token".*\/>/;

var OAuthHS = module.exports = function(config, cb) {

  this.config = {};
  this.config.hsID = config.hsID;
  this.config.hsSecret = config.hsSecret;
  this.config.username = config.username;
  this.config.password = config.password;
  Object.freeze(this.config);

  this.accessToken = null;
  this.refreshToken = null;

  var _this = this;

  _this._loginHS(this.config.username, this.config.password)
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
    }).catch(function(error) {
      cb(error);
    });

};

OAuthHS.connectHS = function connectHS(conf, cb) {

  var oauth = new OAuthHS(conf, function(error) {
    cb(error, oauth);
  });

};

OAuthHS.prototype.getHS = function getHS(command, cb) {

  var query = {
    url: HS_BASE_URL + command,
    headers: {
      'Authorization': 'Bearer ' + this.accessToken
    }
  };

  request.get(query, function(error, response, body) {
    if (error) {
      cb(error, null);
      return;
    }
    cb(null, JSON.parse(body));
  });

};

OAuthHS.prototype._loginHS = function _loginHS (username, password) {

  return new RSVP.Promise(function(resolve, reject) {
    request.get(HS_BASE_URL + '/login', function(error, response, body) {
      if (error) {
        reject(error);
        return;
      }

      var query = {
        url: HS_BASE_URL + '/sessions',
        form: {
          'authenticity_token': body.match(AUTH_REGEX)[1],
          'email': username,
          'password': password,
          'commit': 'Log+in'
        }
      };

      request.post(query, function(error, response) {
        if (error) {
          reject(error);
          return;
        }
        if (response.statusCode !== 302) {
          // HS don't redirect to dashboard => authentication failed
          return reject('HS authentication failed');
        }
        resolve();
      });
    });
  });

};

OAuthHS.prototype._getAuthGrant = function _getAuthGrant() {

  var _this = this;

  return new RSVP.Promise(function(resolve, reject) {

    var query = {
      url: HS_AUTHORIZE_URL,
      form: {
        client_id: _this.config.hsID,
        response_type: 'code',
        redirect_uri: CALLBACK_URI
      }
    };

    request.post(query, function(error, response) {
      if (error) {
        reject(error);
        return;
      }

      var uri = url.parse(response.headers.location);
      var authCode = uri.pathname.split('/')[3];
      resolve(authCode);
    });
  });

};

OAuthHS.prototype._getAccessToken = function _getAccessToken(authCode) {

  var _this = this;

  return new RSVP.Promise(function(resolve, reject) {
    var query = {
      url: HS_ACCESS_TOKEN_URL,
      form: {
        grant_type: 'authorization_code',
        code: authCode,
        redirect_uri: CALLBACK_URI,
        client_id: _this.config.hsID
      },
      auth: {
        user: _this.config.hsID,
        pass: _this.config.hsSecret
      }
    };

    request.post(query, function(error, response, body) {
      if (error) {
        reject(error);
        return;
      }
      resolve(JSON.parse(body));
    });
  });

};