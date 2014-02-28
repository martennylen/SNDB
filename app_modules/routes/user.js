var _u = require('underscore'),
    request = require('request'),
    couch = require('../couch'),
    db = couch.db();

module.exports = function(app, passport) {
    app.get('/api/user/details', function(req, res) {
        if (req.isAuthenticated()) {
            res.send({ 'username': req.user.username, 'roles': req.user.roles });
        }
        res.send({});
    });

    app.get('/api/user/stats/attrs/:userName', function(req, res) {
        db.view('users/by_user', { key: req.params.userName }, function(err, response) {
            if (err) {
                console.log("Ingen användare hittades");
                res.send(404);
            }
            var userId = response[0].id;
            var level = req.query.level;

            var reqObj = { startkey: [userId], group_level: level };

            db.view('games/stats_by_attrs', reqObj, function(err, response) {
                var result = _u.map(response, function(a) {
                    a.key[1] = a.key[1] === '0' ? 'c' : a.key[1] === '1' ? 'i' : 'b';
                    return { id: a.key[1], count: a.value };
                });
                res.send(result);
            });
        });
    });

    app.get('/api/user/stats/:userName', function(req, res) {
        db.view('users/by_user', { key: req.params.userName }, function(err, response) {
            if (err) {
                console.log("Ingen användare hittades");
                res.send(404);
            }
            var userId = response[0].id;
            var level = req.query.level;

            var reqObj = { startkey: [userId], endkey: [userId, {}], group_level: level };

            if (req.query.regionName) {
                reqObj.startkey = [userId, req.query.consoleName, req.query.regionName];
                reqObj.endkey = [userId, req.query.consoleName, req.query.regionName, {}];
                reqObj.group_level = level;
            } else if (req.query.consoleName) {
                reqObj.startkey = [userId, req.query.consoleName];
                reqObj.endkey = [userId, req.query.consoleName, {}];
                reqObj.group_level = level;
            }

            db.view('games/stats_by_user', reqObj, function(err, resp) {
                var stats = _u.map(resp, function(c) {
                    return { id: c.key[level - 1], count: c.value };
                });

                stats = _u.sortBy(stats, function(s) { return s.count; });
                res.send(stats.reverse());
            });
        });
    });

    app.get('/api/user/:userName/:consoleName/:regionName/:subRegionName', function(req, res) {
        db.view('users/by_user', { key: req.params.userName }, function(err, response) {
            if (err) {
                console.log("Ingen användare hittades");
                res.send(404);
            }
            var userId = response[0].id;
            var startkey = [userId, req.params.consoleName, req.params.regionName, req.params.subRegionName];

            if (req.query.gameName) {
                var gameName = req.query.gameName.length ? req.query.gameName.replace('+', '%20') : {};
                if (gameName.length) {
                    startkey = [userId, req.params.consoleName, req.params.regionName, req.params.subRegionName, gameName];
                }
            }

            db.view('games/by_user', {
                    startkey: startkey,
                    endkey: [userId, req.params.consoleName, req.params.regionName, req.params.subRegionName, {}],
                    limit: 21,
                    skip: req.query.skip,
                    include_docs: true
            }, function (err, response) {
                console.log(response.length);
                    var managed = mapUserGameResponse(response, req.user);
                    res.send({
                        games: managed.list,
                        loggedIn: userId === managed.userId
                    });
                });
        });
    });

    function mapUserGameResponse(response, user) {
        var list = [];
        _u.each(response, function(game) {
            var current = {};
            current.id = game.doc._id;
            current.data = game.doc.data;

            current.data.variants = game.doc.data.variants;
            _u.each(current.data.variants, function(v, j) {
                v.attr.common = _u.map(v.attr.common, function(attr, i) {
                    return { id: attr.id, 'desc': attr.desc, 'longName': attr.id === 'c' ? 'Kassett' : attr.id === 'i' ? 'Manual' : 'Kartong', status: game.value.game.attr[j] ? game.value.game.attr[j].common[i] : false };
                });

                v.attr.extras = _u.map(v.attr.extras, function(attr, i) {
                    return { id: i, 'longName': attr.name, status: game.value.game.attr[j] ? game.value.game.attr[j].extras[i] : false };
                });

                v.attr.note = game.value.game.attr[j] ? game.value.game.attr[j].note : '';
                v.extrasComplete = v.attr.extras.length ? _u.all(_u.pluck(v.attr.extras, 'status')) : true;
                v.isComplete = _u.all(_u.pluck(v.attr.common, 'status')) && v.extrasComplete;

                v.attr.isNew = false;
            });

            current.item = game.id;
            current.isComplete = _u.some(_u.pluck(current.data.variants, 'isComplete'));
            list.push(current);
        });

        var requestId = '';
        if (user !== undefined) {
            requestId = user.id;
        }

        return { list: list, userId: requestId };
    }

    app.post('/api/user/add', function(req, res) {
        var gameItem = {
            type: 'item',
            owner: req.user.id,
            game: req.body
        };
        db.save(gameItem, function(err, resp) {
            if (err) {
                res.send(500);
            }

            res.send(200);
        });
        res.send(200);
    });

    app.post('/api/user/update', function(req, res) {
        request.put({
                uri: couch.updatePath() + req.body.item,
                body: JSON.stringify({ "/game/attr": req.body.attr })
            }, function(error) {
                if (error) {
                    res.send(500);
                }
                res.send(200);
            });
    });

    app.post('/api/user/remove', function(req, res) {
        db.remove(req.body.item, function(err, resp) {
            if (err) {
                res.send(500);
            }

            res.send(200);
        });
    });
};