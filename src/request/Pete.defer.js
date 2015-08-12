/**
 * The AjaxDefer class is a singleton that allows pending Ajax requests to be managed.
 *
 * For example, it allows a developer to control when callbacks are invoked for a group of pending requests.
 * Imagine a scenario where a local operation shouldn't occur until all related requests have been returned.
 * Ajax doesn't allow for this to be controlled or managed out of the box, and there is no guaranteed order to
 * the requests that are returned. However, the developer may want this operation to occur only when the last
 * pending request has returned. AjaxDefer allows for this.
 *
 * Requests can be grouped by name. The group name is optional, in which case the name will default to the value
 * of {@link defaultGroup}. There is no limit to the number of groups that can be created, and the singleton can
 * be configured so that the grouped request callbacks can fire when each request comes in as usual or batched
 * until the last one in the group is returned. Further, the {@link wrap} method allows for one or more callbacks
 * to be fired after the last grouped request has returned. These callbacks can belong to a group by specifying a
 * group name as a function argument, or it will be called after all the groups have returned if no name is given.
 *
 * The {@link ajaxWrap} property allows for more customization. By default, the Connection callbacks will be called
 * as each request returns from the server. {@link ajaxWrap} will defer these callbacks until after all of the
 * group's requests have returned. This can be used together with one or more callbacks that are setup using the
 * {@link wrap} method. Used both internally by the class and as an API, it will mean that any function passed to
 * it will be called when the group it belongs to has completely returned (or after all groups have returned if
 * no name is given).
 *
 */

"use strict";

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

    data: {},

    doCallbacks: function (request) {
        var me = this,
            callbacks, callback;

        // Note that request will refer to the last returned request.
        //if (me.fire('completed', me, request) !== false) {
            callbacks = me.callbacks;
            while (callbacks.length) {
                callback = callbacks.shift();
                //if (me.fire('beforecallback', callback, me, request) !== false) {
                    callback.call(me, me.data);
                //}
            }
        //} else {
            //me.clear();
        //}

        // Reset the 'global' data object.
        me.data = {};
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
    onComplete: function (response, request, success, xhr) {
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
                request.success(me.data, response, request, success, xhr);
            }
        } else {
            if (response.isException || request.aborted || request.timedout) {
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

