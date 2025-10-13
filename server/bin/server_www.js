#!/usr/bin/env node

var app = require('../app.js');
var debug = require('debug')('server:server');
var http = require('http');
//var dotenv = require('dotenv')
//dotenv.config()

var port = 5432//process.env.PORT

var server = http.createServer(app);
server.listen(port);

function onListening() {
  console.log('Listening on http://localhost:' + port);
}
