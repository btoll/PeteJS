Pete.defer = Pete.compose(Pete.ajax, {
    /**
     * @event beforecallback
     * Fires before each callback in the stack.
     * @param {Ext.data.Connection} conn This Connection object.
     * @param {Function} callback The callback.
     * @param {Object} options The options config object passed to the {@link #request} method.
     */

    /**
     * @event completed
     * Fires when the last managed request has returned but before any callback is invoked.
     * @param {Ext.data.Connection} conn This Connection object.
     * @param {Object} request This last request that completed.
     * @param {Object} options The options config object passed to the {@link #request} method.
     */

    /**
     * @cfg {Boolean} [autoWrap=true]
     * Automatically wraps all callbacks.
     * Set to `false` if manually wrapping a callback.
     */
    autoWrap: true,

    callbacks: [],

    doCallbacks: function (request) {
        var me = this;

        // Note that request will refer to the last returned request.
        //if (me.fire('completed', me, request) !== false) {
            callbacks = me.callbacks;
            while (callbacks.length) {
                callback = callbacks.shift();
                //if (me.fire('beforecallback', callback, me, request) !== false) {
                    callback();
                //}
            }
        //} else {
            //me.clear();
        //}
    },

    /*
    events: {
        beforecallback: true,
        completed: true
    },
    */

    hasPendingRequests: function () {
        var requests = this.getRequests(),
            prop;

        for (prop in requests) {
            if (requests.hasOwnProperty(prop)) {
                return true;
            }
        }

        return false;
    },

    /**
     * To be called when the request has come back from the server.
     * It will wrap all of the callbacks for deferred execution.
     * @private
     * @param {Object} request
     * @return {Object} The response
     */
    onComplete: function (result, request, success, xhr) {
        var me = this,
            i = 0,
            result, success, response,
            len, callbacks, callback;

        /*
        try {
            result = me.parseStatus(request.xhr.status);
        } catch (e) {
            // in some browsers we can't access the status if the readyState is not 4, so the request has failed
            result = {
                success : false,
                isException : false
            };
        }
        success = result.success;
        */

        if (success) {
            //response = me.createResponse(request);

            if (me.autoWrap) {
                me.wrap(function () {
                    //me.fire('requestcomplete', me, response, options);
                    //Ext.callback(options.success, options.scope, [response, options]);
                });
            } else {
                //me.fire('requestcomplete', me, response, options);
                //Ext.callback(options.success, options.scope, [response, options]);
                request.success(result);
            }
        } else {
            if (result.isException || request.aborted || request.timedout) {
                response = me.createException(request);
            } else {
                response = me.createResponse(request);
            }
            if (me.autoWrap) {
                me.wrap(function () {
                    //me.fire('requestexception', me, response, options);
                    //Ext.callback(options.failure, options.scope, [response, options]);
                });
            } else {
                //me.fire('requestexception', me, response, options);
                //Ext.callback(options.failure, options.scope, [response, options]);
            }
        }

        delete me.getRequests()[request.id];

        if (!me.hasPendingRequests()) {
            //me.doCallbacks(request);
            me.doCallbacks(request);
        }

        return response;
    },

    clear: function () {
        this.callbacks.length = 0;
    },

    wrap: function (fn) {
        this.callbacks.push(fn);
    }
});

