var http = require('http'),
    express = require('express'),
    path = require('path'),
    couch = require('./couch'),
    passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    pwhelper = require('./password.js'),
    uuid = require('node-uuid');

    passport.use(new LocalStrategy(
      function (username, password, done) {
          couch.validateUser(username, function (err, user) {
              if (err) {
                  return done(null, false, { message: 'Användaren hittades inte eller lösenordet stämmer inte.' });
              }

              if (!pwhelper.validate(user.hash, password, user.salt)) {
                return done(null, false, { message: 'Användaren hittades inte eller lösenordet stämmer inte.' });
              }
              return done(null, { "id": user.id, "username": user.username, "roles": user.roles });
          });
      }
    ));
    
    passport.serializeUser(function (user, done) { 
        done(null, user);
    });

    passport.deserializeUser(function (user, done) {
        couch.validateSession(user.id, function (err, res) {
            if (err) {
                return done(null, false);
            }
            return done(null, user);
        });
    });

    var port = process.env.PORT || 8101;
    var app = express();

    app.configure(function(){
        app.set('port', port);
        app.use(express.static(__dirname + '/public'));
        app.use(require('less-middleware')({ src: __dirname + '/public' }));
        app.use(express.cookieParser()); 
        app.use(express.logger('dev'));
        app.use(express.bodyParser());
        app.use(express.cookieSession({ key: 'trackr.sess', secret: '1c001babc0f1f93227ad952ee29ce2ec', cookie: { httpOnly: false, maxAge: 604800000 } }));
        app.use(passport.initialize());
        app.use(passport.session());
    });

    app.configure('development', function () {
        app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
    });

    app.configure('production', function () {
        app.use(express.errorHandler());
    });

    require('./routes')(app, passport);

    http.createServer(app).listen(app.get('port'), function () {
        console.log("Express server listening on port " + app.get('port'));
    });