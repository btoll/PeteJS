/*
 * PeteJS
 *
 * Copyright (c) 2009 - 2015 Benjamin Toll (benjamintoll.com)
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 */

"use strict";

Pete.util = (function () {
    var reAddCommas = /(\d+)(\d{3})/,
        reCamelCase = /([a-zA-Z0-9])([a-zA-Z0-9]*)[_|\-|\.|\s]([a-zA-Z0-9])/g,
        // Replace all . or _ or - with a space and then capitalize the first letter of each word.
        reCapFirstLetter = /[\s|_|\-|\.](\w)/g,
        reEntify = /(&.+?;)/g,
        reGetStyle = /(.*)([A-Z].*)/,
        reHTMLify = /[<">&]/g,
        reRange = /(\-?\w+)(\.{2,3})(\-?\w+)/,
        // Non-capturing, non-greedy.
        reStripTags = /<(?:.|\n)+?>/g;

    return {
        /**
         * @function Pete.util.addCommas
         * @param {Number/String} format The number to be formatted with commas.
         * @return {String}
         * @describe <p>Accepts a <code>Number</code> or a <code>String</code> and formats it with commas, i.e. <code>3,456,678</code>.</p><p>Note that it's returned as a <code>String</code> because it may contain a comma and <code>parseInt()</code> gives up when it sees a character that doesn't evaluate to a number.</p>
         */
        //<source>
        addCommas: function (format) {
            var str = format + '';

            while (reAddCommas.test(str)) {
                str = str.replace(reAddCommas, '$1,$2');
            }

            // Can't return as a number b/c it could contain commas and parseInt() gives up when it sees a comma.
            return str;
        },
        //</source>

        /**
         * @function Pete.util.camelCase
         * @param {String} str
         * @return {String}
         * @describe <p>Searches the <code>String</code> for an instance of a period (.), underscore (_), whitespace ( ) or hyphen (-) in a word and removes it, capitalizing the first letter of the joined text.</p>
         * @example
    document.write('This old Farm.land Boy-oh_boy'.camelCase());

    writes:

    This old farmLand boyOhBoy
         */
        //<source>
        camelCase: function (str) {
            return str.replace(reCamelCase, function (a, b, c, d) {
                return b.toLocaleLowerCase() + c + d.toLocaleUpperCase();
            });
        }.assert(String),
        //</source>

        /**
         * @function Pete.util.capFirstLetter
         * @param {String} str
         * @return {String}
         * @describe <p>Replaces every period (.), underscore (_) and hyphen (-) with a space ( ) and then capitalizes the first letter of each word.</p>
         */
        //<source>
        capFirstLetter: function (str) {
            str = str.replace(reCapFirstLetter, function (a, b) {
                return " " + b.toLocaleUpperCase();
            });

            return str.charAt(0).toLocaleUpperCase() + str.slice(1);
        }.assert(String),
        //</source>

        /**
         * @function Pete.util.entify
         * @param {String} str
         * @return {String}
         * @describe <p>Replaces HTML entities with their respective characters.</p><p>Essentially, the opposite of <code><a href="#jsdoc">Pete.util.HTMLify</a></code>.</p>
         * @example
      Pete.ajax({
        url: sURL,
        data: "xml",
        type: "POST",
        async: false,
        onSuccess: function (xmlResponse) {
          Pete.getDom('myDiv').innerHTML = xmlResponse.entify();
        }
      });
         */
        //<source>
        entify: function () {
            var chars = {
                '&lt;': '<',
                '&gt;': '>',
                '&quot;': '"',
                '&#034;': '"',
                '&amp;': '&'
            };

            return this.replace(reEntify, function (a, b) { //non-greedy, matches html entities (both names and numbers);
                return typeof chars[b] === 'string' && chars[b] ? chars[b] : a;
            });

            //NOTE that if viewing this via HTML the regular expression will convert it's entities to HTML.
            // Please view the source.
        }.assert(String),
        //</source>

        /**
         * @function Pete.util.getOffsetX
         * @param {HTMLElement} elem
         * @return {Number}
         */
        //<source>
        getOffsetX: function (elem) {
            return elem.offsetParent ?
                elem.offsetLeft + arguments.callee(elem.offsetParent) :
                elem.offsetLeft;
        },
        //</source>

        /**
         * @function Pete.util.getOffsetY
         * @param {HTMLElement} elem
         * @return {Number}
         */
        //<source>
        getOffsetY: function (elem) {
            return elem.offsetParent ?
                elem.offsetTop + arguments.callee(elem.offsetParent) :
                elem.offsetTop;
        },
        //</source>

        /**
         * @function Pete.util.getStyle
         * @param {HTMLElement} elem
         * @param {String} name The CSS property name.
         * @return {Number}
         * @describe <p>Gets the computed value of the queried style.</p>
         */
        //<source>
        getStyle: function (elem, name) {
            var s;

            // If the property exists in style[] then it's been set recently and is current.
            if (elem.style[name]) {
                return elem.style[name];

            // Otherwise try the w3c's method.
            } else if (document.defaultView && document.defaultView.getComputedStyle) {
                // It uses the traditional 'text-align' style of rule writing instead of 'textAlign'.
                name = name.replace(reGetStyle, function (a, b, c) {
                    return b + '-' + c.toLocaleLowerCase();
                });

                // Get the style object and get the value of the property if it exists.
                s = document.defaultView.getComputedStyle(elem, '');

                return s && s.getPropertyValue(name);
            // Otherwise, try to use IE's method.
            } else if (elem.currentStyle) {
                return elem.currentStyle[name];
            // Otherwise, we're using some other browser.
            } else {
                return null;
            }
        },
        //</source>

        /**
         * @function Pete.util.getX
         * @param {EventObject} e
         * @return {Number}
         * @describe <p>Returns the X coordinate of the queried element in the viewport.</p>
         */
        //<source>
        getX: function (e) {
            // Check for the non-IE position, then the IE position.
            return e.pageX || e.clientX + document.body.scrollLeft;
        },
        //</source>

        /**
         * @function Pete.util.getY
         * @param {EventObject} e
         * @return {Number}
         * @describe <p>Returns the Y coordinate of the queried element in the viewport.</p>
         */
        //<source>
        getY: function (e) {
            // Check for the non-IE position, then the IE position.
            return e.pageY || e.clientY + document.body.scrollTop;
        },
        //</source>

        /**
         * @function Pete.util.howMany
         * @param {String} haystack The string to search
         * @param {String} needle The part to search for
         * @return {Number}  * @describe <p>Returns how many times <code>needle</code> occurs in the given <code>haystack</code>.</p>
         */
        //<source>
        howMany: function (haystack, needle) {
            var i = 0,
                pos = haystack.indexOf(needle);

            while (pos > -1) {
                pos = haystack.indexOf(needle, pos + 1);
                i++;
            }

            return i;
        },
        //</source>

        /**
         * @function Pete.util.HTMLify
         * @param {String} str
         * @return {String}
         * @describe <p>Replaces <">& with its respective HTML entity.</p><p>This allows the developer to display HTML in the page rather than having the browser render it.</p><p>Essentially, the opposite of <code><a href="#jsdoc">Pete.util.entify</a></code>.</p>
         * @example
      Pete.ajax({
        url: sURL,
        data: 'html',
        type: 'POST',
        async: false,
        onSuccess: function (sResponse) {
          Pete.getDom('myDiv').innerHTML = sResponse.HTMLify();
        }
      });
         */
        //<source>
        HTMLify: function (str) {
            var oChars = {
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                '&': '&amp;'
            };

            return str.replace(reHTMLify, function (a) {
                return oChars[a];
            });
        }.assert(String),
        //</source>

        /**
         * @function Pete.util.range
         * @param {String} range
         * @return {Array}
         * @describe <p>Inspired by Ruby's <code>range</code> method. Since this method is based on Ruby's implementation, the syntax and functionality is very similar.</p>
    <p>This method will return both numeric and alphabetical arrays. The beginning range element must always be smaller than the ending range element. Note that even though numeric ranges are passed to the method as a string data type, i.e., "1..100", the array returned will contain numeric elements. Alphabetical ranges will of course return an array of strings.</p><p>Just as in Ruby, the ".." range is inclusive, while the "..." range is exclusive.</p>
    <ul>
      <li>Pete.range('-52..-5') //returns an array containing elements -52 through -5, <em>including</em> -5;</li>
      <li>Pete.range('-52...-5') //returns an array containing elements -52 through -5, <em>excluding</em> -5;</li>
      <li>Pete.range('-5..-52') //throws an exception;</li>
      <li>Pete.range('a..z') //returns an array containing elements 'a' through 'z', <em>including</em> 'z';</li>
      <li>Pete.range('A...Z') //returns an array containing elements 'A' through 'Z', <em>excluding</em> 'Z';</li>
      <li>Pete.range('E..A') //throws an exception;</li>
    </ul>
         * @example
    var iTemp = 72;
    switch (true) {
      case Pete.range('-30..-1').contains(iTemp):
        console.log('Sub-freezing');
        break;

      case Pete.range('0..32').contains(iTemp):
        console.log('Freezing');
        break;

      case Pete.range('33..65').contains(iTemp):
        console.log('Cool');
        break;

      case Pete.range('66..95').contains(iTemp):
        console.log('Balmy');
        break;

      case Pete.range('96..120').contains(iTemp):
        console.log('Hot, hot, hot!');
        break;

      default:
        console.log('You must be very uncomfortable, wherever you are!');
    }

    //logs 'Balmy';

    -----------------------------------------------------------------------------

    //create and return the alphabet as a string;
    Pete.range("A..Z").join("");
         */
        //<source>
        range: function (range) {
            var chunks = reRange.exec(range),
                arr = [],
                isNumeric = chunks[1] === "0" || !!Number(chunks[1]),
                begin,
                end,
                i;

            if (reRange.test(range)) {
                //NOTE !!(Number("0") evaluates to falsy for numeric ranges so specifically check for this condition.
                // Re-assign the value of range to the actual range, i.e., ".." or "...".
                range = chunks[2];

                // If it's a numeric range cast the string into a number else get the Unicode value of the letter for alpha ranges.
                begin = isNumeric ? Number(chunks[1]) : chunks[1].charCodeAt();
                end = isNumeric ? Number(chunks[3]) : chunks[3].charCodeAt();

                // Establish some exceptions.
                if (begin > end) {
                    throw new Error('The end range cannot be smaller than the start range.');
                }

                if (isNumeric && (end - begin) > 1000) {
                    throw new Error('The range is too large, please narrow it.');
                }

                for (i = 0; begin <= end; i++, begin++) {
                    // If it's an alphabetical range then turn the Unicode value into a string (number to a string).
                    arr[i] = isNumeric ? begin : String.fromCharCode(begin);
                }

                if (range === '...') {
                    // If the range is exclusive, lop off the last index.
                    arr.splice(-1);
                }

                return arr;
            }
        },
        //</source>

        /**
         * @function Pete.util.stripTags
         * @param {String} str
         * @return {String}
         * @describe <p>Removes all <code>HTML</code> tags from a <code>String</code>.</p>
         */
        //<source>
        stripTags: function (str) {
            return str.replace(reStripTags, '');
        }.assert(String),
        //</source>

        /*
          timestamp: function (oDate) {

            var iHour = oDate.getHours,
              sPeriod = iHour < 12 ? " a.m. EST" : " p.m. EST";

            return "last updated at " + this.getHours(iHour) +
              ":" + this.getMinutes(oDate.getMinutes()) + sPeriod;

          }
        */
    };
}());

