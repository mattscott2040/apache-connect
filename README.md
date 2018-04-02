# apache-connect

  Apache Connect is an extensible HTTP server framework for [apache-bridge](https://github.com/mattscott2040/apache-bridge) using "plugins" known as _configureware_. 
  
  Based on [Connect](https://github.com/senchalabs/connect) by Sencha Labs.

```js
var connect = require('apache-connect');
var apache = require('apache-bridge');

var app = connect();

// configureware examples coming soon

//create Apache server and listen on port
apache.createServer(app).listen(3000);
```

## Getting Started

Apache Connect is a simple framework to glue together various "configureware" to handle Apache configuration options.

### Create an app

The main component is an Apache Connect "app". This will store all the configureware
added and is, itself, a function.

```js
var app = connect();
```

### Use configureware

The core of Apache Connect is "using" configureware. Configureware are added as a "stack"
where incoming configurations will execute each configureware one-by-one until a configureware
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

## Configureware

Coming soon

## API

The Apache Connect API is very minimalist, enough to create an app and add a chain
of configureware.

When the `apache-connect` module is required, a function is returned that will construct
a new app when called.

```js
// require module
var connect = require('apache-connect')

// create app
var app = connect()
```

### app(conf[, next])

The `app` itself is a function. This is just an alias to `app.handle`.

### app.handle(conf[, out])

Calling the function will run the configureware stack against the given 
`apache-bridge` configuration (`conf`) object. An optional function `out`
can be provided that will be called if the request (or error) was not handled
by the configureware stack.

### app.listen([...])

Start the app listening for requests. This method will internally create an
`apache-bridge` server and call `.listen()` on it.

This is an alias to the `apache.listen()` method, so consult the [apache-bridge](https://github.com/mattscott2040/apache-bridge#serverlistenport-hostname-callback) documentation for more details.

### app.use(fn)

Use a function on the app, where the function represents a configureware. The function
will be invoked for every configure event in the order that `app.use` is called. The function
is called with two arguments:

```js
app.use(function (conf, next) {
  // conf is the apache-bridge configuration object
  // next is a function to call to invoke the next configureware
})
```

In addition to a plain function, the `fn` argument can also be an `apache-bridge` server
instance or another Apache Connect app instance.

### app.use(route, fn)

Use a function on the app, where the function represents a configureware. The function
will be invoked for every request in which the URL starts with the given `route` string. 
The function is called with two arguments:

```js
app.use('/foo', function (conf, next) {
  // conf is the apache-bridge configuration object
  // next is a function to call to invoke the next configureware
})
```

In addition to a plain function, the `fn` argument can also be a `apache-bridge` server
instance or another Apache Connect app instance.

The `route` is applied using Apache's [Location](https://httpd.apache.org/docs/2.4/mod/core.html#location) directive, which behaves somewhat differently than the original [Connect](https://github.com/senchalabs/connect) module. The example above outputs the following directive:

```bash
<Location "/foo">
# ...
</Location>
```

See [Apache documentation](https://httpd.apache.org/docs/2.4/mod/core.html#location) for more details about the `Location` directive.

## License

[MIT](LICENSE)
