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

A basic example can be found in ```examples/simple.js```. The quintessence is that you can tell your connect-app to use an own function for transforming all data.

```javascript
var transformerFunction = function (data) {
  // do something with the data and return it
  return data + "\n // an additional line the end of every file";
}
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
When visiting [localhost:8013](http://localhost:8013) you should see "A simple HTML file".
```
A simple HTML file
// an additional line the end of every file
```

## Transform only data with a certain URL

Just pass an options object as the second parameter to ```transformerProxy``` which has a match attribute.
For example, if you want to modify only JavaScript files, you could use:

```javascript
transformerProxy(transformerFunction, {match : /\.js([^\w]|$)/})
```
