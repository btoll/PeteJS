/*
 * PeteJs
 *
 * Copyright (c) 2009 - 2015 Benjamin Toll (benjamintoll.com)
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 */
"use strict";

var Pete;

if (!Pete) {
    Pete = {};
}

/**
 * @function Pete.mixin
 * @param {Object} child
 * @param {Object} parent
 * @return {Object}
 * @describe <p>Mixes in all properties of <code>parent</code> to <code>child</code>. Doesn't check for pre-existing properties.</p>
 */
//<source>
Pete.mixin = function (child, parent) {
    var i;

    for (i in parent) {
        if (parent.hasOwnProperty(i)) {
            child[i] = parent[i];
        }
    }

    return child;
};
//</source>

Pete.mixin(Pete, {
    /**
     * @function Pete.mixinIf
     * @param {Object} child
     * @param {Object} parent
     * @return {Object}
     * @describe <p>Copies all properties of <code>parent</code> to <code>child</code> that don't exist in <code>child</code>.</p>
     */
    //<source>
    mixinIf: function (child, parent) {
        for (var i in parent) {
            if (parent.hasOwnProperty(i)) {
                if (!child[i]) {
                    child[i] = parent[i];
                }
            }
        }

        return child;
    },
    //</source>

    /**
     * @function Pete.compose
     * @param {Function} subClass
     * @param {Mixed} superClass Pass either a constructor or an object
     * @param {Object} overrides optional Any object properties will be added to the subclass' prototype
     * @return {Function} subClass
     * @describe
    Pete.compose(Person, Pete.Observer); //prototype chaining;

    -- or --

    Car = Pete.compose(Pete.Observer, {
      init: function () {
        //code here...;
      }
    });
     */
    //<source>
    compose: function (proto) {
        var args = Pete.makeArray(arguments, 1),
            obj, i, len;

        if (Object.create) {
            obj = Object.create(proto);
        } else {
            obj = Pete.extend(proto);
        }

        if (args.length) {
            for (i = 0, len = args.length; i < len; i++) {
                Pete.mixin(obj, args[i]);
            }
        }

        // Do any post-processing on the newly-minted object.
        if (proto.$compose) {
            proto.$compose.apply(obj, args);
        }

        return obj;
    },
    //</source>

    /**
     * @function Pete.copy
     * @param {Object} varargs
     * @return {Object}
     * @describe <p>Copies all properties of all passed objects to a new object and returns it. It doesn't modify any object passed to it in the method signature.</p><p>Note this method performs a shallow copy.</p>
     */
    //<source>
    copy: function () {
        var o = {};

        this.makeArray(arguments).forEach(function (obj) {
            var n;

            for (n in obj) {
                if (obj.hasOwnProperty(n)) {
                    o[n] = obj[n];
                }
            }
        });

        return o;
    },
    //</source>

    /**
     * @function Pete.counter
     * @param {None}
     * @return {Number}
     * @describe <p>The closure provides for a secure and reliable counter.</p>
     * @example
     return Pete.globalSymbol + Pete.counter();
     */
    //<source>
    counter: (function () {
        var n = 0;

        return function () {
            return n++;
        };
    }()),
    //</source>

    /**
     * @function Pete.deepCopy
     * @param {oOrig}
     * @return {Object}
     * @describe <p>Makes a deep copy of the object that's passed as its sole argument and returns the copied object. Every copied object and array property of the original object will be separate and distinct from the original object. In other words, after the deep copy occurs, any new expando property added to either object won't be replicated to the other.</p>
     */
    //<source>
    deepCopy: function (orig) {
        var o, i, v, len, prop;

        // Arrays are handled differently than objects.
        if (orig instanceof Array) {
            o = [];

            for (i = 0, len = orig.length; i < len; i++) {
                v = orig[i];

                // Could be an array or an object.
                if (v instanceof Object) {
                    o.push(Pete.deepCopy(v));
                } else {
                    o.push(v);
                }
            }
        } else {
            o = {};

            for (prop in orig) {
                if (orig.hasOwnProperty(prop)) {
                    v = orig[prop];

                    // Could be an array or an object.
                    if (v instanceof Object) {
                        o[prop] = Pete.deepCopy(v);
                    } else {
                      o[prop] = v;
                    }
                }
            }
        }

        return o;
    },
    //</source>

    /**
     * @function Pete.emptyFn
     * @param None
     * @return {Function}
     */
    // <source>
    emptyFn: function () {},
    //</source>

    // @private
    // Note that this is only here for legacy browsers that don't support Object.create. This should not be called
    // directly.
    extend: function (proto) {
        var F = Pete.emptyFn;
        F.prototype = proto;

        return new F();
    }.assert(Object),

    /**
     * @function Pete.flush
     * @param {Array/String} action Function argument(s) can be an <code>Array</code> or one or more <code>Strings</code>
     * @return {None}
     * @describe <p>Values are:</p>
    <ul>
      <li><code>cache</code> - clear the cache of any <code><a href="#jsdoc">Pete.Elements</a></code></li>
      <li><code>disabled</code> - re-enable any disabled elements</li>
      <li><code>flyweight</code> - clear the flyweight object</li>
      <li><code>garbage</code> - clear the garbage cache of any <code>HTMLElements</code> that were removed from the DOM</li>
    </ul>
     */
    //<source>
    flush: function (action) {
        if (!action) {
            return;
        }

        var args = action.constructor === Array ?
            action :
            Pete.makeArray(arguments),
            i, len;

        for (i = 0, len = args.length; i < len; i++) {
            switch (args[i]) {
                case 'cache':
                    Pete.cache = {};
                    break;

                case 'disabled':
                    if (!Pete.isEmpty(Pete.disabled)) {
                      Pete.disabled = {};
                    }
                    break;

                case 'flyweight':
                    flyweight = {};
                    break;

                case 'garbage':
                    Pete.garbage = {};
            }
        }
    },
    //</source>

    getDom: function (el, root) {
        if (!el) {
            return;
        }

        return el.dom ?
            el.dom :
            typeof el === 'string' ? (root || document).getElementById(el) : el;
    },

    /**
     * @function Pete.id
     * @param {None}
     * @return {Number}
     * @describe <p>Gives an <code>Pete.Element</code> a unique ID if it doesn't already have one. Inspired by ExtJS</p>
     */
    //<source>
    id: function () {
        return Pete.globalSymbol + Pete.counter();
    },
    //</source>

    /**
     * @function Pete.isArray
     * @param {Mixed} v
     * @return {Boolean}
     * @describe <p>Tests if the passed data is an array.</p>
     */
    //<source>
    isArray: function (v) {
        return Object.prototype.toString.apply(v) === '[object Array]';
    },
    //</source>

    /**
     * @function Pete.isEmpty
     * @param {Mixed} v
     * @return {Boolean}
     * @describe <p>Tests if the variable is empty.</p><p><code>null</code>, <code>undefined</code> and <code>NaN</code> are considered to be empty values.</p>
     */
    //<source>
    isEmpty: function (v) {
        var empty = true,
            prop;

        if (typeof v === 'string' && v.length > 0 || typeof v === 'number' && !isNaN(v) || v instanceof Array && v.length > 0 || v instanceof Date) {
            empty = false;
        } else if (v instanceof Object) {
            for (prop in v) {
                if (v.hasOwnProperty(prop)) {
                    empty = false;
                    break;
                }
            }
        }

        /*
        //jsLint suggested changing SWITCH to an IF;
            switch (true) { //undefined, null and NaN values aren't represented;
              case typeof v === "string" && v.length > 0:
              case typeof v === "number" && !isNaN(v): //remember typeof NaN === "number";
              case v instanceof Array && v.length > 0:
              case v instanceof Date:
                empty = false;
                break;

              case v instanceof Object:
                for (var prop in v) {
                  if (v.hasOwnProperty(prop)) {
                    empty = false;
                    break;
                }
              }
            }
        */

        return empty;
    },
    //</source>

    /**
     * @function Pete.makeArray
     * @param {Object} o
     * @param {Number} start (Optional) The index at which to begin slicing
     * @return {Array}
     * @describe <p>Converts a collection of nodes or the <code>arguments</code> object into a true array.</p>
    <p>A tip of the hat to the Prototype library.</p>
    <p>Note: Nicholas Zakas <a href="http://www.nczonline.net/blog/2007/12/13/ie-com-reers-its-ugly-head/" rel="external">has a good blog post</a> about why IE doesn't respect <code>Array.prototype.slice</code>.</p>
    <p>This is to transfrom a collection into an array. If you want to cast an object to an array, please see <code><a href="#jsdoc">Pete.toArray</a></code>.</p>
     */
    //<source>
    makeArray: function (o, start) {
        if (!Pete.isIE) {
            return Array.prototype.slice.call(o, start);
        }

        var len = o.length || 0,
            arr = new Array(len);

        if (o && o.length) {
            while (len--) {
                arr[len] = o[len];

                if (len === start) {
                    break;
                }
            }
        }

        return arr;
    },
    //</source>

    /**
     * @function Pete.ready
     * @param {Function} fn
     * @param {Function} callback A callback that is called when the window.load event is fired.
     * @return {None}
     * @describe <p>Should be the first statement called in any jsLite application. All code to be invoked at page load should be within the function that is the sole argument.</p>
     */
    //<source>
    ready: function (fn, callback) {
        if (!Pete.isIE) {
            document.addEventListener('DOMContentLoaded', fn, false);
        } else {
            window.attachEvent('onload', fn);
        }

        if (callback) {
            Pete.Element.fly(window).on('load', callback);
        }
    },
    //</source>

    /**
     * @function Pete.toArray
     * @param {Object} o
     * @return {Array}
     * @describe <p>Transforms the passed object into an array. Employs <code>Object.hasOwnProperty</code> so as to not push inherited properties onto the array.</p>
<p>This is to cast an object to an array. If you want to transform a collection into an array, please see <code><a href="#jsdoc">Pete.makeArray</a></code>.</p>
     */
    //<source>
    toArray: function (o) {
        var arr = [],
            prop;

        for (prop in o) {
            if (o.hasOwnProperty(prop)) {
                arr.push(o[prop]);
            }
        }

        return arr;
    }.assert(Object),
    //</source>

    /**
     * @function Pete.trim
     * @param {String} str
     * @return {String}
     * @describe <p>Trims whitespace from the beginning and end of a <code>String</code>.</p>
     */
    //<source>
    trim: function (str) {
        var re = /^\s+|\s+$/g;
        return str.replace(re, '');
    }.assert(String),
    //</source>

    wrap: function (proto, method) {
        if (!proto[method]) {
            proto[method] = function () {
                return this.invoke(method, arguments);
            };
        }
    }
});

