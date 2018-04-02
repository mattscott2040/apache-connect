/*!
 * apache-connect
 * MIT Liscensed
 */

/*
 * Based on connect
 * Copyright(c) 2010 Sencha Inc.
 * Copyright(c) 2011 TJ Holowaychuk
 * Copyright(c) 2015 Douglas Christopher Wilson
 */

'use strict';

/**
 * Module dependencies.
 * @private
 */

var debug = require('debug')('apache-connect:dispatcher');
var EventEmitter = require('events').EventEmitter;
var apache = require('apache-bridge');
var merge = require('utils-merge');

/**
 * Module exports.
 * @public
 */

module.exports = createServer;

/**
 * Module variables.
 * @private
 */

var env = process.env.NODE_ENV || 'development';
var proto = {};

/* istanbul ignore next */
var defer = typeof setImmediate === 'function'
  ? setImmediate
  : function(fn){ process.nextTick(fn.bind.apply(fn, arguments)) }

/**
 * Create a new apache-connect server.
 *
 * @return {function}
 * @public
 */

function createServer() {
  function app(conf, next){ app.handle(conf, next); }
  merge(app, proto);
  merge(app, EventEmitter.prototype);
  app.route = '/';
  app.stack = [];
  return app;
}

/**
 * Utilize the given configureware `handle` to the given `route`,
 * defaulting to _/_. This "route" is the mount-point for the
 * configureware, when given a value other than _/_ the configureware
 * is only effective when that segment is present in the request's
 * pathname.
 *
 * For example if we were to mount a function at _/admin_, it would
 * be invoked on _/admin_, and _/admin/settings_, however it would
 * not be invoked for _/_, or _/posts_.
 *
 * @param {String|Function|Server} route, callback or server
 * @param {Function|Server} callback or server
 * @return {Server} for chaining
 * @public
 */

proto.use = function use(route, fn) {
  var handle = fn;
  var path = route;

  // default route to '/'
  if (typeof route !== 'string') {
    handle = route;
    path = '/';
  }

  // wrap sub-apps
  if (typeof handle.handle === 'function') {
    var server = handle;
    server.route = path;
    handle = function (conf, next) {
      server.handle(conf, next);
    };
  }

  // wrap vanilla apache.Servers
  if (handle instanceof apache.Server) {
    handle = handle.listeners('configure')[0];
  }

  // wrap vanilla apache.Confs
  if (handle instanceof apache.Conf) {
    let c = handle;
    handle = (conf, next) => {
      if(typeof conf.file === 'undefined' || conf.file === null) {
        conf.file = c.file;
        c.file = null;
      }
      let args = c.getArguments();
      let arrayLength = args.length;
      for (var i = 0; i < arrayLength; i++) {
        if(args[i].startsWith('-')) {
          if(args[i+1].startsWith('-')) {
            conf.addArgument(args[i], args[i+1]);
          } else {
            conf.addArgument(args[i]);
          }
        }
      }
    }
  }

  // strip trailing slash
  if (path[path.length - 1] === '/') {
    path = path.slice(0, -1);
  }

  // add the configureware
  debug('use %s %s', path || '/', handle.name || 'anonymous');
  this.stack.push({ route: path, handle: handle });

  return this;
};

/**
 * Handle server requests, punting them down
 * the configureware stack.
 *
 * @private
 */

proto.handle = function handle(conf, out) {
  var index = 0;
  var stack = this.stack;
  var endif = false;

  // final function handler
  var done = out || conf.end;

  var n;

  function next() {
    // next callback
    var layer = stack[index++];

    // all done
    if (!layer) {
      defer(done);
      return;
    }

    // route data
    var route = layer.route;

    // skip this layer if the route doesn't match
    if (route.length !== 0 && route !== '/') {

      // wrap -c and -C directives with <Location ...>
      conf.prependDirective('<Location "' + route.toString() + '">')
        .addDirective('<Location "' + route.toString() + '">');

      // store original define method
      let define = conf.define;

      // use -C instead of -D to define parameters
      conf.define = function(parameter) {
        if(parameter) {
            conf.prependDirective('Define ' + parameter)
        }
      }

      // Close Location directives and restore define method
      (function(fn) {
        stack.splice(index+1, 0, { route: '', handle: fn });
      }(function(conf, next) {
        conf.prependDirective('</Location>')
          .addDirective('</Location>');
        conf.define = define;
        next();
      }));

    }

    // call the layer handle
    call(layer.handle, route, conf, next);
  }

  next();
};

/**
 * Listen for connections.
 *
 * This method takes the same arguments
 * as apache-bridge's `apache.Server#listen()`.
 *
 * HTTP and HTTPS:
 *
 * If you run your application both as HTTP
 * and HTTPS you may wrap them individually,
 * since your Connect "server" is really just
 * a JavaScript `Function`.
 *
 *      var connect = require('apache-connect')
 *        , apache = require('apache-bridge');
 *
 *      var app = connect();
 *
 *      apache.createServer(app).listen(80);
 *      apache.createServer(app).listen(443);
 *
 * @return {apache.Server}
 * @api public
 */

proto.listen = function listen() {
  var server = apache.createServer(this);
  return server.listen.apply(server, arguments);
};

/**
 * Invoke a route handle.
 * @private
 */

function call(handle, route, conf, next) {
  debug('%s %s : %s', handle.name || '<anonymous>', route);
  handle(conf, next);
  return;
}
