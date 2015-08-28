/*
 * PeteJS
 *
 * Copyright (c) 2009 - 2015 Benjamin Toll (benjamintoll.com)
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 */

'use strict';

/**
 * @function Observer
 * @param {None}
 * @return {None}
 * @describe <p>Abstract class, useful for custom events. This reference type is composable, i.e., <blockquote><code>Pete.compose(Pete.Observer);</code></blockquote></p>
*/
//<source>
Pete.Observer = {
//</source>
    /**
     * @function Pete.Observer.subscriberEvents
     * @param {Array/String} v
     * @return {None}
     * @describe <p>Define the custom events that the type will expose. Pass either an array where the property of custom events or a comma-delimited list of strings in the constructor. If the object then subscribes to one of the exposed events, the function will be mapped to the event name in <code>this.events</code>.</p>
     * @example
var Person = function (name) {
  this.name = name;
  this.subscriberEvents("say", "walk");
};

--or--

var Person = function (name) {
  this.name = name;
  this.subscriberEvents(["say", "walk"]);
};
     */
    //<source>
    subscriberEvents: function (v) {
        var me = this,
            i, args;

        if (!me.events) {
            me.events = {};
        }

        if (typeof v === 'string') {
            for (i = 0, args = arguments; args[i]; i++) {
                if (!this.events[args[i]]) {
                    this.events[args[i]] = [];
                }
            }
        } else if (Pete.isArray(v)) {
            v.forEach(function (a) {
                me.events[a] = [];
            });
        }
    },
    //</source>

    /**
     * @function Pete.Observer.fire
     * @param {String} type
     * @param {Object} options Optional
     * @return {Boolean}
     * @describe <p>Publishes a custom event. The first argument passed to the observer is an object with the following defined properties:</p>
<ul>
  <li><code>target</code> A reference to observed object.</li>
  <li><code>type</code> The name of the event.</li>
</ul>
<p>The second argument is an optional <code>options</code> object that contains other data to pass to the subscribing event listener(s).</p>
<p>Note that custom events bubble, so returning <code>false</code> in the callback will prevent this behavior.</p>
     */
    //<source>
    fire: function (type, options) {
        var me = this,
            events = me.events,
            bubble = true,
            oCustomEvent;

        if (!events) {
            return false;
        }

        if (events[type]) {
            oCustomEvent = {
                target: me,
                type: type
            };

            if (options && !Pete.isEmpty(options)) {
                Pete.mixin(oCustomEvent, options);
            }

            events[type].forEach(function (fn) {
                // Will return false if bubbling is canceled.
                // NOTE a callback returning undefined will not prevent the event from bubbling.
                bubble = fn.call(me, oCustomEvent);
            });
        } else {
            bubble = false;
        }

        return bubble;
    },
    //</source>

    /**
     * @function Pete.Observer.isObserved
     * @param {String} type
     * @return {Boolean}
     * @describe <p>Returns <code>true</code> if the event has one or more subscribers (<code>false</code> otherwise). Note it doesn't query for a specific handler.</p>
     */
    //<source>
    isObserved: function (type) {
        return !!this.events[type];
    },
    //</source>

    /**
     * @function Pete.Observer.purgeSubscribers
     * @param {None}
     * @return {None}
     * @describe <p>Removes all of an object's event handlers.</p>
     */
    //<source>
    purgeSubscribers: function () {
        this.events = {};
    },
    //</source>

    /**
     * @function Pete.Observer.subscribe
     * @param {String} type Event to listen for
     * @param {Function} fn Callback
     * @return {None}
     * @describe <p>Listen to a pre-defined event by passing the name of the event to and the callback to be invoked when that event occurs.</p>
     */
    //<source>
    subscribe: function (type, fn) {
        var events = this.events;

        if (!events || !events[type]) {
            // If there are no events then we know that the subscriberEvents api wasn't used, so exit.
            // Also, caan't subscribe to an event that wasn't established within the constructor!
            return;
        }

        if (events[type]) {
            events[type].push(fn);
        } else {
            events[type] = fn;
        }
    }.assert(String, Function),
    //</source>

    /**
     * @function Pete.Observer.unsubscribe
     * @param {String} type
     * @param {Function} fn
     * @return {None}
     * @describe <p>Remove the event listener that was previously subscribed.</p>
     */
    //<source>
    unsubscribe: function (type, fn) {
        var events = this.events;

        if (events && events[type]) {
            events[type].remove(fn);
        }
    }.assert(String, Function)
    //</source>
};

