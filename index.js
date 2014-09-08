var util = require("util");
var stream = require("stream");


var TransformerStream = function (transformerFunction) {
  this.readable = true;
  this.writable = true;
  this.transformerFunction = transformerFunction;
  this.chunks = [];
};

util.inherits(TransformerStream, stream);

TransformerStream.prototype.write = function (data) {
  this.chunks.push(data);
};

TransformerStream.prototype.end = function () {
  var data = this.transformerFunction(Buffer.concat(this.chunks));

  this.emit("data", data);
  this.emit("end");
};


module.exports = function transformerProxy(transformerFunction, options) {

  if (!options) {
    options = {};
  }

  var identity = function(data) { return data };

  return function transformerProxy(req, res, next) {

    var identityOrTransformer = transformerFunction;
    if (options.match && !options.match.test(req.url)) {
      identityOrTransformer = identity;
    }

    var transformerStream = new TransformerStream(identityOrTransformer);

    var resWrite = res.write.bind(res);
    var resEnd = res.end.bind(res);
    var resWriteHead = res.writeHead.bind(res);

    res.write = function (data, encoding) {
      transformerStream.write(data, encoding);
    };

    res.end = function (data, encoding) {
      transformerStream.end(data, encoding);
    };

    transformerStream.on('data', function (buf) {
      resWrite(buf);
    });

    transformerStream.on('end', function () {
      resEnd();
    });

    res.writeHead = function (code, headers) {
        res.removeHeader('Content-Length');
        if (headers) { delete headers['content-length']; }
        resWriteHead.apply(null, arguments);
    };

    next();
  }
}
