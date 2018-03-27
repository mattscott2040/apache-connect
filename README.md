# apache-connect

  Apache Connect is an extensible HTTP server framework for [apache-bridge](http://github.com/mattscott2040/apache-bridge) using "plugins" known as _middleware_.
  
  Based on [Connect](https://github.com/senchalabs/connect) by Sencha Labs.

```js
var connect = require('apache-connect');
var apache = require('apache-bridge');

var app = connect();

// examples coming soon

//create Apache server and listen on port
apache.createServer(app).listen(3000);
```

## Getting Started

Apache Connect is a simple framework to glue together various "configureware" to handle Apache configuration options.

### Install Apache Connect

```sh
$ npm install apache-connect
```

### Create an app

The main component is an Apache Connect "app". This will store all the configureware
added and is, itself, a function.

```js
var app = connect();
```

### Use configureware

The core of Apache Connect is "using" middleware. Middleware are added as a "stack"
where incoming requests will execute each middleware one-by-one until a middleware
does not call `next()` within it.

```js
app.use(function configureware1(conf, next) {
  // configureware 1
  next();
});
app.use(function configureware2(conf, next) {
  // configureware 2
  next();
});
```

### Mount configureware

The `.use()` method also takes an optional path string that is matched against
the beginning of the incoming request URL. This allows for basic routing.

```js
app.use('/foo', function fooConfigureware(conf, next) {
  // ${REQUEST_URI} starts with "/foo"
  next();
});
app.use('/bar', function barConfigureware(conf, next) {
  // ${REQUEST_URI} starts with "/bar"
  next();
});
```

### Create a server from the app

The last step is to actually use the Apache Connect app in a server. The `.listen()` method
is a convenience to start a HTTP server (and is identical to the `apache.Server`'s `listen`
method in [apache-bridge](https://github.com/mattscott2040/apache-bridge)).

```js
var server = app.listen(port);
```

The app itself is really just a function with two arguments, so it can also be handed
to `.createServer()` in `apache-bridge`.

```js
var server = apache.createServer(app);
```


## API

The Apache Connect API is very minimalist, enough to create an app and add a chain
of middleware.

When the `apache-connect` module is required, a function is returned that will construct
a new app when called.

```js
// require module
var connect = require('apache-connect')

// create app
var app = connect()
```

### app(req, res[, next])

The `app` itself is a function. This is just an alias to `app.handle`.

### app.handle(req, res[, out])

Calling the function will run the middleware stack against the given 
`apache-bridge` configuration (`conf`) object. An optional function `out`
can be provided that will be called if the request (or error) was not handled
by the middleware stack.

### app.listen([...])

Start the app listening for requests. This method will internally create an
`apache-bridge` server and call `.listen()` on it.

This is an alias to the `apache.listen()` method, so consult the [apache-bridge](https://github.com/mattscott2040/apache-bridge#serverlistenport-hostname-callback) documentation for more details.

### app.use(fn)

Use a function on the app, where the function represents a middleware. The function
will be invoked for every request in the order that `app.use` is called. The function
is called with three arguments:

```js
app.use(function (req, res, next) {
  // req is the Node.js http request object
  // res is the Node.js http response object
  // next is a function to call to invoke the next middleware
})
```

In addition to a plan function, the `fn` argument can also be an `apache-bridge` server
instance or another Apache Connect app instance.

### app.use(route, fn)

Use a function on the app, where the function represents a middleware. The function
will be invoked for every request in which the URL (`req.url` property) starts with
the given `route` string in the order that `app.use` is called. The function is
called with three arguments:

```js
app.use('/foo', function (req, res, next) {
  // req is the Node.js http request object
  // res is the Node.js http response object
  // next is a function to call to invoke the next middleware
})
```

In addition to a plan function, the `fn` argument can also be a `apache-bridge` server
instance or another Apache Connect app instance.

The `route` is always terminated at a path separator (`/`) or a dot (`.`) character.
This means the given routes `/foo/` and `/foo` are the same and both will match requests
with the URLs `/foo`, `/foo/`, `/foo/bar`, and `/foo.bar`, but not match a request with
the URL `/foobar`.

The `route` is matched in a case-insensitive manor.

In order to make middleware easier to write to be agnostic of the `route`, when the
`fn` is invoked, the `req.url` will be altered to remove the `route` part (and the
original will be available as `req.originalUrl`). For example, if `fn` is used at the
route `/foo`, the request for `/foo/bar` will invoke `fn` with `req.url === '/bar'`
and `req.originalUrl === '/foo/bar'`.

## License

[MIT](LICENSE)
