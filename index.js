'use strict';

var util = require('util');
var stream = require('stream');
var Promise = require('promise');


var TransformerStream = function (transformerFunction, req, res) {
  this.transformerFunction = transformerFunction;
  this.req = req;
  this.res = res;
  this.readable = true;
  this.writable = true;
  this.chunks = [];

  this.on('close', function(){
    this.closedSkipEnd = true
  })
};

util.inherits(TransformerStream, stream);

TransformerStream.prototype.write = function (data) {
  this.chunks.push(Buffer.isBuffer(data) ? data : Buffer.from(data));
};

TransformerStream.prototype.end = function (data) {
  if (this.closedSkipEnd) {
    // Do not end and transform the chunks because there was an error reading all of the chunks.
    // The transform stream was closed because of the request being closed(terminated early).
    return
  }
  if (data) {
    this.chunks.push(Buffer.isBuffer(data) ? data : Buffer.from(data));
  }
  
  var self = this;
  var emit = function(data) {
    self.emit('data', data);
    self.emit('end');
  };
  var data = this.transformerFunction(Buffer.concat(this.chunks), this.req, this.res);

  if (data.constructor.name === 'Promise') {
    data.then(emit, emit);
  } else {
    emit(data);
  }
};


module.exports = function transformerProxy(transformerFunction, options) {
  var identity = function (data) {
    return data;
  };

  if (!options) {
    options = {};
  }

  return function transformerProxy(req, res, next) {
    var identityOrTransformer = (options.match && !options.match.test(req.url)) ? identity : transformerFunction;
    var transformerStream = new TransformerStream(identityOrTransformer, req, res);

    var resWrite = res.write.bind(res);
    var resEnd = res.end.bind(res);
    var resWriteHead = res.writeHead.bind(res);

    res.write = function (data, encoding) {
      transformerStream.write(data, encoding);
    };

    res.end = function (data, encoding) {
      transformerStream.end(data, encoding);
    };

    res.on('close', function () {
      transformerStream.emit('close');
    });

    transformerStream.on('data', function (buf) {
      resWrite(buf);
    });

    transformerStream.on('end', function () {
      resEnd();
    });

    res.writeHead = function (code, headers) {
      res.removeHeader('Content-Length');

      if (options.headers) {
        options.headers.forEach(function (header) {
          if (header.value) {
            res.setHeader(header.name, header.value);
          } else {
            res.removeHeader(header.name);
          }
        });
      }

      if (headers) {
        delete headers['content-length'];
      }

      resWriteHead.apply(null, arguments);
    };

    next();
  }
};
