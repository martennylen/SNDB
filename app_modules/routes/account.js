var _u = require('underscore'),
    pwhelper = require('../password.js'),
    request = require('request'),
    couch = require('../couch'),
    db = couch.db();

module.exports = function(app, passport) {
    app.post('/api/admin/update', function(req, res) {
        request.put({
                uri: couch.updatePath() + req.body.game.id,
                body: JSON.stringify({ "/data": req.body.game.data })
            }, function(error) {
                if (error) {
                    res.send(500);
                }
                res.send(200);
            });
    });

    app.post('/api/register', function(req, res) {
        db.view('users/by_username', { key: req.body.username }, function(err, response) {
            if (response.length) {
                res.send(409);
            }

            var h = pwhelper.hash(req.body.password);
            var newUser = {
                type: 'user',
                salt: h.salt,
                hash: h.hash,
                user: req.body.username,
                displayName: req.body.displayName,
                email: req.body.email,
                roles: ['u']
            };

            db.save(newUser, function(err2, res2) {
                if (err2) {
                    res.send(500);
                }

                res.send(200);
            });
        });
    });

    app.get('/api/loggedin', function(req, res) {
        if (req.user && req.isAuthenticated && _u.contains(req.user.roles, 'a')) {
            res.send({ status: true, user: req.user });
        } else {
            res.send({ status: false });
        }
    });

    app.post('/api/login', function(req, res, next) {
        passport.authenticate('local', function(err, user, info) {
            if (err) {
                return next(err);
            }
            if (!user) {
                return res.send({ success: false, message: 'Användarnamn och eller lösenord hittades inte.' });
            }
            req.logIn(user, function(err) {
                if (err) {
                    return next(err);
                }
                return res.send({ success: true, user: user });
            });
        })(req, res, next);
    });

    app.post('/api/logout', function(req, res) {
        //req.session.destroy(function (err) {
        //    res.redirect('/');
        //});
        if (req.isAuthenticated()) {
            req.logOut();
        }
        res.send(200);
    });
}