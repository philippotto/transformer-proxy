transformer-proxy [![build status](https://secure.travis-ci.org/philippotto/transformer-proxy.png)](http://travis-ci.org/philippotto/transformer-proxy)
=================

A middleware component for [node-http-proxy](https://github.com/nodejitsu/node-http-proxy) to transform the response from the proxied server.
It can be used to transform JavaScript, pictures or any other data.
If you're looking for an easy solution to modify HTML, have a look at [harmon](https://github.com/No9/harmon) which uses [trumpet](https://github.com/substack/node-trumpet) for modifying HTML.

## Installation

```bash
$ npm install transformer-proxy
```

## Basic example

A basic example can be found in ```examples/simple.js```. The quintessence is that you can tell your connect-app to use your own callback function to transform the data.

```javascript
var transformerFunction = function (data, req, res) {
  // do something with the data and return it
  return data + "\n // an additional line the end of every file";
};
app.use(transformerProxy(transformerFunction));
```

The example also includes additional code for setting up a basic server and the corresponding proxy.

Start it as follows:
```bash
$ cd node_modules/transformer-proxy/examples
$ node simple.js
```

When visiting [localhost:3000](http://localhost:3000) you should see:
```
A simple HTML file
```
When visiting [localhost:8013](http://localhost:8013) you should see:
```
A simple HTML file
// an additional line the end of every file
```

## Using promises

The transformation callback function may also return a [promise](https://www.npmjs.com/package/promise). This is really useful for cases when the data is being transformed asynchronously (e.g. gunzipped, processed and then gzipped back). A promise-based example can be found in ```examples/promise.js```:

```javascript
var transformerFunction = function (data, req, res) {
  return new Promise(function(resolve, reject) {
    http.get('http://google.com/', function(response) {
      resolve(data + '<br />Google.com request status code: ' + response.statusCode);
    }).on('error', function(error) {
      reject(error.message);
    });
  });
};
app.use(transformerProxy(transformerFunction));
```

## Transform only data with a certain URL

Just pass an options object as the second parameter to ```transformerProxy``` which has a `match` attribute.
For example, if you want to modify only JavaScript files, you could use:

```javascript
transformerProxy(transformerFunction, {match : /\.js([^\w]|$)/});
```

## Transform response headers

Just pass an options object as the second parameter to ```transformerProxy``` which has a `headers` attribute.
This attribute should be an array of objects having name and value attributes. Headers with null values will be removed.
For example, if you want to modify the content type header and remove the server header, you could use:

```javascript
var headers = [{
  'name' : 'content-type',
  'value' : 'application/json'
}, {
  'name' : 'server',
  'value' : null
}];

transformerProxy(transformerFunction, {headers : headers});
```

## License
MIT &copy; Philipp Otto
