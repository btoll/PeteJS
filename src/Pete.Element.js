/*
 * PeteJS
 *
 * Copyright (c) 2009 - 2015 Benjamin Toll (benjamintoll.com)
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 */

/**
* @function Element
* @param {String/HTMLElement} elem
* @return {Pete.Element/Null}
* @describe <p>Constructor. Shouldn't be called directly.</p>
*/
//<source>
/*
Pete.Element = function (elem) {
    //this.dom = typeof elem === "string" ? $(elem) : elem;

    return Pete.extend(Pete.Element.prototype, {
        dom: elem,
        id: Pete.id()
    });
};
*/
//</source>

Pete.Element = (function () {
    var re = /^[a-z]+[^+>=\s]+$/,
        reToken = /\{([a-z]+)\}/gi;

    return {
        /**
         * @function Pete.Element.addClass
         * @param {String} cls
         * @return {Pete.Element}
         * @describe <p>Adds a class to an element if it's not present.</p>
         */
        //<source>
        addClass: function (cls) {
            if (!this.hasClass(cls)) {
                this.dom.className += ' ' + cls;
            }
            return this;
        },
        //</source>

        /**
         * @function Pete.Element.after
         * @param {Pete.Element/HTMLElement/String} elem
         * @return {Pete.Element}
         * @describe <p>Inserts the new element after the parent in the DOM.</p>
         */
        //<source>
        after: function (elem) {
            var targetElement = this.dom,
                newElement = Pete.Element.get(elem, true),
                parent = targetElement.parentNode;

            if (parent.lastChild === targetElement) {
                parent.appendChild(newElement);
            } else {
                parent.insertBefore(newElement, targetElement.nextSibling);
            }

            return this;
        },
        //</source>

        /**
         * @function Pete.Element.ajax
         * @param {String} url The URL of the document to be fetched
         * @return {String}
         * @describe <p>This is an alias of <code><a href="#jsdoc">Pete.ajax.get</a></code>. It returns the <code>responseText</code>. Please keep in mind that it performs a synchronous request and as such is blocking.</p>
         * @example
    //create a tooltip whose results are that of a synchronous Ajax request;
    var oLink = Pete.Element.get("testy");
    oLink.tooltip(oLink.ajax("ajax_sync.html"));
         */
        //<source>
        ajax: function (url) {
            return Pete.ajax.get(url);
        },
        //</source>

        /**
         * @function Pete.Element.animate
         * @param {Object} o An object of animation config options
         * @return {Pete.Element}
         * @describe <p>Animates an object.</p>
         */
        //<source>
        animate: function (o) {
            o.elem = o.elem || this.dom;

            // TODO: what about animation?
            // Account for every possible property, undefined values are ok.
            new Pete.ux.Animation(o).run();

            return this;
        },
        //</source>

        /**
         * @function Pete.Element.append
         * @param {Pete.Element/HTMLElement/Array} elem
         * @return {Pete.Element}
         * @describe <p>Appends a Pete.Element or HTMLElement or a collection of them to a parent. When appending multiple elements, a document fragment is used for optimization.</p>
         */
        //<source>
        append: function (elem) {
            var fragment;

            if (Pete.isArray(elem)) {
                fragment = document.createDocumentFragment();

                elem.forEach(function (v) {
                    fragment.appendChild(Pete.Element.get(v, true));
                });

                this.dom.appendChild(fragment);

            } else {
                this.dom.appendChild(Pete.Element.get(elem).dom);
            }

            return this;
        },
        //</source>

        /**
         * @function Pete.Element.before
         * @param {Pete.Element/HTMLELement/String} elem
         * @return {Pete.Element}
         * @describe <p>Inserts the new element before the parent in the DOM.</p><p>Shortcut for the standard DOM API insertBefore method.</p>
         */
        //<source>
        before: function (elem) {
            // TODO: what is oTargetElement?
            this.dom.parentNode.insertBefore(Pete.Element.get(elem, true), oTargetElement);

            return this;
        },
        //</source>

        /**
         * @function Pete.Element.closest
         * @param {String} elem
         * @return {Pete.Element/Boolean}
         * @describe <p>Finds the closest parent element that matches <code>elem</code>. Inspired by the jQuery method of the same name.</p><p>Returns Boolean <code>false</code> if no matching parent element is found.</p>
    <p><a href="http://jslite.benjamintoll.com/examples/closest.php" rel="external">See an example</a></p>
         */
        //<source>
        closest: function (elem, context) {
            var parent = this.dom.parentNode;

            while (parent && parent.nodeName) {
                if (parent.nodeName.toLocaleLowerCase() === elem) {
                    return Pete.Element.get(parent);
                } else {
                    parent = parent.parentNode;

                    if (parent === document) {
                        return false;
                    }
                }
            }
        },
        //</source>

        // https://jsperf.com/bt-dom-element-creation/edit
        /**
         * @function Pete.Element.create
         * @param {object} obj
         * @param {boolean} returnDom optional
         * @return {Pete.Element/HTMLElement}
         * @describe <p>Dynamically create an elem and optionally append to a specified parent (and optionally have that parent created if not already in the dom). Optionally provide an <code>attr</code> object, a <code>style</code> object and an <code>items</code> array.</p><p>Returns a Pete.Element wrapper. If <code>returnDom</code> is <code>true</code>, returns an HTMLElement.</p>
         * @example
        Pete.Element.create({tag: 'ul',
            attr: {
                id: 'topLevel',
                cls: 'floater',
                onclick: fnHelloWorld //note you can reference a named function...;
                //onclick: function () { alert('hello, world!'); } //...or an anonymous function;
                //onclick: "alert('hello, world!');" //...or even a string;
            },
            style: {
                background: '#ffc',
                border: '1px solid #ccc',
                margin: '40px',
                padding: '20px'
            },
            items: [
                Pete.Element.create({tag: 'li',
                    attr: {
                        id: 'main',
                        cls: 'expand',
                        innerHTML: '<a href="#" onclick="alert(event); return false;">click me</a>'
                    }
                }),
                Pete.Element.create({tag: 'li',
                    attr: {
                        cls: 'expand'
                    },
                    items: [
                        Pete.Element.create({tag: 'a',
                            attr: {
                                href: '#',
                                onclick: "alert('Hello, World!'); return false;",
                                innerHTML: 'no, click me!'
                            }
                        })
                    ]
                })
            ],
            parent: document.body
        });

        ----------------------------------
        this would create a list like this
        ----------------------------------

        <ul style='border: 1px solid #ccc; margin: 40px; padding: 20px;
            background: #ffc;' class='floater' id='topLevel' onclick='fnHelloWorld();'>
            <li class='expand' id='main'>
                <a href='#' onclick='alert(event); return false;'>Click Me</a>
            </li>
            <li class='expand'>
                <a href='#' onclick='alert('Hello, World!'); return false;'>No, click me!</a>
            </li>
        </ul>
         */
        //<source>
        create: function (obj, returnDOM) {
            var el = Pete.compose(Pete.Element, {
                    dom: document.createElement(obj.tag)
                }),
                o, i, prop, alt, len, parent;

            el.setId(document.createElement(obj.tag));

            if (obj.attr) {
                o = obj.attr;
                for (prop in o) {
                    alt = prop;

                    if (o.hasOwnProperty(prop)) {
                        // NOTE html elements don't natively have 'on*' attribute.
                        if (prop.indexOf('on') === 0) {
                            // NOTE ie6 can't handle i.setAttribute.
                            el.dom[prop] = typeof o[prop] === 'function' ? o[prop] : new Function(o[prop]);
                        } else {
                            if (prop === 'cls') {
                                alt = 'className';
                            }

                            el.dom[alt] = o[prop];
                            //e.dom.setAttribute(prop, o[prop]);
                        }
                    }
                }
            }

            if (obj.style) {
                o = obj.style;

                for (prop in o) {
                    if (o.hasOwnProperty(prop)) {
                        if (prop === 'float') {
                            el.dom.style[!Pete.isIE ? 'cssFloat' : 'styleFloat'] = o[prop];
                            continue;
                        }

                        el.dom.style[prop] = o[prop];
                    }
                }

            }

            if (obj.items) {
                o = obj.items;

                for (i = 0, len = o.length; i < len; i++) {
                    el.dom.appendChild(o[i].dom);
                }
            }

            // The parent isn't in the DOM yet so create it and append all the items to it.
            if (obj.parent && obj.inDOM === false) {
                o = obj.parent;

                parent = typeof o === 'string' ?
                    Pete.compose(Pete.Element) : o;

                parent.appendChild(el.dom);
                return returnDOM ? parent.dom : parent;

            // If a parent elem was given and is already an existing node in the DOM append the node to it.
            } else if (obj.parent) {
                $(obj.parent).appendChild(el.dom);
                return returnDOM ? el.dom : el;
            // Else return the node to be appended later into the DOM.
            } else {
                return returnDOM ? el.dom : el;
            }
        },
        //</source>

        /**
         * @function Pete.Element.disable
         * @param {Boolean} cache (Optional)
         * @return {Pete.Element}
         * @describe
    <p>If <code>cache</code> is true, a reference to each <code>HTMLElement</code> will be stored in <code>Pete.disabled</code>. Each element in the cache can then be accessed by its id attribute value. Usually, this isn't necessary and re-enabling the element (<code><a href="#jsdoc">Pete.Element.enable</a></code>) will remove the reference from the cache.</p>
    <p>Important: If disabling links, a <code>disabled</code> class is expected. The default class resides in <code>jslite.css</code> but can be overridden by a user-defined stylesheet.</p>
         * @example
    var cLis = Pete.Element.gets("#theList li");
    cLis.disable("disabled");

    //a class name is not needed when disabling <input>s;
    var cInputs = Pete.Element.gets("#theForm input");
    cInputs.disable();
         */
        //<source>
        disable: function (cache) {
            var me = this,
                dom = me.dom,
                elem, i, remove;

            if (dom.onclick) {
                dom.originalHandler = dom.onclick;
            }

            dom.onclick = function () {
                return false;
            };

            // If this element has a handler (W3C) in the cache then remove it.
            if (Pete.events[dom.id]) {
                elem = Pete.events[dom.id];
                remove = Pete.dom.event.remove;

                for (i in elem) {
                    if (elem.hasOwnProperty(i)) {
                        remove(dom, i, elem[i]);
                    }
                }
            }

            if (dom.nodeName.toLocaleLowerCase() === 'input') {
                dom.disabled = true;
            } else {
                me.addClass('disabled');
            }

            if (cache) {
                Pete.disabled[dom.id] = dom;
            }

            return me;
        },
        //</source>

        /**
         * @function Pete.Element.enable
         * @param {None}
         * @return {Pete.Element}
         * @describe <p>If the element is in the <code>Pete.disabled</code> cache, it's removed.</p>
         * @example
    cLis.enable();

    //a class name is not needed when re-enabling <input>s;
    cInputs.enable();
         */
        //<source>
        enable: function () {
            var me = this,
                dom = me.dom,
                elem, i, add;

            if (dom.originalHandler) {
                dom.onclick = me.dom.originalHandler;
                dom.originalHandler = null;
            } else {
                dom.onclick = null;
            }

            // If this element has a handler (W3C) in the cache then readd it.
            if (Pete.events[dom.id]) {
                elem = Pete.events[dom.id];
                add = Pete.dom.event.add;

                for (i in elem) {
                    if (elem.hasOwnProperty(i)) {
                        add(dom, i, elem[i]);
                    }
                }
            }

            if (dom.nodeName.toLocaleLowerCase() === 'input') {
                dom.disabled = false;
            } else {
                me.removeClass('disabled');
            }

            if (Pete.disabled[dom.id]) {
                delete Pete.disabled[dom.id];
            }

            return me;
        },
        //</source>

        /**
         * @function Pete.Element.fly
         * @param {HTMLElement/String} elem
         * @return {Pete.Element}
         * @describe <p>For one-off operations.</p><p>The first time this method is called it checks an internal property to see if a <code><a href="#jsdoc">Pete.Element</a></code> object has been created. If not, it creates one. If it exists, it's re-used. This is important because the wrapper methods never change, and it's not necessary to keep creating new methods for one-off operations. The element is swapped out and is accessible in the <code>dom</code> property.</p><p>A use case would be when a one-time operation is needed to be performed on an element but a reference to that element is not needed for future use. Re-using the flyweight object is highly recommended for efficiency, as in most cases it's already been created.</p>
         */
        //<source>
        fly: (function () {
            var symbol = Pete.globalSymbol,
                flyweight = {};

            return function (elem) {
                if (!flyweight[symbol]) {
                  flyweight[symbol] = Pete.compose(Pete.Element);
                }

                flyweight[symbol].dom = Pete.Element.get(elem, true);
                return flyweight[symbol];
            };
        }()),
        //</source>

        /**
        * @function Pete.Element.getHeight
        * @return {String/Null}
        * @describe <p>Gets the height of the Element.  Returns the result of the lookup or <code>null</code>.</p><p>NOTE: this method doesn't support composite objects (<code><a href="#jsdoc">Pete.Composite</a></code>).</p>
        * @example
      this.tooltip.width = parseInt(Pete.Element.fly(this.tooltip).getHeight(), 10);
        */
        //<source>
        getHeight: function () {
            var height;

            if (this.dom === document.body) {
                height = Math.max(document.documentElement.offsetHeight, document.body.scrollHeight, document.documentElement.clientHeight) + 'px';
            } else {
                height = this.getStyle('height');
            }

            return height;
        },
        //</source>

        /**
        * @function Pete.Element.getStyle
        * @param {String} name CSS property name
        * @return {String/Null}
        * @describe <p>Supply a CSS property to lookup.  Returns the result of the lookup or <code>null</code>.</p><p>NOTE: this method doesn't support composite objects (<code><a href="#jsdoc">Pete.Composite</a></code>).</p>
        * @example
      this.tooltip.width = parseInt(Pete.Element.fly(this.tooltip).getStyle("width"), 10);
        */
        //<source>
        getStyle: function (name) {
            var me = this,
                dom = this.dom,
                obj;

            // If the property exists in style[] then it's been set recently and is current.
            if (dom.style[name]) {
                return dom.style[name];
            } else if (document.defaultView && document.defaultView.getComputedStyle) { //w3c;
                // It uses the traditional 'text-align' style of rule writing instead of 'textAlign'.
                name = name.replace(/([A-Z])/g, "-$1");
                name = name.toLocaleLowerCase();

                // Get the style object and get the value of the property if it exists.
                obj = document.defaultView.getComputedStyle(dom, '');

                return obj && obj.getPropertyValue(name);
            // IE and early versions of Opera.
            } else if (dom.currentStyle) {
                return dom.currentStyle[name];
            // Otherwise, some other browser is being used.
            } else {
                return null;
            }
        },
        //</source>

        /**
        * @function Pete.Element.getWidth
        * @return {String/Null}
        * @describe <p>Gets the width of the Element.  Returns the result of the lookup or <code>null</code>.</p><p>NOTE: this method doesn't support composite objects (<code><a href="#jsdoc">Pete.Composite</a></code>).</p>
        * @example
      this.tooltip.width = parseInt(Pete.Element.fly(this.tooltip).getWidth(), 10);
        */
        //<source>
        getWidth: function () {
            var width;

            if (this.dom === document.body) {
                width = Math.max(document.body.scrollWidth, document.documentElement.clientWidth) + 'px';
            } else {
                width = this.getStyle('width');
            }

            return width;
        },
        //</source>

        // Note that wrapping classname in spaces means that a regexp isn't needed.
        /**
         * @function Pete.Element.hasClass
         * @param {String} cls
         * @return {None}
         * @describe <p>Queries to see if an element has the specified class.</p>
         */
        //<source>
        hasClass: function (cls) {
          return cls &&
              (' ' + this.dom.className + ' ').indexOf(' ' + cls + ' ') > -1;
        },
        //</source>

        /**
         * @function Pete.Element.hide
         * @param {None}
         * @return {Pete.Element}
         * @describe <p>Hides an element by setting its <code>display</code> to <code>none</code>.</p>
         */
        //<source>
        hide: function () {
            this.dom.style.display = 'none';
            return this;
        },
        //</source>

        /**
         * @function Pete.Element.list
         * @param {Array} aFirst
         * @param {Array} aSecond (Optional)
         * @return {Pete.Element}
         * @describe
    <p><code>aFirst</code> could be a simple array, i.e:
    <pre>
    var aData = [
      'Phillies',
      'Braves',
      'Marlins',
      'Mets',
      'Nationals'
    ];
    </pre>

    <p>This could be used to create an ordered or unordered list. For example:</p>

    <code style="background: #FFA; padding: 5px;">Pete.Element.create({tag: "ul", parent: document.body}).list(aData);</code>

    <p>creates</p>

    <pre style="background: #8FBC8F; border: 1px solid #789; padding: 5px;">
    &#60;ul&#62;
      &#60;li&#62;Phillies&#60;/li&#62;
      &#60;li&#62;Braves&#60;/li&#62;
      &#60;li&#62;Marlins&#60;/li&#62;
      &#60;li&#62;Mets&#60;/li&#62;
      &#60;li&#62;Nationals&#60;/li&#62;
    &#60;/ul&#62;
    </pre>

    <p><code>aFirst</code> could also be an array of objects, i.e:
    <pre>
    var aData = [
      {value: 'Philadelphia', text: 'Phillies', increment: 1, nickname: 'World Champions', defaultSelected: true},
      {value: 'Atlanta', text: 'Braves', increment: 5, defaultSelected: false},
      {value: 'Florida', text: 'Marlins', increment: 7, defaultSelected: false},
      {value: 'New York', text: 'Mets', increment: 3, defaultSelected: false},
      {value: 'Washington', text: 'Nationals', increment: 9, defaultSelected: false}
    ];
    </pre>

    <p>Note that in this example that the property names must be precise in that they will map to actual <code>HTMLOptionElement</code> properties. For instance, when adding children to a <code>select</code> dom element, <code>value</code> will map to the <code>option</code> element's <code>value</code> attribute and <code>text</code> will map to the <code>text</code> property of the element. (Also, note that you can add custom attributes.) For example:</p>

    <code style="background: #FFA; padding: 5px;">Pete.Element.create({tag: "select", parent: document.body}).list(aData);</code>

    <p>creates</p>

    <pre style="background: #8FBC8F; border: 1px solid #789; padding: 5px;">
    &#60;select&#62;
      &#60;option value=&#34;Philadelphia&#34;&#62;Phillies&#60;/option&#62;
      &#60;option value=&#34;Atlanta&#34;&#62;Braves&#60;/option&#62;
      &#60;option value=&#34;Florida&#34;&#62;Marlins&#60;/option&#62;
      &#60;option value=&#34;New York&#34;&#62;Mets&#60;/option&#62;
      &#60;option value=&#34;Washington&#34;&#62;Nationals&#60;/option&#62
    &#60;/select&#62;
    </pre>
    </p>

    <p>If two single-dimensional arrays are passed, then the first array will be each <code>Option</code> object's <code>text</code> property and the second will be the <code>values</code>.</p>

    <pre>
    var aCities = [
      'Philadelphia',
      'Atlanta',
      'Florida',
      'New York',
      'Washington'
    ];
    </pre>

    <pre>
    var aTeams = [
      'Phillies',
      'Braves',
      'Marlins',
      'Mets',
      'Nationals'
    ];
    </pre>

    <p>The same <code>select</code> list above could be created using the following code:</p>
    <p><code style="background: #FFA; padding: 5px;">Pete.Element.create({tag: "select", parent: document.body}).list(aTeams, aCities);</code></p>

    <hr />

    <p>Note: only works on <code>select</code>, <code>ul</code> and <code>ol</code> elements.</p>
    <p><a href="http://jslite.benjamintoll.com/examples/list.php" rel="external">See an example</a></p>
        * @example
    var oList = Pete.Element.get('myList');

    var aTest = [1, 2, 3, 4, 5, 6];
    var aTest2 = ['one', 'two', 'three', 'four', 'five', 'six'];

    //create a list where both Option.text and Option.value are the same;
    oList.list(aTest);

    //create a list where both Option.text and Option.value are different;
    oList.list(aTest, aTest2);

    //when the first function argument is an array of arguments,
    only one function argument should be passed;
    var aTeams = [
      {value: 'Philadelphia', text: 'Phillies'},
      {value: 'Atlanta', text: 'Braves'},
      {value: 'Florida', text: 'Marlins'},
      {value: 'New York', text: 'Mets'},
      {value: 'Washington', text: 'Nationals'}
    ];
    oList.list(aTeams);
         */
        //<source>
        list: function (aFirst, aSecond) {
            if (['SELECT', 'UL', 'OL'].join().indexOf(this.dom.nodeName) === -1) {
                throw new Error('Method only acts on lists.');
            }

            var me = this.dom,
                fn = function (el, index, arr) {
                    // 'this' will refer either to the Array on which the method is called
                    // or to the option Object if it's passed as the second arg;
                    //   - this allows us to pass either one array objects or two;
                    //   - one array: value and text are the same;
                    //   - two arrays: value is contained in the second array;
                    if (me.nodeName === 'SELECT') {
                        me.options[me.options.length] = new Option(arr[index], this[index], false, false);
                    } else {
                        Pete.Element.create({tag: 'li',
                            attr: { innerHTML: arr[index] },
                            parent: me
                        });
                    }
                },
                attrs, sNodeName, attr;

            if (aFirst[0].constructor === Object) {
                sNodeName = me.nodeName === 'SELECT' ? 'option' : 'li';

                aFirst.forEach(function (oRow) {
                    attrs = {};

                    for (attr in oRow) {
                        if (oRow.hasOwnProperty(attr)) {
                            attrs[attr] = oRow[attr];
                        }
                    }

                    Pete.Element.create({tag: sNodeName,
                        attr: attrs,
                        parent: me
                    });
                });
            } else {
                // If aSecond is undefined then only one array was passed to Pete.Element.list.
                // If we don't set aFirst as the second parameter then "this" will equal the window
                // object in the callback (the second argument to forEach is the context).
                // This allows us to set the option's value to be the same as the option's text.
                aFirst.forEach(fn, aSecond || aFirst);
            }

            return this;
        },
        //</source>

        /**
         * @function Pete.Element.next
         * @param {String} elem Optional
         * @param {Boolean} returnDOM Optional
         * @return {Pete.Element/HTMLElement}
         * @describe <p>Returns a Pete.Element wrapper. If <code>returnDOM</code> is <code>true</code>, returns an HTMLElement.</p>
         */
        //<source>
        next: function (elem, returnDOM) {
            if (elem && typeof elem === 'boolean') {
                returnDOM = elem;
                elem = undefined;
            }

            var next = Pete.Element.get(this, true).nextSibling;

            return next.nodeType === 1 ?
                returnDOM ?
                next :
                    Pete.Element.fly(next)
                    : arguments.callee.call(next, elem, returnDOM);
        },
        //</source>

        /**
         * @function Pete.Element.on
         * @param {String/Array} type The type of event, i.e. <code>click</code> or <code>change</code> or <code>[&quot;click&quot;, &quot;change&quot;]</code>
         * @param {Function} fn The callback function
         * @return {None}
         * @describe <p>Binds one or more event listeners to the element and adds it/them to the cache. If listening to more than one type of event, pass the events as an array as the first argument.</p>
         * @example
    var func = function (e) {
      alert("Hello, World!");
      e.preventDefault();
    };

    var cLinks = Pete.Element.gets("#menubar a");
    cLinks.on("click", func);

    - or -
    cLinks.on(["click", "mouseover"], func); //pass multiple event to listen to as an array;
         */
        //<source>
        on: function (type, fn) {
            if (typeof type === "string") {
                type = [type];
            }

            type.forEach(function (sType) {
                Pete.dom.event.add(this.dom, sType, fn);

                // Create the object for each id.
                var o = null, arr = [];

                if (!Pete.events[this.dom.id]) {
                    Pete.events[this.dom.id] = {};
                }
                o = Pete.events[this.dom.id];

                // Within each id object store the handler for each event type.
                if (!o[sType]) {
                    o[sType] = fn;
                // If there's more than one handler for a given type then create an array of the handlers and assign it to the type.
                } else {
                    if (!Pete.isArray(o[sType])) {
                        arr = Pete.toArray(o);
                        arr.push(fn);
                        o[sType] = arr;
                    // It's already been cast to an array.
                    } else {
                        o[sType].push(fn);
                    }
                }
            }.bind(this));
        },
        //</source>

        /**
         * @function Pete.Element.parent
         * @param {String} elem Optional
         * @param {Boolean} returnDOM Optional
         * @return {Pete.Element/HTMLElement}
         * @describe <p>If no argument is given, return the element's parent. Else, return the first parent whose <code>nodeName</code> matches the passed parameter.</p><p>Returns a Pete.Element wrapper. If <code>returnDOM</code> is <code>true</code>, returns an HTMLElement. Returns <code>false</code> if no parent is found.</p>
         * @example
    var parent = Pete.Element.get("#test p span").parent();

    var parent = Pete.Element.get("#test p span").parent("div").setStyle({background: "red", fontFamily: "arial"}); //parent() returns a PeteElement by default;

    var parent = Pete.Element.get("#test p span").parent("div", true).style.background = "red"; //have parent() return the HTMLElement;
         */
        //<source>
        parent: function (elem, returnDOM) {
            var fnReturnElement = function () {
                return returnDOM ?
                    parent :
                    Pete.Element.get(parent)
            },
            parent = Pete.Element.get(this, true).parentNode;

            if (!parent) {
                throw new Error("Parent could not be found");
            }

            if (elem && typeof elem === "boolean") {
                returnDOM = elem;
                elem = undefined;
            }

            //return parent.nodeType === 1 ? parent : arguments.callee.call(parent);
            if (parent.nodeType === 1) {
                if (elem && typeof elem !== "boolean") {
                    // A specific parent nodeName was passed in and the parent hasn't found it yet so keep recursing.
                    if (parent.nodeName.toLocaleLowerCase() !== elem) {
                         // This has to return the final value since it's recursive and we could be dealing with many
                         // execution contexts by nature of it being a recursive function.
                        return arguments.callee.call(parent, elem, returnDOM);
                    } else {
                        return fnReturnElement();
                    }
                } else {
                    return fnReturnElement();
                }
            } else {
                arguments.callee.call(parent, elem, returnDOM);
            }
        },
        //</source>

        /**
         * @function Pete.Element.previous
         * @param {String} elem Optional
         * @param {Boolean} returnDOM Optional
         * @return {HTMLElement}
         * @describe <p>Returns a Pete.Element wrapper. If <code>returnDOM</code> is <code>true</code>, returns an HTMLElement.</p>
         */
        //<source>
        previous: function (elem, returnDOM) {
            if (elem && typeof elem === "boolean") {
                returnDOM = elem;
                elem = undefined;
            }

            var prev = Pete.Element.get(this, true).previousSibling;

            if (!prev) {
                throw new Error("Previous sibling could not be found");
            }

            return prev.nodeType === 1 ?
                returnDOM ?
                prev :
                    Pete.Element.fly(prev) :
                    arguments.callee.call(prev, elem, returnDOM);
        },
        //</source>

        /**
         * @function Pete.Element.remove
         * @param {None/String/HTMLElement/Pete.Element/Boolean} elem The element(s) to remove
         * @return {Pete.Element/Pete.Composite}
         * @describe <p>Removes an HTMLElement from the DOM and stores it in the <code>Pete.garbage</code> cache.</p>
    <p>This method can be used in the following ways:</p>
    <ul>
      <li>If no param is passed, the method removes itself.</li>
      <li>If a non-Boolean param is passed, remove that specific HTMLElement from the DOM.</li>
      <li>If the Boolean true is passed as the param, remove all children of the current element.</li>
    </ul>
    <p>Please note that since this method returns the object it's bound to to allow for method chaining, the removed <code>HTMLElement</code> is not returned. Therefore, all removed elements are accessible via the global <code>Pete.garbage</code> cache by their id attribute values.</p>
         * @example
    Pete.Element.get('five').remove('two'); //removes the element with the id 'two';

    Pete.Element.get('five').remove(true); //removes all children of element 'five';

    //later on in the code you need a reference to the removed element for whatever reason;
    var oRemovedElement = Pete.garbage['two'];
         */
        //<source>
        remove: function (elem) {
            var children,
                i, o;

            if (typeof elem === 'boolean' && elem) {
                children = this.dom.childNodes;

                for (i = 0; children[i];) {
                    // Remember a node list is a live list.
                    children[i].parentNode.removeChild(children[i]);
                }
            } else {
                o = Pete.Element.get(elem || this, true);
                //Pete.garbage[o.id] = o.parentNode.removeChild(o);
                o.parentNode.removeChild(o);
            }

            return this;
        },
        //</source>

        /**
         * @function Pete.Element.replaceClass
         * @param {String} newClass
         * @param {String} currentClass
         * @return {Pete.Element}
         * @describe <p>Swaps out the class or adds it if it doesn't exist.</p>
         */
        //<source>
        replaceClass: function (newClass, currentClass) {
            // Swap out the class or just add it if currentClass doesn't exist.
            if (this.hasClass(currentClass)) {
                this.dom.className = this.dom.className.replace(currentClass, newClass);
            } else {
                //this.dom.className += ' ' + newClass;
                this.addClass(newClass);
            }

            return this;
        },
        //</source>

        /**
         * @function Pete.Element.removeClass
         * @param {String/Array} v
         * @return {Pete.Element}
         * @describe <p>Pass either one class or multiple classes as an array to be removed.</p>
         */
        //<source>
        removeClass: function (v) {
            var me = this,
                dom = me.dom,
                i = 0,
                len;

            v = (v instanceof Array) ? v : [v];

            for (len = v.length; i < len; i++) {
                if (me.hasClass(v[i])) {
                    dom.className = dom.className.replace(v[i], '');
                }
            }

            return me;
        },
        //</source>

        /**
         * @function Pete.Element.serialize
         * @param {None}
         * @return {String}
         * @describe <p>Retrieves a form's <code>input</code>, <code>select</code> and <code>textarea</code> elements and gathers their values, delimiting them by an ampersand into key-value pairs that can be then used in an HTTP POST method.</p>
    <p><a href="http://jslite.benjamintoll.com/examples/ajaxFormSubmission.php" rel="external">See an example of serializing form data for an Ajax request</a></p>
         */
        //<source>
        serialize: function () {
            var arr = [];

            Pete.Element.formElements(this).forEach(function (o) {
                var i, opts;

                outerLoop:
                switch (o.nodeName.toLocaleLowerCase()) {
                    case 'input':
                        switch (o.type) {
                            case 'checkbox':
                            case 'radio':
                                if (!o.checked) {
                                    break outerLoop;
                                }
                        }
                        // Falls through.

                    case 'select':
                        if (o.type === 'select-multiple') {
                            for (i = 0, opts = o.options, len = opts.length; i < len; i++) {
                                if (opts[i].selected) {
                                    arr.push(encodeURIComponent(o.name) + '=' + encodeURIComponent(opts[i].value));
                                }
                            }
                            break;
                        }
                        // Falls through.

                    default:
                        arr.push(encodeURIComponent(o.name) + '=' + encodeURIComponent(o.value));
                }
            });

            return arr.join('&');
        },
        //</source>

        //<source>
        setId: function () {
            return Pete.counter();
        },
        //</source>

        /**
         * @function Pete.Element.setStyle
         * @param {String/Object} prop
         * @param {String} value
         * @return {Pete.Element}
         * @describe <p>Pass either a single property and its corresponding value or a single argument that is an object of styles.</p>
         */
        //<source>
        setStyle: function (prop, value) {
            var i;

            if (typeof prop === 'string') {
                this.dom.style[prop] = value;
            } else if (prop.constructor === Object) {
                for (i in prop) {
                    if (prop.hasOwnProperty(i)) {
                        this.dom.style[i] = prop[i];
                    }
                }
            }

            return this;
        },
        //</source>

        /**
         * @function Pete.Element.show
         * @param {None}
         * @return {Pete.Element}
         * @describe <p>Shows an element by setting its <code>display</code> to <code>block</code>.</p>
         */
        //<source>
        show: function () {
            this.dom.style.display = 'block';
            return this;
        },
        //</source>

        /**
         * @function Pete.Element.textContent
         * @param {None}
         * @return {String}
         * @describe <p>Uses either the Core DOM <code>textContent</code> property or Internet Explorer's proprietary <code>innerText</code> property to retrieve all of the text nodes within an element node.</p>
         * @example None
         */
        //<source>
        textContent: function () {
            return document.addEventListener ? this.dom.textContent : this.dom.innerText;
        },
        //</source>

        /**
         * @function Pete.Element.toggleClass
         * @param {String} classname
         * @return {Pete.Element}
         * @describe <p>Removes the class if the element already has it or adds it if it doesn't.</p>
         */
        //<source>
        toggleClass: function (classname) {
            if (this.hasClass(classname)) {
                this.removeClass(classname);
            } else {
                this.addClass(classname);
            }

            return this;
        },
        //</source>

        /**
         * @function Pete.Element.tooltip
         * @param {Mixed} tip String or Array
         * @param {Boolean} animate True if tooltip should be animated
         * @return {Pete.Element}
         * @describe <p>Pass a string or any identifier that has a string value as the sole argument or an array of string values.</p><p>An element can have an animated tooltip by passing a second parameter with a value of <code>true</code>.</p><p>If an array, the method expects tokenized strings which would each map to an <code>HTMLElement</code> attribute. If you want one of the array elements to map to an <code>HTMLElement</code> attribute, tokenize it by enclosing it in curly braces. Otherwise, the array element will be interpreted as a plain string.</p>
    <p>Note any formatting should be passed along in the array as its own element. You can also pass along any string or a string of HTML.</p>
    <p>Please see <code><a href="#jsdoc">Pete.ux.Tooltip</a></code> for more information.</p>
         * @example
    Pete.Element.get('theLink').tooltip('This is my tooltip.');
    //and/or
    oForm.tooltip($('thePara').innerHTML);

    //a tooltip can be animated by passing a second parameter of true;
    Pete.Element.get('theLink').tooltip('This is my tooltip.', true);

    //you wanted to get the value of the rel and href attributes for every link on the page;
    //each tooltip will contain the value of each link's rel attribute;
    Pete.Element.gets('a[rel]').tooltip(['{rel}']);

    //gets the value of the link's rel and href attributes (not equal to '#') and does some formatting;
    Pete.Element.gets("a[href!=#][rel]").tooltip(["{rel}", " {", "<a href='{href}'>{href}</a>", "}"]);
         */
        //<source>
        tooltip: function (tip, animate) {
            var me = this.dom;

            if (Pete.isArray(tip)) {
                if (tip.length > 1) {
                    tip = tip.join('').replace(reToken, function (a, b) {
                        return me.getAttribute(b);
                    });
                } else {
                    tip = me.getAttribute(tip[0]);
                }
            }
            Pete.ux.Tooltip.init.call(me, tip, animate);

            return me;
        },
        //</source>

        /**
         * @function Pete.Element.trim
         * @param {String}
         * @return {String}
         * @describe <p>Checks to see if the element is a text box. If it is, then it passes the value to <code><a href="#jsdoc">Pete.trim</a></code> to do a standard trim.</a></code>.</p>
         */
        //<source>
        trim: function () {
            var dom = Pete.Element.get(this, true);

            if (!Pete.Element.isTextBox(dom)) {
                return;
            }

            dom.value = Pete.trim(dom.value);

            return this;
        },
        //</source>

        /**
         * @function Pete.Element.un
         * @param {String/Array} type The type of event, i.e. <code>click</code> or <code>change</code> or <code>[&quot;click&quot;, &quot;change&quot;]</code>
         * @param {Function} fn The callback function
         * @return {None}
         * @describe <p>Unbinds one or more event listeners from the element and removes it/them from the cache. If removing more than one type of event, pass the events as an array as the first argument.</p>
         * @example
    //...previous code...;
    cLinks.un('click', func);

    - or -

    cLinks.un(['click', 'mouseover'], func);
         */
        //<source>
        un: function (type, fn) {
            var me = this;

            if (typeof type === 'string') {
                type = [type];
            }

            type.forEach(function (sType) {
                var dom = me.dom;

                Pete.Element.event.remove(dom, sType, fn);
                delete Pete.events[dom.id][sType];
            });
        },
        //</source>

        /**
         * @function Pete.Element.validate
         * @param {Function} callback Optional
         * @param {Object} config Optional A map of configurable properties that will override the defaults
         * @return {Pete.Element/Pete.Composite}
         * @describe <p>Searches the form the method was invoked on for any form elements whose classes are matched by regular expressions which determine the elements to be candidates for validation. Note that binding a handler to the form's submit event and defining the callback is still the responsibility of the developer. Please refer to the example.</p><p>The form elements to be validated must have their classes set to predetermined values, otherwise the class that performs the validation won't recognize them as elements to be validated.</p><p>The following are the valid validation classes:</p>
    <ul>
      <li>required</li>
      <li>required-email</li>
      <li>required-phone</li>
      <li>required-ssn</li>
      <li>required-zip</li>
    </ul>
    <p>Note that since forms will have different HTML structures, the <code>options.classMap</code> property can be used to target the element that should have
    the <code>textError</code> class attached to it.</p>
    <p><a href="http://jslite.benjamintoll.com/examples/validate.php" rel="external">See an example of form validation</a></p>
         * @example
    var callback = function (e) {
      var oScrubber = this.dom.scrubber;
      if (oScrubber.getErrors() > 0) {
        console.log(oScrubber.getErrors() + ' validation errors');
      } else {
        Pete.ajax.load({
          url: 'lib/php/controller.php',
          data: 'json',
          type: 'POST',
          postvars: this.elements,
          onSuccess: function (sResponse) {
            //do something useful...;
          }
        });
      }
      e.preventDefault();
    };

    //validate an entire form;
    var oContactForm = Pete.Element.get("contactForm");
    oContactForm.validate(callback);

    //attach a handler to a single form element;
    var oZip = Pete.Element.get("zip");
    oZip.validate();

    ---------------------------------------------------------

    NOTE that the class that implements the validation behavior uses regular expressions to determine
    which form elements to bind change listeners to. This needs to be established in the markup.

    An example form:

    <form id="contactForm" method="post" action="lib/php/controller.php">

      <fieldset>
      <legend>Contacts</legend>
      <ol>
        <li>
          <label for="firstName">First Name</label>
          <input type="text" id="firstName" class="required" name="firstName" />
        </li>
        <li>
          <label for="lastName">Last Name</label>
          <input type="text" id="lastName" class="required" name="lastName" />
        </li>
        <li>
          <label for="address">Address</label>
          <input type="text" id="address" class="required" name="address" />
        </li>
        <li>
          <label for="city">City</label>
          <input type="text" id="city" class="required" name="city" />
        </li>
        <li>
          <label for="state">State</label>
          <input type="text" id="state" class="required" name="state" />
        </li>
        <li>
          <label for="zip">Zip</label>
          <input type="text" id="zip" class="required-zip" name="zip" />
        </li>
        <li>
          <label for="phone">Phone</label>
          <input type="text" id="phone" class="required-phone" name="phone" />
        </li>
        <li>
          <label for="email">Email</label>
          <input type="text" id="email" class="required-email" name="email" />
        </li>
        <li>
          <input type="submit" name="contact" value="Submit Contact" />
        </li>
      </ol>

      </fieldset>

    </form>

    Nice, clean markup with no custom attributes. Sweet!
         */
        //<source>
        validate: function (callback/*, config*/) {
            var me = this,
                config = typeof callback === 'object' ? callback : arguments[1],
                func = typeof callback === 'function' ? callback : null,
                scrubber;

            if (me.dom.nodeName.toLocaleLowerCase() !== 'form') {
                throw new Error('This method can only be invoked on a form object.');
            }

            //Pete.Element.cleanWhitespace(me.dom);
            me.dom.scrubber = new Pete.ux.Scrubber(me, config); //bind the new scrubber instance to the form;

            // If the object is in the events cache and already has a submit event handler bound to it then we can just invoke scrubber.
            if (Pete.events[me.dom.id] && Pete.events[me.dom.id].submit) {
                // Store a reference to the object or it becomes null after this statement (don't know why yet).
                scrubber = me.dom.scrubber;
                scrubber.validate.call(scrubber);

                // Return the number of errors (if any) so the handler can use it.
                return scrubber.getErrors.call(scrubber);

            } else {
                me.on('submit', function (e) {
                    this.scrubber.validate();

                    if (func) {
                        // Ensures that the form will be the value of 'this' w/in the callback.
                        func.call(me, e);
                    // If there's no callback then it's a simple test (if there are errors don't submit, if there aren't send it along).
                    } else {
                        if (this.scrubber.getErrors()) {
                            e.preventDefault();
                        }
                    }
                });
            }

            return this;
        },
        //</source>

        /**
         * @function Pete.Element.value
         * @param {Mixed}
         * @return {Pete.Element/Mixed}
         * @describe <p>When acting as a getter, it will return the text content of the element (just the text, no HTML). If operating on an <code>input</code> element, it will return the element's <code>value</code> property.</p><p>When acting as a setter, it will set the element's <code>innerHTML</code> property. If operating on an <code>input</code> element, it will set the element's <code>value</code> property. <p>Chaining is allowed when used as a setter.</p>
         * @example
    Pete.Element.gets("input").setStyle({background: "#CCC"}).value("test test i'm a test");
         */
        //<source>
        value: function (v) {
            if (v) {
                !Pete.Element.isTextBox(this) ?
                    this.dom.innerHTML = v :
                    this.dom.value = v;

                // Allow for chaining.
                return this;

            // If getting, return the value.
            } else {
                return this.textContent() || this.dom.value;
            }
        },
        //</source>

        /**
         * @function Pete.Element.formElements
         * @param {String/HTMLElement/Pete.Element} form Either a form id or a form HTMLElement or a form Pete.Element.
         * @return {Pete.Composite}
         * @describe <p>Returns a <code><a href="#jsdoc">Pete.Composite</a></code> element.</p>
         */
        //<source>
        formElements: function (form) {
            var f = Pete.Element.get($(form), true);

            if (f.nodeName.toLocaleLowerCase() !== 'form') {
                throw new Error('This method can only be invoked on a form element.');
            }

            return Pete.domQuery.search('input[name], select[name], textarea[name]', f);
        },
        //</source>

        /**
         * @function Pete.Element.get
         * @param {String/HTMLElement} elem Can be either the <code>id</code> of an existing element or a reference to an <code>HTMLElement</code>
         * @param {HTMLElement} root Optional, will default to <code>document</code>.
         * @param {Boolean} returnDOM Optional
         * @return {Pete.Element/HTMLElement}
         * @describe <p>Will only return a single element.</p><p>This method accepts a CSS selector string. If multiple results are found, only the first is returned.</p><p>Returns a <code><a href='#jsdoc'>Pete.Element</a></code> wrapper. If <code>returnDOM</code> is <code>true</code>, returns an HTMLElement instead.</p>
         */
        //<source>
        get: function (elem, root, returnDOM) {
            var n, el, id;

            if (root && typeof root === 'boolean') {
                returnDOM = root;
                root = undefined;
            }

            // If elem is an object we know it's a dom element.
            // If elem begins with anything other than a letter or contains whitespace
            // or > (descendant selector) or + (adjacent selector) then handle as usual.
            // Else if it only contains letters and is not a tag then process like usual,
            // else pass to the domQuery engine (via Pete.Element.gets).
            if (typeof elem !== 'string' || re.test(elem) && !Pete.tags.test(elem)) {
                if (typeof elem === 'string') {
                    // Exit if element is not in the dom.
                    if (!(n = $(elem))) {
                        return null;
                    }

                    // Element is already cached.
                    if ((el = Pete.cache[elem])) {
                        // Update and refresh element.
                        el.dom = n;
                    // Element is not in cache so create it and cache it.
                    } else {
                        //el = Pete.cache[elem] = new Pete.Element(n);
                        el = Pete.cache[elem] = Pete.compose(Pete.Element, {
                            dom: n
                        });
                    }

                    return returnDOM ? n : el;
                } else {
                    // The element has an id so either get it from cache or create
                    // a new Element and add it to the cache.
                    if (elem.id) {
                        if ((el = Pete.cache[elem.id])) {
                            el.dom = elem;
                        } else {
                            el = Pete.cache[elem.id] = Pete.compose(Pete.Element, {
                                dom: elem
                            });
                        }
                    } else {
                        // There's no id, create a unique one, create a new Element and add to cache.
                        id = Pete.Element.setId();

                        if ((el = Pete.cache[id])) {
                            el.dom = elem;
                        } else {
                            el = Pete.cache[id] = Pete.compose(Pete.Element, {
                                dom: elem
                            });

                            el.setId();
                            el.dom.id = id;
                        }
                    }

                    el.dom = elem;

                    return returnDOM ? elem : el;
                }
            } else {
                // This allows for passing a selector to the domQuery engine (via Pete.Element.gets).
                // Pass along a third argument in case root is also passed.
                //
                // TODO: Using Element.get here causes a Too Much Recursion error.
                el = Pete.cache[elem.id] = Pete.compose(Pete.Element, {
                    dom: Pete.Element.gets(elem, root || true, true)[0]
                });

                return returnDOM ? el.dom : el;
            }
        },
        //</source>

        /**
         * @function Pete.Element.gets
         * @param {String} selector
         * @param {HTMLElement} root Optional, will default to <code>document</code>.
         * @param {Boolean} returnDOM Optional
         * @return {Pete.Composite/Array}
         * @describe <p>Pass a selector as well as an optional context element.</p><p>See <code><a href="#jsdoc">Pete.domQuery</a></code> for specifics.</p><p>Returns a Pete.Element wrapper. If <code>returnDOM</code> is <code>true</code>, returns an HTMLElement.</p><p><strong>As of version 1.9, Pete uses the Selectors API under the hood if the client's browser supports it (specifically, <code>document.querySelectorAll()</code>).</strong></p>
         * @example
        var cLis = Pete.Element.gets('div div#theDiv.foobar .foo');
        cLis.addClass('bar');

        Please see Pete.domQuery for more examples.
         */
        //<source>
        gets: function (selector, root, returnDOM) {
            if (root && typeof root === 'boolean') {
                returnDOM = root;
                root = document;
            }

            var elems,
                a = [],
                i, len, elem;

            //some older browsers don't support the Selectors API and the Selectors API doesn't support negative attribute selectors, i.e. #myElem[class!=foo];
            if (selector.indexOf('!') !== -1 || typeof document.querySelectorAll !== 'function') {
                elems = Pete.domQuery.search(selector, root); //returns a live HTML collection;
            } else {
                elems = (root || document).querySelectorAll(selector); //use the Selectors API, it's faster and returns a static nodelist;
            }
            for (i = 0, len = elems.length; i < len; i++) {
                elem = elems[i];

                if (!elem.id) { //make sure that every element has an id (if not auto-generate one);
                    elem.id = Pete.Element.setId();
                }
                a.push(elems[i]);
            }

            return returnDOM ? a : Pete.Composite.init(a);

        }
        //</source>
    };
}());

