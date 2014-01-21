var Config = require('./config')
  , conf = new Config()
  , cradle = require('cradle')
  , connection = new (cradle.Connection)(conf.couchdb.url, conf.couchdb.port, { cache: true })
  , db = connection.database('sndb');

exports.db = function () {
    return db;
};

exports.validateUser = function (username, password, fn) {
    console.log(username + ' ' + password);
    db.view('users/by_username', { key: [username, password] }, function (err, response) {
        if (response.length) {
            return fn(null, response[0].value);
        }

        return fn(err, null);
    });
};

exports.validateSession = function (id, fn) {
    db.view('users/by_userid', { key: id }, function (err, response) {
        if (response.length) {
            return fn(null, response);
        }

        return fn(err, null);
    });
};