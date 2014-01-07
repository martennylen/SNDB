var config = require('./config')
  , utils = require('./utils')
  , cradle = require('cradle')
  , connection = new(cradle.Connection)(config.couchdb.url, config.couchdb.port,
        cache: true});

