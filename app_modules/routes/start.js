var _u = require('underscore'),
    Q = require('q'),
    couch = require('../couch'),
    request = require('request'),
    db = couch.db();

module.exports = function (app, passport) {

    app.get('/api/start/stats', function (req, res) {
        db.view('games/by_created', { descending: true }, function (err, created) {
            if (err) {
                res.send(404);
            }
            
            db.view('games/by_updated', { descending: true }, function (err2, updated) {
                if (err2) {
                    res.send(404);
                }

                res.send({ created: created, updated: updated });
            });
        });
    });
}