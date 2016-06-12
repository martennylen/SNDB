var Config = require('./config')
  , conf = new Config()
  , cradle = require('cradle')
  , connection = new (cradle.Connection)(conf.couchdb.url, conf.couchdb.port, { cache: true })
  , db = connection.database(conf.couchdb.database); 

exports.db = function () {
    return db;
};

exports.updatePath = function() {
    return conf.couchdb.url + "/" + conf.couchdb.database + "/_design/update/_update/partialUpdate/";
};

exports.validateUser = function (username, fn) {
    db.view('users/by_username', { key: username.toLowerCase() }, function (err, response) {
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

//exports.getUserIdByName = function(username, fn) {
//    db.view('users/by_user', { key: username }, function (err, response) {
//        if (response.length) {
//            return fn(null, response);
//        }

//        return fn(err, null);
//    });
//};

exports.validateSession = function (id, fn) {
    db.view('users/by_userid', { key: id }, function (err, response) {
        console.log(err);
        if (response.length) {
            return fn(null, response);
        }

        return fn(err, null);
    });
}; 