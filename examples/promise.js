'use strict';

var http = require('http'),
  connect = require('connect'),
  httpProxy = require('http-proxy'),
  transformerProxy = require('../'),
  Promise = require('promise');

//
// The transforming function.
//

var transformerFunction = function (data, req, res) {
  return new Promise(function(resolve, reject) {
    http.get('http://google.com/', function(response) {
      resolve(data + '<br />Google.com request status code: ' + response.statusCode);
    }).on('error', function(error) {
      reject(error.message);
    });
  });
};


//
// A proxy as a basic connect app.
//

var proxiedPort = 3000;
var proxyPort = 8013;

var app = connect();
var proxy = httpProxy.createProxyServer({target: 'http://localhost:' + proxiedPort});

app.use(transformerProxy(transformerFunction));

app.use(function (req, res) {
  proxy.web(req, res);
});

http.createServer(app).listen(proxyPort);


//
// A simple server which will be proxied.
//

http.createServer(function (req, res) {
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.write('<html><head></head><body>A simple HTML file</body></html>');
  res.end();
}).listen(proxiedPort);


console.log('The proxied server listens on', proxiedPort);
console.log('The proxy server listens on', proxyPort);
