var http = require('http'),
    express = require('express');

var port = process.env.port || 8101;

var app = express();
var server = http.createServer(app);

app.configure(function(){
  app.use(express.static(__dirname + '/public'));
});

server.listen(port);

//require('./public/Scripts/application.js').Application();