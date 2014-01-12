var http = require('http'),
    express = require('express'),
    path = require('path'),
    _u = require('underscore');

var port = process.env.PORT || 8101;
var app = express();

app.configure(function(){
  app.set('port', port);
  //app.set('views', __dirname + '/views');
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.static(__dirname + '/public'));
  //app.use(express.static(process.env.PWD + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/api', function(req, res) {
   res.header("Access-Control-Allow-Origin", "http://localhost");
   res.header("Access-Control-Allow-Methods", "GET, POST");
});

var Config = require('./config')
  , conf = new Config()
  , cradle = require('cradle')
  , connection = new(cradle.Connection)(conf.couchdb.url, conf.couchdb.port, {cache: true}),
  db = connection.database("sndb");

  app.get('/api/:consoleId/:gameId', function(req, res){
    db.view('games/all', { key: req.params.gameId }, function(err, response){
        res.send(response);
    });
  });

  app.get('/api/:consoleId', function (req, res) {
      db.view('games/by_console', { key: req.params.consoleId }, function (err, response) {
        var r = [];
          
        _u.each(response, function (item) {
          r.push(item.value);
        });
          
        if (req.query.u) {
            var d = [];
            db.view('games/by_user', { key: req.query.u }, function (e, resp) {
                _u.each(resp[0].value, function (item) {
                    d.push(item);
                });

                var found = {};
                _u.map(d, function(it) {
                    found = _u.find(r, function(g) {
                        return g.id === it.id;
                    });

                    if (found) { // User has game                        
                        //found.attr.common = _u.object(found.attr.common, it.attr.common);
                        found.attr.common = _u.map(found.attr.common, function (x, iter) {
                            return { 'id': x, 'status': it.attr.common[iter] };
                        });;
                        found.attr.e = it.attr.e;
                    }
                });
                res.send(r);
            });
        } else {
            res.send(r);
        }
    });
  });

  app.post('/api/newgame', function(request, response){
    db.save(request.body, function (err, res) {
          if(res.ok){
            response.send({'reply': 'ok'});    // echo the result back
          }
      });
  });

  http.createServer(app).listen(app.get('port'), function(){
    console.log("Express server listening on port " + app.get('port'));
  });