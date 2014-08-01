var http = require('http'),
    express = require('express'),
    path = require('path'),
    couch = require('./app_modules/couch'),
    passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    pwhelper = require('./app_modules/password'),
    uuid = require('node-uuid'),
    assets = require('./assets'),
    BundleUp = require('bundle-up2'),
    fs = require('fs');

    passport.use(new LocalStrategy(
      function (username, password, done) {
          couch.validateUser(username, function (err, user) {
              if (err || !pwhelper.validate(user.hash, password, user.salt)) {
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
        app.use(require('less-middleware')({ src: __dirname + '/public_html' }));
        app.use(express.static(__dirname + '/public_html')); 
        app.use(express.cookieParser()); 
        app.use(express.logger('dev'));
        app.use(express.bodyParser());
        app.use(express.cookieSession({ key: 'trackr.sess', secret: '1c001babc0f1f93227ad952ee29ce2ec', cookie: { httpOnly: false, maxAge: 604800000 } }));
        app.use(passport.initialize());
        app.use(passport.session()); 
    });
    
    app.configure('development', function () {
        app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
        
        //BundleUp(app, assets, {
        //    staticRoot: __dirname + '/public/_html',
        //    staticUrlRoot: '/',
        //    bundle: true,
        //    minifyCss: true,
        //    minifyJs: true,
        //    //complete: console.log.bind(console, "Bundle-up: static files are minified/ready")
        //    complete: function () {
        //        fs.readdir(__dirname + '/public/min/bundle', function (err, files) {
        //            files.forEach(function (f) {
        //                var name = f.split('_')[1];
        //                fs.rename(__dirname + '/public_html/min/bundle/' + f, __dirname + '/public_html/min/bundle/' + name, function (err) {
        //                    if (err) {
        //                        console.log(err);
        //                    } else {
        //                        console.log('asset files renamed');
        //                    }
        //                });
        //            });
        //        });
        //    }
        //});
    });

    app.configure('production', function () {
        app.use(express.errorHandler());
        app.set('json spaces', 0); 
    });
    
    require('./app_modules/routes/account')(app, passport);
    require('./app_modules/routes/start')(app, passport);
    require('./app_modules/routes/user')(app, passport);
    require('./app_modules/routes/game')(app, passport);

    http.createServer(app).listen(app.get('port'), function () {
        console.log("Express server listening on port " + app.get('port'));
    });