/*
 * PeteJS
 *
 * Copyright (c) 2009 - 2015 Benjamin Toll (benjamintoll.com)
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 */

"use strict";

/**
 * @function Template
 * @param {String} html A tokenized string of HTML that will define the template
 * @return {None}
 * @describe <p>Constructor.</p>
<p><a href="http://jslite.benjamintoll.com/examples/template.php" rel="external">See an example</a></p>
 */
//<source>
Pete.Template = {
//</source>

    /**
     * @property Pete.Template.re
     * @type RegExp
     * @describe <p>Constant. The regular expression against which the Template is applied.</p>
     */
    //<source>
    re: /\{(\w+)\}/g,
    //</source>

    $compose: function () {
        var html = this.html;

        if (Pete.isArray(html)) {
            this.html = html.join('');
        }
    },

    /**
     * @function Pete.Template.append
     * @param {HTMLElement/Pete.Element} elem
     * @param {Object/Array} values An object literal or an array, will contain a map for the tokens
     * @return {None}
     * @describe <p>Appends the Template to the element referenced by <code>elem</code>. <code>values</code> will contain a map for the tokens.</p>
     */
    //<source>
    append: function (elem, values) {
        Pete.dom.insertHtml('beforeEnd', Pete.Element.get(elem, true), this.mixin(values));
    },
    //</source>

    /**
     * @function Pete.Template.apply
     * @param {Object/Array} values An object literal token map or an array
     * @return {String}
     * @describe <p>Returns the Template (a <code>String</code>) with the values specified by <code>values</code> for the tokens.</p>
     */
    //<source>
    apply: function (values) {
        return this.html.replace(this.re, function (a, b) {
            return values[b];
        });
    },
    //</source>

    //<source>
    init: function (html) {
    }
    //</source>
};

