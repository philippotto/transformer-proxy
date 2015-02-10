var http = require('http'),
    connect = require('connect'),
    httpProxy = require('http-proxy'),
    transformerProxy = require('../');

//
// The transforming function
//

var transformerFunction = function(data, req, callback) {
  callback(data + "\n // an additional line at the end of every file");
}


//
// A proxy as a basic connect app
//

var proxiedPort = 3000;
var proxyPort = 8013;

var app = connect();
var proxy = httpProxy.createProxyServer({target: 'http://localhost:' + proxiedPort});

app.use(transformerProxy(transformerFunction));

app.use(function(req, res) {
  proxy.web(req, res);
});

http.createServer(app).listen(proxyPort);


//
// A simple server which will be proxied
//

http.createServer(function (req, res) {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.write('<html><head></head><body>A simple HTML file</body></html>');
  res.end();
}).listen(proxiedPort);



console.log("The proxied server listens on",  proxiedPort);
console.log("The proxy server listens on",  proxyPort);
