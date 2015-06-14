/*
 * PeteJS
 *
 * Copyright (c) 2009 - 2015 Benjamin Toll (benjamintoll.com)
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 */

// Pete.Composite 'inherits' each function from Pete.Element's prototype object.
// Note that each 'inherited' function will return Pete.Composite.invoke() which
// will call each function as a method of Pete.Element.
(function () {
    var Element = Pete.Element,
        obj = {},
        name;

    //Pete.Composite = Pete.compose(Pete.Element, Pete.Composite);

    for (name in Element) {
        if (typeof Element[name] === 'function') {
            Pete.wrap(obj, name);
        }
    }

    Pete.Composite = Pete.compose(obj, {
        /**
         * @function Composite
         * @param {Object} elems A collection of <code>HTMLElements</code>
         * @return {None}
         * @describe <p>Constructor. Shouldn't be called directly.</p>
         */
        //<source>
        init: function (elems) {
            return Pete.compose(Pete.Composite, {
                elements: elems,
                length: elems.length,
                el: Pete.compose(Pete.Element, {
                    dom: null
                })
            });
        },
        //</source>

        /**
         * @function Pete.Composite.getCount
         * @param {None}
         * @return {Number}
         * @describe <p>Returns the number of objects in the Composite.</p>
         */
        //<source>
        getCount: function () {
            return this.elements.length;
        },
        //</source>

        /**
         * @function Pete.Composite.invoke
         * @param {String/HTMLElement} vElem
         * @return {Pete.Element}
         * @describe <p>Constructor. Shouldn't be called directly.</p>
         */
        //<source>
        invoke: function (fn, args) {
            var Element = Pete.Element,
                el = this.el,
                elements = this.elements;

            elements.forEach(function (dom) {
                el.dom = dom;
                Element[fn].apply(el, args);
            });

            // Let's support chaining Composite methods.
            return this;
        }
    });
}());

