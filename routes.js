var _u = require('underscore'),
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

    app.get('/api/user/details', function (req, res) {
        if (req.isAuthenticated()) {
            res.send({ 'username': req.user.username, 'roles': req.user.roles });
        }
        res.send({});
    });

    app.get('/api/loggedin', function (req, res) {
        console.log('isauthenticated: ' + req.isAuthenticated());
        res.send({ status: req.isAuthenticated() });
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

    app.get('/api/:consoleId', function (req, res) {
        db.view('games/by_console', { key: req.params.consoleId }, function (err, response) {
            var r = [];

            _u.each(response, function (item) {
                r.push(item.value);
            });

            res.send(r);
        });
    });

    app.get('/api/:consoleId/:gameId', function (req, res) {
        db.view('games/all', { key: req.params.gameId }, function (err, response) {
            res.send(response);
        });
    });

    app.get('/api/user/:userName/:consoleId', function (req, res) {
        couch.getUserIdByName(req.params.userName, function (err, response) {
            if (err) {
                console.log("Ingen användare hittades");
                res.send(404);
            }
            var userId = response[0].id;
            db.view('games/by_user', {
                startkey: [userId, req.params.consoleId],
                endkey: [userId, req.params.consoleId, {}],
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
                res.send({ items: list, showControls: userId === requestId });
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
}