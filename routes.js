var _u = require('underscore'),
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
        console.log('yoohoo');
        if (req.isAuthenticated()) {
            console.log(req.user.roles);
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
            // Generate a JSON response reflecting authentication status
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

    app.get('/api/user/:userId/:consoleId', function (req, res) {
        db.view('games/by_console', { key: req.params.consoleId }, function (err, response) {
            var r = [];

            _u.each(response, function (item) {
                r.push(item.value);
            });
            var d = [];
            db.view('games/by_user', { key: req.params.userId }, function (e, resp) {
                _u.each(resp[0].value, function (item) {
                    d.push(item);
                });

                var found = {};
                _u.map(d, function (it) {
                    found = _u.find(r, function (g) {
                        return g.id === it.id;
                    });

                    if (found) { // User has game                        
                        //found.attr.common = _u.object(found.attr.common, it.attr.common);
                        found.attr.common = _u.map(found.attr.common, function (x, iter) {
                            return { 'id': x, 'longName': x === 'c' ? 'Kassett' : x === 'i' ? 'Manual' : 'Kartong', 'status': it.attr.common[iter] };
                        });
                        found.attr.extras = _u.map(found.attr.e, function (x, iter) {
                            return { 'id': x, 'status': it.attr.e[iter] };
                        });
                    }
                });
                res.send(r);
            });
        });
    });

    app.post('/api/newgame', function (request, response) {
        db.save(request.body, function (err, res) {
            if (res.ok) {
                response.send({ 'reply': 'ok' });    // echo the result back
            }
        });
    });
}