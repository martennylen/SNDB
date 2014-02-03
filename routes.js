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
                if (err) {
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
            console.log('apa ' + userId);
            db.view('games/stats_by_user', {
                startkey: [userId],
                endkey: [userId, {}],
                group: true
            }, function (err, response) {
            if (err) {
                res.send(500);
            }
            var list = [];
            _u.each(response, function (unique) {
                //console.log(unique);
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

            db.view('games/by_user', {
                startkey: [userId, req.params.consoleName],
                endkey: [userId, req.params.consoleName, {}],
                include_docs: true
            }, function (err, response) {
                var list = [];
                _u.each(response, function (game, i) {
                    var current = {};
                    current.id = game.doc._id;
                    current.name = game.doc.name;
                    current.attr = {};
                    var currentAttr = {};
                    current.attr.common = _u.map(game.value.game.attr.common, function (attr, iter) {
                        currentAttr = game.doc.attr.common[iter];
                        return { 'id': currentAttr, 'longName': currentAttr === 'c' ? 'Kassett' : currentAttr === 'i' ? 'Manual' : 'Kartong', 'status': game.value.game.attr.common[iter] };
                    });
                    current.attr.extras = _u.map(game.value.game.attr.extras, function (attr, iter) {
                        currentAttr = game.doc.attr.extras[iter];
                        return { 'id': currentAttr, 'status': game.value.game.attr.extras[iter] };
                    });
                    current.attr.note = game.value.game.attr.note;
                    current.regions = game.doc.regions;
                    current.item = game.id;
                    list.push(current);
                });
                //req.user.id //IF userID === req.user.id THEN SAME USER, SHOW EDIT ON CLICK
                //console.log(userId + ' ' + req.user.id);
                var requestId = '';
                if (req.user !== undefined) {
                    requestId = req.user.id;
                }
                res.send({ games: list, showControls: userId === requestId });
            });
        });
    });

    app.post('/api/user/update', function(req, res) {
        //var reqObj = {};
        //reqObj["/game/" + req.body.level + '/' + req.body.index] = req.body.status;
        console.log(req.body.item);
        console.log(req.body.attrs);
        request.put({
            uri: couch.updatePath() + req.body.item,
            body: JSON.stringify({ "/game/attr": req.body.attrs })
        }, function (error) {
            if (error) {
                res.send(500);
            }
            res.send(200);
        });
    }); 

    app.post('/api/newgame', function (request, response) {
        db.save(request.body, function (err, res) {
            if (res.ok) {
                response.send({ 'reply': 'ok' });
            }
        });
    });
    
    app.get('/api/:consoleName', function (req, res) {
        //db.view('games/by_console', { key: req.params.consoleName }, function (err, response) {
        //    var r = [];

        //    _u.each(response, function (item) {
        //        r.push(item.value);
        //    });

        //    res.send(r);
        //});
        
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

        db.view('games/by_console', { key: req.params.consoleName }, function (err, response) {
            if (req.user !== undefined) {
                db.view('users/by_user', { key: req.user.username }, function(e2, r2) {
                    if (e2) {
                        console.log("Ingen användare hittades");
                        res.send(404);
                    }

                    var userId = r2[0].id;
                    var result = [];

                    db.view('games/by_user', {
                        startkey: [userId, req.params.consoleName],
                        endkey: [userId, req.params.consoleName, {}]
                    }, function(e, resp) {
                        if (e) {
                            res.send(500);
                        }
                        if (resp.length) {
                            var found = {};
                            _u.each(response, function(game) {
                                found = _u.indexOf(resp, function(comb) {
                                    return game.value.id === comb.value.game.id;
                                });

                                var status = false;
                                console.log(game.value);
                                game.value.attr.common = _u.map(game.value.attr.common, function (attr, i) {
                                    status = (found > -1) ? resp[found].value.game.attr.common[i] : false;
                                    return { id: attr, status: status };
                                });
                                game.value.attr.extras = _u.map(game.value.attr.extras, function (attr, i) {
                                    status = (found > -1) ? resp[found].value.game.attr.extras[i] : false;
                                    return { id: attr, status: status };
                                });

                                if (found > -1) {
                                    game.value.attr.isNew = false;
                                    resp.splice(found, 1);
                                } else {
                                    game.value.attr.isNew = true;
                                }
                                
                                result.push(game.value);
                            });

                            res.send(result);
                        } else {
                            res.send(_u.map(response, function (game) {
                                return game.value;
                            }));
                        }
                    });
                });
            } else {
                res.send(_u.map(response, function (game) {
                    return game.value;
                }));
            }
            //_u.each(response, function (item) {


                //    result.push(item.value);
                //});

                //if (req.query.u) {
                //    var d = [];
                //    //db.view('games/by_user', { key: req.query.u }, function(e, resp) {
                //        _u.each(resp[0].value, function(item) {
                //            d.push(item);
                //        });

                //        var found = {};
                //        _u.map(d, function(it) {
                //            found = _u.find(r, function(g) {
                //                return g.id === it.id;
                //            });

                //            if (found) { // User has game                        
                //                //found.attr.common = _u.object(found.attr.common, it.attr.common);
                //                found.attr.common = _u.map(found.attr.common, function(x, iter) {
                //                    return { 'id': x, 'status': it.attr.common[iter] };
                //                });
                //                found.attr.e = it.attr.e;
                //            }
                //        });
                //    }
                //        res.send(r);
                //    });
                //} else {
                //    res.send(r);
                //}
            });
    });

    app.get('/api/:consoleName/:gameName', function (req, res) {
        db.view('games/all', { key: req.params.gameName.split('-').join(' ') }, function (err, response) {
            //TA BARA DET VI BEHÖVER, INTE HELA COUCH-MODELLEN
            if (err) {
                res.send(404);
            }
            console.log(response[0].value);
            res.send(response[0].value);
        });
    });
}