var http = require('http'),
    express = require('express'),
    path = require('path');

var port = process.env.port || 8101;

var app = express();
//var server = http.createServer(app);

app.configure(function(){
  app.set('port', process.env.port || 8101);
  app.set('views', __dirname + '/views');
  app.use(express.logger('dev'));
  app.use(app.router);
  app.use(express.static(path.join(__dirname, '/public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

app.get('/api', function(req, res) {
   res.header("Access-Control-Allow-Origin", "http://localhost");
   res.header("Access-Control-Allow-Methods", "GET, POST");
});

//server.listen(port);

//require('./public/Scripts/application.js').Application();