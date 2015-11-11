'use strict';

var test = require('tap').test;
var assert = require('assert');
var http = require('http');
var httpProxy = require('http-proxy');
var connect = require('connect');
var transformerProxy = require('../');
var Promise = require('promise');

var basicHTML = "<html><head></head><body>A simple HTML file</body></html>";
var proxiedPort = 3000;
var proxyPort = 8013;


test('Streams can change the response size', function (t) {
  t.plan(1);

  var additionalHTML = "\n // an additional line at the end of every file";

  var transformerFunction = function(data) {
    return data + additionalHTML;
  };


  var app = connect();
  var proxy = httpProxy.createProxyServer({target: 'http://localhost:' + proxiedPort});

  app.use(transformerProxy(transformerFunction));

  app.use(function(req, res) {
    proxy.web(req, res);
  });

  var proxyServer = http.createServer(app).listen(proxyPort);

  var proxiedServer = http.createServer(function (req, res) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.write(basicHTML);
    res.end();
  }).listen(proxiedPort);


  http.get('http://localhost:' + proxyPort, function (res) {
    var str = '';

    res.on('data', function (data) {
      console.log('data', data + '');
      str += data;
    });

    res.on('end', function () {
      t.equal(str, basicHTML + additionalHTML);
      proxyServer.close();
      proxiedServer.close();
      t.end();
    });
  });
});

test('Transform function may return a promise that is then rejected and it\'s properly handled', function (t) {
  var additionalHTML = "\n // an additional line at the end of every file";

  var transformerFunction = function(data) {
    return new Promise(function (resolve, reject) {
      resolve(data + additionalHTML);
    });
  };

  var app = connect();
  var proxy = httpProxy.createProxyServer({target: 'http://localhost:' + proxiedPort});

  t.plan(1);

  app.use(transformerProxy(transformerFunction));

  app.use(function(req, res) {
    proxy.web(req, res);
  });

  var proxyServer = http.createServer(app).listen(proxyPort);

  var proxiedServer = http.createServer(function (req, res) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.write(basicHTML);
    res.end();
  }).listen(proxiedPort);

  http.get('http://localhost:' + proxyPort, function (res) {
    var str = '';

    res.on('data', function (data) {
      console.log('data', data + '');
      str += data;
    });

    res.on('end', function () {
      t.equal(str, basicHTML + additionalHTML);
      proxyServer.close();
      proxiedServer.close();
      t.end();
    });
  });
});

test('Transform function may return a promise that is resolved and it\'s properly handled', function (t) {
  var additionalHTML = "\n // an additional line at the end of every file";

  var transformerFunction = function(data) {
    return new Promise(function (resolve, reject) {
      reject(data + additionalHTML);
    });
  };

  var app = connect();
  var proxy = httpProxy.createProxyServer({target: 'http://localhost:' + proxiedPort});

  t.plan(1);

  app.use(transformerProxy(transformerFunction));

  app.use(function(req, res) {
    proxy.web(req, res);
  });

  var proxyServer = http.createServer(app).listen(proxyPort);

  var proxiedServer = http.createServer(function (req, res) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.write(basicHTML);
    res.end();
  }).listen(proxiedPort);

  http.get('http://localhost:' + proxyPort, function (res) {
    var str = '';

    res.on('data', function (data) {
      console.log('data', data + '');
      str += data;
    });

    res.on('end', function () {
      t.equal(str, basicHTML + additionalHTML);
      proxyServer.close();
      proxiedServer.close();
      t.end();
    });
  });
});

test('Response headers can be modified', function (t) {
  var transformerFunction = function(data) {
    return data;
  };

  var app = connect();
  var proxy = httpProxy.createProxyServer({target: 'http://localhost:' + proxiedPort});

  var headers = [{
    'name' : 'content-type',
    'value' : 'text/plain'
  }, {
    'name' : 'server',
    'value' : null
  }, {
    'name' : 'fooheader',
    'value' : 'barHeader'
  }];

  t.plan(headers.length);

  app.use(transformerProxy(transformerFunction,{headers:headers}));

  app.use(function(req, res) {
    proxy.web(req, res);
  });

  var proxyServer = http.createServer(app).listen(proxyPort);

  var proxiedServer = http.createServer(function (req, res) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.write(basicHTML);
    res.end();
  }).listen(proxiedPort);


  http.get('http://localhost:' + proxyPort, function (res) {
    headers.forEach(function (header) {
      var expectedValue = header.value;
      if (expectedValue) {
        t.equal(res.headers[header.name], expectedValue);
      } else {
        t.equal(res.headers[header.name], undefined);
      }
    });

    res.on('data', function (data) {
      console.log('data', data + '');
    });

    res.on('end', function () {
      proxyServer.close();
      proxiedServer.close();
      t.end();
    });
  });
});
