﻿var _u = require('underscore'),
    pwhelper = require('./password.js'),
    request = require('request'),
    couch = require('./couch'),
    db = couch.db();

var indexOfValue = _u.indexOf;
_u.mixin({

    // return the index of the first array element passing a test
    indexOf: function (array, test) {
        // delegate to standard indexOf if the test isn't a function
        if (!_u.isFunction(test)) return indexOfValue(array, test);
        // otherwise, look for the index
        for (var x = 0; x < array.length; x++) {
            if (test(array[x])) return x;
        }
        // not found, return fail value
        return -1;
    }

});

module.exports = function(app, passport) {
    var auth = function(req, res, next) {
        if (!req.isAuthenticated()) {
            res.send(401);
        } else {
            next();
        }
    };

    //app.get('/api', function (req, res) {
    //    res.header("Access-Control-Allow-Origin", "http://localhost");
    //    res.header("Access-Control-Allow-Methods", "GET, POST");
    //});

    app.post('/api/admin/update', function (req, res) {
        request.put({
            uri: couch.updatePath() + req.body.game.id,
            body: JSON.stringify({ "/data": req.body.game.data })
        }, function (error) {
            if (error) {
                res.send(500);
            }
            res.send(200);
        });
    });

    app.post('/api/register', function (req, res) {
        db.view('users/by_username', { key: req.body.username }, function (err, response) {
            if (response.length) {
                res.send(409);
            }

            var h = pwhelper.hash(req.body.password);
            var newUser = {
                type: 'user',
                salt: h.salt,
                hash: h.hash,
                user: req.body.username,
                email: req.body.email,
                roles: ['u']
            };

            db.save(newUser, function (err2, res2) {
                if (err2) {
                    res.send(500);
                }
                
                res.send(200);
            });
        });
    });

    app.get('/api/loggedin', function (req, res) {
        if (req.isAuthenticated && _u.contains(req.user.roles, 'a')) {
            res.send({ status: true, user: req.user });
        } else {
            res.send({ status: false });
        }
    });
    
    app.post('/api/login', function(req, res, next) {
        passport.authenticate('local', function(err, user, info) {
            if (err) {
                return next(err); // will generate a 500 error
            }
            if (!user) {
                return res.send({ success : false, message : 'Användarnamn och eller lösenord hittades inte.' });
            }
            req.logIn(user, function (err) {
                if (err) { return next(err); }
                return res.send({ success: true, user: user });
            });
        })(req, res, next);
    });

    app.post('/api/logout', function (req, res) {
        //req.session.destroy(function (err) {
        //    res.redirect('/');
        //});
        if (req.isAuthenticated()) {
            req.logOut();
        }
        res.send(200);
    });
    
    app.get('/api/user/details', function (req, res) {
        if (req.isAuthenticated()) {
            res.send({ 'username': req.user.username, 'roles': req.user.roles });
        }
        res.send({});
    });

    app.get('/api/user/stats/:userName', function (req, res) {
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
            }
            else if (req.query.consoleName) {
                reqObj.startkey = [userId, req.query.consoleName];
                reqObj.endkey = [userId, req.query.consoleName, {}];
                reqObj.group_level = level;
            }

            db.view('games/stats_by_user', reqObj, function(err, resp) {
                var stats = _u.map(resp, function (c) {
                    return { id: c.key[level - 1], count: c.value };
                });

                stats = _u.sortBy(stats, function (s) { return s.count; });
                res.send(stats.reverse());
            });
        });
    });

    app.get('/api/user/:userName/:consoleName/:regionName/:subRegionName', function (req, res) {
        db.view('users/by_user', { key: req.params.userName }, function (err, response) {
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
                var managed = mapUserGameResponse(response, req.user);
                res.send({
                    games: managed.list, loggedIn: userId === managed.userId
                });
            });
        });
    });
    
    function mapUserGameResponse(response, user) {
        var list = [];
        _u.each(response, function (game) {
            var current = {};
            current.id = game.doc._id;
            current.data = game.doc.data;
            
            current.data.variants = game.doc.data.variants;
            _u.each(current.data.variants, function (v, j) {
                v.attr.common = _u.map(v.attr.common, function (attr, i) {
                    return { id: attr.id, 'desc': attr.desc, 'longName': attr.id === 'c' ? 'Kassett' : attr.id === 'i' ? 'Manual' : 'Kartong', status: game.value.game.attr[j] ? game.value.game.attr[j].common[i] : false };
                });

                v.attr.extras = _u.map(v.attr.extras, function (attr, i) {
                    return { id: i, 'longName': attr.name, status: game.value.game.attr[j] ? game.value.game.attr[j].extras[i] : false};
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

    app.post('/api/user/add', function (req, res) {
        var gameItem = {
            type: 'item',
            owner: req.user.id,
            game: req.body
        };
        db.save(gameItem, function (err, resp) {
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
        }, function (error) {
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

    app.post('/api/newgame', function (req, res) {
        var game = req.body;
        game.data.tags = [game.data.name.replace(/[^a-z0-9\s]/gi, '').toLowerCase()];

        if (_u.indexOf(game.data.name, ' ') > -1) {
            _u.each(game.data.name.split(' '), function(word) {
                if (word.length > 2 && word !== 'the') {
                    game.data.tags.push(word.replace(/[^a-z0-9\s]/gi, '').toLowerCase());
                }
            });
        }

        db.save(game, function (err, resp) {
            if (err) {
                res.send(500);
            }

            res.send(200);
        });
    });

    app.get('/api/search/:consoleName', function (req, res) {
        var reqObj = {
            startkey: [req.query.q, req.params.consoleName],
            endkey: [req.query.q + '\u9999', req.params.consoleName]
        };
        
        if (req.params.consoleName === 'null') {
            reqObj = {
                startkey: [req.query.q, {}],
                endkey: [req.query.q + '\u9999', {}]
            };
        }
        db.view('games/by_tags', reqObj, function (err, response) {
            if (err) {
                res.send(500);
            }

            response = _u.uniq(response, function (g) { return g.id; });
            
            if (req.user !== undefined && req.params.consoleName !== 'null') {
                db.view('games/by_user', {
                    startkey: [req.user.id, req.params.consoleName],
                    endkey: [req.user.id, req.params.consoleName, '\u9999']
                }, function (e, resp) {
                    if (e) {
                        res.send(500);
                    }

                    var list = mapGameInformation(resp, response, (req.query.r !== undefined));
                    res.send({ games: list, loggedIn: true });
                });
            } else {
                res.send({
                    games: mapAttributes(response), loggedIn: false
                });
            }
        });
    });
    
    function mapGameInformation(resp, response, isUserScope) {
        var result = [];
        var hasGames = resp.length > 0;
        var found = -1;
        
        _u.each(response, function (game) {
            if (hasGames) {

                found = _u.indexOf(resp, function (comb) {
                    return game.value.id === comb.value.game.id;
                });
            }

            _u.each(game.value.data.variants, function (v, j) {
                v.attr.common = _u.map(v.attr.common, function (attr, i) {
                    return { id: attr.id, 'desc': attr.desc, 'longName': attr.id === 'c' ? 'Kassett' : attr.id === 'i' ? 'Manual' : 'Kartong', status: ((found > -1) ? resp[found].value.game.attr[j] ? resp[found].value.game.attr[j].common[i] : false : false) };
                });

                v.attr.extras = _u.map(v.attr.extras, function (attr, i) {
                    return { id: i, 'longName': attr.name, status: ((found > -1) ? resp[found].value.game.attr[j] ? resp[found].value.game.attr[j].extras[i] : false : false) };
                });

                v.attr.note = (found > -1) ? resp[found].value.game.attr[j] ? resp[found].value.game.attr[j].note : '' : '';
                v.extrasComplete = (found > -1) ? v.attr.extras.length ? _u.all(_u.pluck(v.attr.extras, 'status')) : true : false;
                v.isComplete = (found > -1) ? _u.all(_u.pluck(v.attr.common, 'status')) && v.extrasComplete : false;

                v.isNew = (found > 1) ? false : true;
            });

            if (found > -1) {
                game.value.item = resp[found].id;
                game.value.isNew = false;
                game.value.isComplete = _u.some(_u.pluck(game.value.data.variants, 'isComplete'));
                resp.splice(found, 1);
            } else {
                game.value.isNew = true;
            }

            if (!isUserScope) {
                result.push(game.value);
            } else {
                if (found > -1) {
                    result.push(game.value);
                }
            }
        });

        return result;
    }
    
    function mapAttributes(response) {
        var result = [];
        _u.each(response, function (game) {
            _u.each(game.value.data.variants, function(v) {
                v.attr.common = _u.map(v.attr.common, function (attr) {
                    return { id: attr.id, 'desc': attr.desc, 'longName': attr.id === 'c' ? 'Kassett' : attr.id === 'i' ? 'Manual' : 'Kartong'};
                });
                v.attr.extras = _u.map(v.attr.extras, function (attr) {
                    return { id: attr.id };
                });
            });
            result.push(game.value);
        });

        return result;
    }
    
    app.get('/api/:consoleName/:regionName/:subRegionName', function (req, res) {
        var gameName = req.query.gameName.length ? req.query.gameName.replace('+', '%20') : {};
        var startkey = [req.params.consoleName, req.params.regionName, req.params.subRegionName];
        if (gameName.length) {
            startkey = [req.params.consoleName, req.params.regionName, req.params.subRegionName, gameName];
        }
        db.view('games/by_console', { 
            startkey: startkey,
            endkey: [req.params.consoleName, req.params.regionName, req.params.subRegionName, {}],
            startkey_docid: req.query.docid,
                limit: 21,
                skip: req.query.skip
        }, function (err, response) {
            if (req.user !== undefined) {
                db.view('games/by_user', {
                    startkey: [req.user.id, req.params.consoleName],
                    endkey: [req.user.id, req.params.consoleName, {}]
                }, function(e, resp) {
                    if (e) {
                        res.send(500);
                    }
                    
                    var list = mapGameInformation(resp, response, false);  
                    res.send({ games: list, loggedIn: true });
                });
            } else {
                res.send({
                    games: mapAttributes(response), loggedIn: false
                });
            }
        });
    });

    app.get('/api/:consoleName/:regionName/:subRegionName/:gameName', function (req, res) {
        db.view('games/all', { key: req.params.gameName.split('-').join(' ') }, function (err, response) {
            //TA BARA DET VI BEHÖVER, INTE HELA COUCH-MODELLEN
            if (err) {
                res.send(404);
            }
            res.send(response[0].value);
        });
    });

    app.get('/api/stats', function (req, res) {
        var level = req.query.level;

        var reqObj = { group_level: level };
        if (req.query.regionName) {
            reqObj.startkey = [req.query.consoleName, req.query.regionName];
            reqObj.endkey = [req.query.consoleName, req.query.regionName, {}];
            reqObj.group_level = level;
        }
        else if (req.query.consoleName) {
            reqObj.startkey = [req.query.consoleName];
            reqObj.endkey = [req.query.consoleName, {}];
            reqObj.group_level = level;
        }
        
        db.view('games/stats_by_console', reqObj, function(err, resp) {            
            if (err) {
                res.send(500);
            }
            var stats = _u.map(resp, function(c) {
                return { id: c.key[level-1], count: c.value };
            });

            stats = _u.sortBy(stats, function (s) { return s.count; });
            res.send(stats.reverse());
        });
    });
}