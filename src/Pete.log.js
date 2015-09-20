(function () {
    'use strict';

    /*
     * PeteJS
     *
     * Copyright (c) 2009 - 2015 Benjamin Toll (benjamintoll.com)
     * Dual licensed under the MIT (MIT-LICENSE.txt)
     * and GPL (GPL-LICENSE.txt) licenses.
     *
     */

    // This is designed to behave like FF's console.log().

    /**
     * @function log
     * @param {Mixed}
     * @return {Mixed}
     * @mixin {<a href="#jsdoc">Pete.Observer</a>}
     * @describe
    <p>This is a Singleton.</p>
     * @example
    //seed the logger;

    Pete.log.enable({
      Pete_systemLog: function (e) {
        Pete.getDom('log').innerHTML += '<br />' + e.log;
      },

      debug: function (e) {
        Pete.getDom('debug').innerHTML += '<br />' + e.log;
      },

      error: function (e) {
        Pete.getDom('error').innerHTML += '<br />' + e.log;
      }
    });

    //now we can use the log types we've seeded, plus add or disable any others;

    Pete.log.debug([1, 2, 3], 'bob', Pete.log);
    Pete.log.debug('An example of type coercion is ', 10 == '10', Pete.log instanceof Object);

    Pete.log.enable('phillies', Pete.emptyFn) {});

    Pete.log.disable('debug');

    Pete.log.debug('debug');

    Pete.log.error('error!');
     */
    //<source>
    Pete.log = Pete.compose(Pete.Observer, (function () {
        // Mixin our singleton object with private stuff.
        var methods = {},
            systemLog = [],
            logTypes = [],
            method,

            logEvent = function (sLog) {
                systemLog.push(sLog);

                Pete.log.fire('Pete_systemLog', {
                    log: sLog,
                    archive: systemLog
                });
            },

            getValueFromType = function (types) {
                var i = 0,
                    len = types.length,
                    arr = [],
                    type;

                for (; i < len; i++) {
                    type = types[i];
                    switch (true) {
                        case typeof type === 'string':
                        case typeof type === 'number':
                        case typeof type === 'boolean':
                        case type instanceof Object:
                            arr.push(type);
                            break;
                        case type instanceof Array:
                            arr.push(type.toString());
                            break;
                        case typeof type === 'function':
                            arr.push(type());
                            break;
                    }
                }

                return arr.join(' ');
            },

            log = function (args, state) {
                // Reset this array every time log is called.
                logTypes.length = 0;

                switch (true) {
                    // Args looks like (["debug", fn]).
                    case args[0] instanceof Array:
                        args = args[0];
                        break;
                    // Args looks like ('debug'), comes from when an object of log types is passed to enable().
                    case typeof args === 'string':
                        args = [args];
                        break;
                    // Args looks like ('debug', fn).
                    default:
                        args = [args[0]];
                }

                for (var i = 0, len = args.length; i < len; i++) {
                    method = args[i];
                    methods[method] = state;
                    logTypes.push(method);

                    Pete.log[method] = (function (method) {
                        return function () {
                            // The state var is the crux; simply manage your object hash to determine how the method is called.
                            if (!methods[method]) {
                                logEvent('The ' + method + ' log type has been disabled.');
                            } else {
                                this.fire(method, {
                                    log: getValueFromType(Pete.makeArray(arguments))
                                });
                            }
                        };
                    // Each method var must be scoped as a local var in the closure so pass it in as a function argument.
                    }(method));
                }

                logEvent('The following log types have been ' + (state ? 'enabled' : 'disabled') + ': ' + logTypes.toString() + '.');
            };

        return {
            disable: function () {
                // Simply turn the state off.
                log(arguments, false);
            },
            enable: function (v) {
                var me = this,
                    args = arguments,
                    field;

                // Remember to expect either an object or string.
                if (v.constructor === Object) {
                    for (field in v) {
                        if (v.hasOwnProperty(field) && field !== 'logfile') {
                            // Without registering the event it can't be subscribed to.
                            me.subscriberEvents(field);
                            me.subscribe(field, v[field]);
                            // The second argument tells the private log function how to behave.
                            log(field, true);
                        }
                    }
                } else {
                    me.subscriberEvents(v);

                    // Not passing a second argument (a function) allows us to enable a log and then subscribe to it later.
                    if (!args[1]) {
                        return;
                    }

                    me.subscribe(v, args[1]);
                    log(args, true);
                }
            },
            flush: function () {
                // Flush temporarily so the logs don't take up too much memory.
                systemLog.length = 0;
            }
        };
    }()));
    //</source>

    Pete.log.enable('Pete_systemLog');
}());