/**
* @property Pete.globalSymbol
* @type String
* @describe <p>Constant. The global symbol that is used in everything from the creation of unique <code><a href="#jsdoc">Pete.Element</a></code> ids to class names.</p>
*/
//<source>
Pete.globalSymbol = 'Pete';
//</source>

/**
* @property Pete.tags
* @type RegExp
* @describe <p>This contains all possible HTML tags. Is used by <code><a href="#jsdoc">Pete.domQuery</a></code> and <code><a href="#jsdoc">Pete.get.dom</a></code>. Is used internally but can be overwritten for any custom needs.</p>
*/
//<source>
Pete.tags = /^(?:\*|a|abbr|acronym|address|applet|area|b|base|basefont|bdo|big|blockquote|body|br|button|caption|center|cite|code|col|colgroup|dd|del|dfn|dir|div|dl|dt|em|fieldset|font|footer|form|frame|frameset|h1|h2|h3|h4|h5|h6|head|header|hr|html|i|iframe|img|input|ins|isindex|kbd|label|legend|li|link|map|menu|meta|noframes|noscript|object|ol|optgroup|option|p|param|pre|q|s|samp|script|section|select|small|span|strike|strong|style|sub|sup|table|tbody|td|textarea|tfoot|th|thead|title|tr|tt|u|ul|var)$/i;
//</source>

