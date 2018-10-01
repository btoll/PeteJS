(function () {
    'use strict';

    /**
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
            proto = {},
            name;

        //Pete.Composite = Pete.compose(Pete.Element, Pete.Composite);

        for (name in Element) {
            if (typeof Element[name] === 'function') {
                // TODO: Don't include $compose or else an exception will be thrown when trying to invoke .invoke on a Pete.Element!
                if (name !== '$compose') {
                    Pete.wrap(proto, name);
                }
            }
        }

        Pete.Composite = Pete.compose(proto, {
            /**
             * @function Pete.Composite.$compose
             * @return {None}
             * @describe <p>Constructor. Shouldn't be called directly.</p>
             * To be called whenever a Pete.Composite object is composed.
             */
            //<source>
            $compose: function () {
                this.length = this.elements.length;

                this.el = Pete.compose(Pete.Element, {
                    dom: null
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

                    // TODO: Better way?
                    // We really do our best to not touch any object we don't own, but in this case we have
                    // to stamp on an id (and it's better then creating a _pete object but the Composite or
                    // the Fly isn't the owner).
                    if (!dom.id && !dom._pete) {
                        dom.id = Pete.id();
                    }

                    Element[fn].apply(el, args);
                });

                // Let's support chaining Composite methods.
                return this;
            }
        });
    }());
}());

