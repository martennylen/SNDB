var _u = require('underscore'),
    pwhelper = require('./password.js'),
    request = require('request'),
    couch = require('./couch'),
    db = couch.db();

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
                console.log(res2);
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

    app.get('/api/user/:userName', function (req, res) {
        console.log(req.params);
        db.view('users/by_user', { key: req.params.userName }, function(err, response) {
            if (err) {
                console.log("Ingen användare hittades");
                res.send(404);
            }
            var userId = response[0].id;

            db.view('games/console_stats_by_user', {
                startkey: [userId],
                group: true
            }, function (err, response) {
            if (err) {
                res.send(500);
            }
            var list = [];
            _u.each(response, function (unique) {
                list.push({ console: unique.key[1], count: unique.value });
            });

            res.send(list);
            });
        });
    });

    app.get('/api/user/:userName/:consoleName', function (req, res) {
        db.view('users/by_user', { key: req.params.userName }, function (err, response) {
            if (err) {
                console.log("Ingen användare hittades");
                res.send(404);
            }
            var userId = response[0].id;
            db.view('games/stats_by_user', {
                    startkey: [userId, req.params.consoleName],
                    endkey: [userId, req.params.consoleName, {}],
                    group_level: 3
                }, function(err, stats) {
                    if (err) {
                        res.send(409);
                    }
                    console.log(JSON.stringify(stats));
                    
                    db.view('games/by_user', {
                            startkey: [userId, req.params.consoleName],
                            endkey: [userId, req.params.consoleName, {}],
                            include_docs: true
                        }, function(err, response) {
                            var list = [];
                            _u.each(response, function(game, i) {
                                var current = {};
                                current.id = game.doc._id;
                                current.name = game.doc.name;
                                current.attr = {};
                                var currentAttr = {};
                                current.attr.common = _u.map(game.value.game.attr.common, function(attr, iter) {
                                    currentAttr = game.doc.attr.common[iter];
                                    return { 'id': currentAttr, 'longName': currentAttr === 'c' ? 'Kassett' : currentAttr === 'i' ? 'Manual' : 'Kartong', 'status': game.value.game.attr.common[iter] };
                                });
                                current.attr.extras = _u.map(game.value.game.attr.extras, function(attr, iter) {
                                    currentAttr = game.doc.attr.extras[iter];
                                    return { 'id': iter, 'longName': currentAttr.name, 'status': game.value.game.attr.extras[iter] };
                                });
                                current.attr.note = game.value.game.attr.note;
                                current.attr.extrasComplete = current.attr.extras.length ? _u.all(_u.pluck(current.attr.extras, 'status')) : true;
                                current.attr.isComplete = _u.every(_u.pluck(current.attr.common, 'status')) && current.attr.extrasComplete;
                                current.regions = game.doc.regions;
                                current.item = game.id;
                                list.push(current);
                            });

                            var requestId = '';
                            if (req.user !== undefined) {
                                requestId = req.user.id;
                            }
                            res.send({ regions: _u.map(stats, function(s) {
                                return { region: s.key[2], count: s.value };
                            }), games: list, loggedIn: userId === requestId });
                        });
                });
        });
    });

    app.post('/api/user/add', function (req, res) {
        var gameItem = {
            type: 'item',
            owner: req.user.id,
            game: {            
                id: req.body.id,
                console: req.body.console,
                attr: req.body.attr
            }
        };
        db.save(gameItem, function (err, resp) {
            if (err) {
                res.send(500);
            }
            res.send(200);
        });
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
        console.log(JSON.stringify(req.body));
        db.save(req.body, function (err, resp) {
            if (err) {
                res.send(500);
            }

            res.send(200);
        });
        //res.send(200);
    });

    app.get('/api/search/:consoleName', function (req, res) {
        db.view('games/by_tags', {
            startkey: [req.params.consoleName, req.query.q],
            endkey: [req.params.consoleName, req.query.q + '\uffff']
        }, function (err, response) {
            if (err) {
                res.send(500);
            }

            response = _u.uniq(response, function (g) { return g.id; });
            
            if (req.user !== undefined) {
                db.view('games/by_user', {
                    startkey: [req.user.id, req.params.consoleName],
                    endkey: [req.user.id, req.params.consoleName, {}]
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

            game.value.attr.common = _u.map(game.value.attr.common, function (attr, i) {
                return { id: attr, 'longName': attr === 'c' ? 'Kassett' : attr === 'i' ? 'Manual' : 'Kartong', status: ((found > -1) ? resp[found].value.game.attr.common[i] : false) };
            });
            game.value.attr.extras = _u.map(game.value.attr.extras, function (attr, i) {
                return { id: i, 'longName': attr.name, status: ((found > -1) ? resp[found].value.game.attr.extras[i] : false) };
            });
            game.value.attr.note = (found > -1) ? resp[found].value.game.attr.note : '';
            game.value.attr.extrasComplete = (found > -1) ? game.value.attr.extras.length ? _u.all(_u.pluck(game.value.attr.extras, 'status')) : true : false;
            game.value.attr.isComplete = (found > -1) ? _u.all(_u.pluck(game.value.attr.common, 'status')) && game.value.attr.extrasComplete : false;

            if (found > -1) {
                game.value.attr.isNew = false;
                game.item = resp[found].id;
                resp.splice(found, 1);
            } else {
                game.value.attr.isNew = true;
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
        return _u.map(response, function(game) {
            game.value.attr.common = _u.map(game.value.attr.common, function(attr) {
                return { id: attr };
            });
            game.value.attr.extras = _u.map(game.value.attr.extras, function(attr) {
                return { id: attr };
            });
            return game.value;
        });
    }
    
    app.get('/api/:consoleName/:regionName/:subRegionName', function (req, res) {        
        var indexOfValue = _u.indexOf;

        // using .mixin allows both wrapped and unwrapped calls:
        // _(array).indexOf(...) and _.indexOf(array, ...)
        _u.mixin({

            // return the index of the first array element passing a test
            indexOf: function(array, test) {
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

        db.view('games/by_console', { 
                startkey: [req.params.consoleName, req.params.regionName, req.params.subRegionName],
                endkey: [req.params.consoleName, req.params.regionName, req.params.subRegionName, '\uffff']
            }, function (err, response) {
            console.log(req.user);
            if (req.user !== undefined) {
                //var result = [];

                db.view('games/by_user', {
                    startkey: [req.user.id, req.params.consoleName],
                    endkey: [req.user.id, req.params.consoleName, {}]
                }, function(e, resp) {
                    if (e) {
                        res.send(500);
                    }
                    
                    //var list = _u.pluck(response, 'value');
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
}