var Config = require('./config')
  , conf = new Config()
  , cradle = require('cradle')
  , connection = new (cradle.Connection)(conf.couchdb.url, conf.couchdb.port, { cache: true })
  , db = connection.database('sndb'); 

exports.db = function () {
    return db;
};

exports.validateUser = function (username, fn) {
    db.view('users/by_username', { key: username }, function (err, response) {
        if (err) {
            return fn(err, null);
        }
        
        if (response.length) {
            return fn(null, response[0].value);
        } else {
            return fn(true, null);
        }
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