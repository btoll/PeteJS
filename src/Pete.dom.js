/*
 * PeteJS
 *
 * Copyright (c) 2009 - 2015 Benjamin Toll (benjamintoll.com)
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 */
var $ = function (elem, scope) {
    return typeof elem === "string" ? (scope || document).getElementById(elem) : elem;
};

Pete.dom = {
    /**
     * @function Pete.dom.attachHandler
     * @param {Array/String} elem
     * @return {None}
     * @describe <p>Pass one or more methods (usually event handlers) as elements of an array, i.e., <code>["events.doThis", "global.doThat"]</code> or singularly as a <code>String</code>.</p><p>Must be objects of the <code>Pete</code> global symbol.</p>
     * @example
Pete.dom.attachHandler([
  'global.drawNavbarList',
  'events.addColumn',
  'events.moveDownColumn',
  'events.moveUpColumn',
  'events.subtractColumn',
  'superglobal.drawViewsList'
]);

Pete.ready(Pete.dom.attachHandler);
     */
    //<source>
    attachHandler: function (elem) {
        // Attach the handlers, argument can either be an array of strings or a single string.
        // Each elem will be a namepaced string that's split by it's period,
        // i.e. 'events.slidingDoors' or 'global.clickedFolder'.
        var namespace = [],
            i, len;

        if (elem.constructor === Array) {
            for (i = 0, len = elem.length; i < len; i++) {
                namespace = elem[i].split('.');
                Pete[namespace[0]][namespace[1]]();
            }
        } else {
            // It's just a string.
            namespace = elem.split('.');
            Pete[namespace[0]][namespace[1]]();
        }
    },
    //</source>

    /**
     * @function Pete.dom.cleanWhitespace
     * @param {String/HTMLElement} element
     * @return {None}
     * @describe <p>This method strips out all whitespace within the given <code>HTMLElement</code>.</p>
     */
    //<source>
    cleanWhitespace: function (element) {
        var args = arguments,
            element = (element && $(element)) || document,
            x, len, i, childNode;

        for (x = 0, len = element.childNodes.length; x < len; x++) {
            childNode = element.childNodes[x];
            if (childNode.nodeType === 3 && !/\S/.test(childNode.nodeValue)) {
                element.removeChild(element.childNodes[x]);
                x--;
            }
            if (childNode.nodeType === 1) {
                args.callee(childNode); //call this function;
            }
        }

        // If more than one element is passed then call the function for each one
        // (i.e., Pete.dom.cleanWhitespace('adminBar', 'navbar')).
        if (args.length > 1) {
            for (i = 1; args[i] !== null; i++) {
                args.callee(args[i]);
            }
        }
    },
    //</source>

    event: (function () {
        var _find = function (element, eventType, handler) {
            var handlers = element._handlers;
            if (!handlers) {
                return -1;
            }

            var d = element.document || element;
            var w = d.parentWindow;

            for (var i = handlers.length; i >= 0; i--) {
                var handlerId = handlers[i];
                var h = w._allHandlers[handlerId];

                if (h && h.eventType === eventType && h.handler === handler) {
                    return i;
                }
            }

            return -1
        };

        var _removeAllHandlers = function () {
            var w = this;
            for (var id in w._allHandlers) {
                if (w._allHandlers.hasOwnProperty(id)) {
                    var h = w._allHandlers[id];
                    h.element.detachEvent("on" + h.eventType, h.wrappedHandler);
                    delete w._allHandlers[id];
                }
            }
        };

        var _uid = (function () {
            var _counter = 0;
            return function () { return "h" + _counter++; };
        }());

        return {
            add: function (element, eventType, handler) {
                if (document.addEventListener) {
                    element.addEventListener(eventType, handler, false);
                } else if (document.attachEvent) {
                    if (_find(element, eventType, handler) !== -1) {
                        return;
                    }

                    var wrappedHandler = function (e) {
                        if (!e) {
                            e = window.event;
                        }

                        var event = {
                            _event: e,
                            type: e.type,
                            target: e.srcElement,
                            currentTarget: element,
                            relatedTarget: e.fromElement ? e.fromElement : e.toElement,
                            eventPhase: (e.srcElement === element) ? 2 : 3,

                            clientX: e.clientX, clientY: e.clientY,
                            screenX: e.screenX, screenY: e.screenY,

                            altKey: e.altKey, ctrlKey: e.ctrlKey,
                            shiftKey: e.shiftKey, charCode: e.charCode,
                            keyCode: e.keyCode,

                            stopPropagation: function () { this._event.cancelBubble = true; },
                            preventDefault: function () { this._event.returnValue = false; }
                        };

                        if (Function.prototype.call) {
                            handler.call(element, event);
                        } else {
                            element._currentHandler = handler;
                            element._currentHandler(event);
                            element._currentHandler = null;
                        }
                    };

                    element.attachEvent("on" + eventType, wrappedHandler);

                    var h = {
                        element: element,
                        eventType: eventType,
                        handler: handler,
                        wrappedHandler: wrappedHandler
                    };

                    var d = element.document || element;
                    var w = d.parentWindow;

                    var id = _uid();

                    if (!w._allHandlers) {
                        w._allHandlers = {};
                    }

                    w._allHandlers[id] = h;

                    if (!element._handlers) {
                        element._handlers = [];
                    }

                    element._handlers.push(id);

                    if (!w._onunloadHandlerRegistered) {
                        w._onunloadHandlerRegistered = true;
                        w.attachEvent("onunload", _removeAllHandlers);
                    }
                }
            },

            remove: function (element, eventType, handler) {
                if (document.removeEventListener) {
                    element.removeEventListener(eventType, handler, false);

                } else if (document.detachEvent) {
                    var i = _find(element, eventType, handler);

                    if (i === -1) {
                        return;
                    }

                    var d = element.document || element;
                    var w = d.parentWindow;

                    var handlerId = element._handlers[i];
                    var h = w._allHandlers[handlerId];

                    element.detachEvent("on" + eventType, h.wrappedHandler);
                    element._handlers.splice(i, 1);
                    delete w._allHandlers[handlerId];
                }
            }
            //</source>
        }; //end return object;
    }()),

    /**
     * @function Pete.dom.find
     * @param {String/HTMLElement/Pete.Element} elem
     * @param {String} selector
     * @return {HTMLElement/Boolean}
     * @describe <p>This method finds an ancestor element of <code>elem</code> by interrogating each of its parent elements using the passed selector. Uses <code><a href="#jsdoc">Pete.domQuery</a></code> internally.</p><p>Returns either the found dom element or <code>false</code>.</p>
     * @example
Pete.dom.find("test", "#box3[style$=100px;]");
     */
    //<source>
    find: function (elem, selector) {
        if (!elem || !selector) {
            throw new Error("Failure to provide arguments in method Pete.dom.find");
        }

        elem = Pete.Element.get(elem, true).parentNode;

        while (elem) {
            if (Pete.domQuery.find(elem, selector)) {
                return elem;
            }

            elem = elem.parentNode;
        }

        return false;
    },
    //</source>

    /**
     * @function Pete.dom.insertAfter
     * @param {HTMLElement} newElement
     * @param {HTMLElement} targetElement
     * @return {None}
     * @describe <p>Inserts <code>newElement</code> after <code>targetElement</code> in the DOM.</p>
<p>Use this helper method when not wanting to instantiate a <code><a href="#jsdoc">Pete.Element</a></code> and thereby invoking <code><a href="#jsdoc">Pete.Element.after</a></code>.</p>
     */
    //<source>
    insertAfter: function (newElement, targetElement) {
        var parent = targetElement.parentNode;

        if (parent.lastChild === targetElement) {
            parent.appendChild(newElement);
        } else {
            parent.insertBefore(newElement, targetElement.nextSibling);
        }
    },
    //</source>

    /**
     * @function Pete.dom.insertHtml
     * @param {String} where Where to insert the html in relation to <code>elem</code> - beforeBegin, afterBegin, beforeEnd, afterEnd.
     * @param {HTMLElement} elem
     * @param {String} html
     * @return {HTMLElement}
     * @describe <p>Easily allows for inserting HTML in the document tree.</p>
     * @example
Example:

<ul>
  <li>one</li>
  <li>two</li>
  <li>three</li>
  <li>four</li>
  <li>five</li>
</ul>

What if you need to append text to one of the list items?  innerHTML kills an element's
children, and performing an operation to first retrieve the child node and then append
the new text isn't convenient.

var html = " <strong>hundred</strong>";
Pete.dom.insertHtml("beforeEnd", document.getElementsByTagName("li")[1], html);

So the list becomes:

<ul>
  <li>one</li>
  <li>two <strong>hundred</strong></li>
  <li>three</li>
  <li>four</li>
  <li>five</li>
</ul>

This is a simple example but the concept can easily be grasped.
     */
    //<source>
    insertHtml: function (where, elem, html){
        where = where.toLocaleLowerCase();

        if (elem.insertAdjacentHTML) {
            switch (where) {
                case 'beforebegin':
                    elem.insertAdjacentHTML('BeforeBegin', html);
                    return elem.previousSibling;

                case 'afterbegin':
                    elem.insertAdjacentHTML('AfterBegin', html);
                    return elem.firstChild;

                case 'beforeend':
                    elem.insertAdjacentHTML('BeforeEnd', html);
                    return elem.lastChild;

                case 'afterend':
                    elem.insertAdjacentHTML('AfterEnd', html);
                    return elem.nextSibling;
            }

            throw 'Illegal insertion point -> "' + where + '"';
        }

        var range = elem.ownerDocument.createRange(),
            frag;

        switch (where) {
            case 'beforebegin':
                range.setStartBefore(elem);
                frag = range.createContextualFragment(html);
                elem.parentNode.insertBefore(frag, elem);
                return elem.previousSibling;

            case 'afterbegin':
                if (elem.firstChild) {
                    range.setStartBefore(elem.firstChild);
                    frag = range.createContextualFragment(html);
                    elem.insertBefore(frag, elem.firstChild);
                    return elem.firstChild;

                } else {
                    elem.innerHTML = html;
                    return elem.firstChild;
                }

            case 'beforeend':
                if (elem.lastChild) {
                    range.setStartAfter(elem.lastChild);
                    frag = range.createContextualFragment(html);
                    elem.appendChild(frag);
                    return elem.lastChild;

                } else {
                    elem.innerHTML = html;
                    return elem.lastChild;
                }

            case 'afterend':
                range.setStartAfter(elem);
                frag = range.createContextualFragment(html);
                elem.parentNode.insertBefore(frag, elem.nextSibling);
                return elem.nextSibling;
        }

        throw 'Illegal insertion point -> "' + where + '"';
    },
    //</source>

    /**
     * @function Pete.dom.isTextBox
     * @param {HTMLElement/Pete.Element} elem
     * @return {Boolean}
     * @describe <p>A handy way to quickly determine if an element is a textbox or a textarea.  Useful for string trimming and validation.</p>
     * @example
var oDom = Pete.Element.get(this, true);
if (!Pete.dom.isTextBox(oDom)) return;
oDom.value = Pete.trim(oDom.value);
return this;
     */
    //<source>
    isTextBox: function (elem) {
        elem = Pete.Element.get(elem, true);

        return elem.nodeName.toLocaleLowerCase() === 'input' &&
            elem.type === 'text' ||
            elem.nodeName.toLocaleLowerCase() === 'textarea';
    },
    //</source>

    /**
     * @function Pete.dom.remove
     * @param {String/Array} toRemove Can be either a single HTMLElement to remove or an Array of HTMLElements
     * @return {HTMLElement/Array} - One or more <code>HTMLElements</code>
     * @describe <p>Removes one or more <code>HTMLElements</code> from the DOM and returns the removed element(s).</p>
<p>Use this helper method when not wanting to instantiate a <code><a href="#jsdoc">Pete.Element</a></code> and thereby invoking <code><a href="#jsdoc">Pete.Element.remove</a></code>.</p>
     * @example
var oElems = Pete.dom.remove('test');

var aElems = Pete.dom.remove(['test', 'anotherTest', 'oneMore']);
     */
    //<source>
    remove: function (toRemove) {
        var removedElements,
            elem, i, len;

        if (!toRemove) {
            return false;
        }

        if (typeof toRemove === 'string') {
            elem = $(toRemove);
            if (elem) {
                return elem.parentNode.removeChild(elem);
            }

        } else if (toRemove.constructor === Array) {
            removedElements = [];

            for (i = 0, len = toRemove.length; i < len; i++) {
                elem = $(toRemove[i]);
                if (elem) {
                    removedElements.push(elem.parentNode.removeChild(elem));
                }
            }

            return removedElements;
        }
    },
    //</source>

    //<source>
    removeChildren: function (kids) {
        // Kids can either be an array (remove multiple nodes at once) or an object or a string (only remove one node).
        if (kids.constructor === Array) {
            for (var i = 0, len = kids.length; i < len; i++) {
                $(kids[i]).parentNode.removeChild(elem);
            }
        } else {
            $(kids).parentNode.removeChild(elem);
        }
    },
    //</source>

    /**
     * @function Pete.dom.targetBlank
     * @param {None}
     * @return {Boolean}
     * @describe <p>Mimics the behavior of the deprecated <code>target="_blank"</code>. Assumes that the link that launches a browser to be opened in a new window has a <code>rel</code> attribute set to <code>external</code> or <code>pdf</code>.</p>
     */
    //<source>
    targetBlank: function () {
        var links = document.getElementsByTagName('a'),
            i, len, child;

        for (i = 0, len = links.length; i < len; i++) {
            if (links[i].getAttribute('rel') &&
                links[i].getAttribute('rel') === 'external' ||
                links[i].getAttribute('rel') === 'pdf') {
                    links[i].onclick = function() {
                        child = window.open(this.getAttribute('href'));
                        return !child ? true /*failed to open so follow link*/:
                            false; /*success, open new browser window*/
                    };
            }
        }
    }
    //</source>
};

