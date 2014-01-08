var http = require('http'),
    express = require('express'),
    path = require('path');

var port = process.env.port || 8101;
var app = express();

app.configure(function(){
  app.set('port', port);
  app.set('views', __dirname + '/views');
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.static(path.join(__dirname, '/public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/api', function(req, res) {
   res.header("Access-Control-Allow-Origin", "http://localhost");
   res.header("Access-Control-Allow-Methods", "GET, POST");
});

var config = require('./config')
  , cradle = require('cradle')
  , connection = new(cradle.Connection)(config.couchdb.url, config.couchdb.port, {cache: true}),
  db = connection.database("sndb");

  app.get('/api/:consoleId/:gameId', function(req, res){
    db.view('games/all', { key: req.params.gameId }, function(err, response){
        res.send(response);
    });
  });

  app.get('/api/:consoleId', function(req, res) {
    db.view('games/by_console', { key: req.params.consoleId }, function(err, response){
        res.send(response);
    });
  });

  app.post('/api/newgame', function(request, response){
    console.log(request.body);      // your JSON
    db.save(request.body, function (err, res) {
          if(res.ok){
            response.send({'reply': 'ok'});    // echo the result back
          }
      });
  });

  http.createServer(app).listen(app.get('port'), function(){
    console.log("Express server listening on port " + app.get('port'));
  });