(function () {
    var ua = navigator.userAgent.toLocaleLowerCase(),
        isStrict = document.compatMode === 'CSS1Compat',
        isOpera = ua.indexOf('opera') > -1,
        isSafari = (/webkit|khtml/).test(ua),
        isSafari3 = isSafari && ua.indexOf('webkit/5') !== -1,
        isiPhone = ua.indexOf('iphone') > -1,
        //isIE = /*@cc_on!@*/false, //IE conditional compilation;
        isIE = !isOpera && ua.indexOf('msie') > -1,
        isIE6 = !isOpera && ua.indexOf('msie 6') > -1,
        isIE7 = !isOpera && ua.indexOf('msie 7') > -1,
        isIE8 = !isOpera && ua.indexOf('msie 8') > -1;

    Pete.mixin(Pete, {
        /**
        * @property Pete.isStrict
        * @type Boolean
        */
        //<source>
        isStrict: isStrict,
        //</source>

        /**
        * @property Pete.isOpera
        * @type Boolean
        */
        //<source>
        isOpera: isOpera,
        //</source>

        /**
        * @property Pete.isSafari
        * @type Boolean
        */
        //<source>
        isSafari: isSafari,
        //</source>

        /**
        * @property Pete.isSafari3
        * @type Boolean
        */
        //<source>
        isSafari3: isSafari3,
        //</source>

        /**
        * @property Pete.isiPhone
        * @type Boolean
        */
        //<source>
        isiPhone: isiPhone,
        //</source>

        /**
        * @property Pete.isIE
        * @type Boolean
        */
        //<source>
        isIE: isIE,
        //</source>

        /**
        * @property Pete.isIE6
        * @type Boolean
        */
        //<source>
        isIE6: isIE6,
        //</source>

        /**
        * @property Pete.isIE7
        * @type Boolean
        */
        //<source>
        isIE7: isIE7,
        //</source>

        /**
        * @property Pete.isIE8
        * @type Boolean
        */
        //<source>
        isIE8: isIE8
        //</source>
    });
}());

// For internal use only, can be modified via Pete#flush.
// TODO: make these private, only accessible via a closure?
(function () {
    Pete.mixin(Pete, {
        cache: {},
        disabled: {},
        events: {},
        garbage: {}
    });
}());

