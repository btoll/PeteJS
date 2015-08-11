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
 * @function domQuery
 * @param {String} sSelector
 * @param {Pete.Element/HTMLElement/String} oRoot (Optional)
 * @return {Array}
 * @describe <p>Basic DOM CSS Selector engine. Returns an array of HTMLElements.</p><p>Though it's possible to invoke this as a class method, it's preferable to invoke <code><a href="#jsdoc">Pete.Element.gets</a></code> as this will return a composite element.</p>
<p>
The current version of PeteJS supports the following CSS selectors:
<ul>
  <li>Descendant selectors - <code>&quot;div p span&quot;</code></li>
  <li>Child selectors - <code>&quot;div &gt; p &gt; span&quot;</code></li>
  <li>Adjacent sibling selectors - <code>&quot;div + p + span&quot;</code></li>
  <li>Ids - <code>&quot;body#homePage&quot;</code></li>
  <li>Classes (can be chained and in any order) - <code>&quot;p.firstPara.tooltip&quot;</code></li>
  <li>The presence of an HTML attribute - <code>&quot;form#theForm.businessForm input[class]&quot;</code></li>
  <li>Attribute filters:
    <ul>
      <li><code>[class=foo]</code> - "class" exactly equals "foo"</li>
      <li><code>[class&lowast;=foo]</code> - "class" contains "foo"</li>
      <li><code>[class^=foo]</code> - "class" begins with "foo"</li>
      <li><code>[class$=foo]</code> - "class" ends with "foo"</li>
      <li><code>[class!=foo]</code> - "class" does not equal "foo"</li>
    </ul>
  </li>
  <li>Multiple selectors, separated by commas - <code>&quot;form input[name], form textarea[name], form select[name]&quot;</code></li>
</ul>
 * @example
//find all links on a page and give them a gray background;
var cLinks = Pete.Element.gets('a[href]');
cLinks.addClass('grayBackground');

//find all links that are descendants of divs and disable them;
var cLinks = Pete.Element.gets('div a[href]');
cLinks.disable();

//find elements with multiple class names (the order of the class names isn't important);
var cElems = Pete.Element.gets('div ul.topNav li.home.external');

//fine-tune your searches using a dose of classes and ids and attribute selectors;
var cElems = Pete.Element.gets('div#header.page p span#about');

or

//find all anchors that have both an href and a rel attribute within any list item that has a class, etc.;
var cLis = Pete.Element.gets('body div[style].zucchero#theDiv.boo ul li[class=foo] a[rel][href]');
etc.

//collect all form elements for a form submission;
var cElems = Pete.Element.gets('#theForm asterisk[name]'); //NOTE replace the word 'asterisk' with the actual symbol;

//attribute filters;
Pete.Element.gets('body div[class=zucchero boo foobar] ul[id^=someId] li[id][class=blue]');

Pete.Element.gets('div li[class*=too]');
 */
//<source>
Pete.domQuery = (function () {
    // Define all of our variables, including functions, in one statement.
    var aChunksCache = [],
        oParts = null,
        bIEFix = Pete.isIE && !Pete.isIE8,
        // ie6 and ie7 return null for getAttribute('class').
        sClass = bIEFix ? 'className' : 'class',
        // Matches '*[name]', 'div', 'div > li', 'div#theDiv.foobar', 'div > li[id=foo][class=bar]', 'a[href]', 'a:not(span)', etc.
        reChunker = /([>|+]|[a-z0-9_\-.#*]+(?:\([^\)]+\)|\[[^\]]+\])*)/gi,
        reCombinators = /[>+]/,
        sCurrent,
        sBase,

        // Begin function definitions.
        fnIsElementMatched = function (el, oAttr) {
            var b = true,
                o = oAttr,
                i, oFilter, sChar, key, val, x;

            for (i in o) {
                if (o.hasOwnProperty(i)) {
                    switch (i) {
                        case 'has':
                            b = oAttr.has.every(function (sAttr) {
                                return el !== document && el.getAttribute(sAttr);
                            });
                            break;

                        case sClass:
                            if (typeof oAttr[sClass] === 'string') {
                                b = el === document ? false : el.getAttribute(i) === o[i];
                            } else {
                                b = el === document ? false : fnTestClasses(el, oAttr[sClass]);
                            }
                            break;

                        case 'filter':
                            oFilter = o.filter;
                            sChar = oFilter.character;

                            for (x in oFilter) {
                                if (oFilter.hasOwnProperty(x)) {
                                    if (x === 'character') {
                                        continue;
                                    }

                                    key = x;
                                    val = oFilter[x];

                                    switch (sChar) {
                                        case '*': b = el.getAttribute(key) && el.getAttribute(key).indexOf(val) > -1; break;
                                        case '^': b = el.getAttribute(key) && el.getAttribute(key).indexOf(val) === 0; break;
                                        // Reverse each string and compare.
                                        case '$': b = el.getAttribute(key) && el.getAttribute(key).split('').reverse().toString().indexOf(val.split('').reverse().toString()) === 0; break;
                                        case '!': b = !el.getAttribute(key) || el.getAttribute(key) !== val; break;
                                    }

                                    if (!b) {
                                        break;
                                    }
                                }
                            }
                            break;

                        // Catch all other cases, i.e., id='foobar', checked='checked', etc.
                        default:
                            b = el !== document && el.getAttribute(i) && el.getAttribute(i) === o[i];
                    }

                    if (!b) {
                        break;
                    }
                }
            }

            // Return either the element (passed) or false (failed).
            return b ? el : false;
        },

        fnGetElementsByClassName = function (vClassname, vRootElem, sSearchByTag) {
            var cElems, arr = [], bIsString = true;
            if (vRootElem) {
                cElems = Pete.getDom(vRootElem).getElementsByTagName(sSearchByTag || '*');
            } else {
                cElems = document.getElementsByTagName("*") || document.all;
            }

            if (typeof vClassname !== 'string') {
                bIsString = !bIsString;
            }

            Pete.makeArray(cElems).forEach(function (el) {
                if (bIsString) {
                    if ((' ' + el.className + ' ').indexOf(' ' + vClassname + ' ') > -1) {
                        arr.push(el);
                    }
                } else {
                    if (fnTestClasses(el, vClassname)) {
                        arr.push(el);
                    }
                }
            });

            return arr;
        },

        fnChunker = function (str) {
            // Here is what oParts could look like:
            //
            // oParts = {
            //     // Elements with .class or #id selectors will be stored in attr.
            //     attr: {
            //         class: ['foo', 'bar'],
            //         id: 'myID'
            //     },
            //
            //     // Elements with attribute filters, i.e., [class*=foo][id^=bar], will be stored in filter.
            //     filter: {
            //         character: '*',
            //         class: 'blue',
            //         id: 'theForm'
            //     }
            // };
            //
            // The regex matches 'body', 'div#theDiv', 'ul.theList li.foo', 'a[href]', 'li[class=foo]', etc.
            var re = /((?:[>|+]|[a-z*]+|\[[^\]]+\]|[.#][a-z0-9_\-]+))/gi,
                o = {},
                m, s, c, vAttr, sAttr;

            while ((m = re.exec(str)) !== null) {
                s = m[1];
                c = s.charAt(0);

                if (!o.attr) {
                    o.attr = {};
                }

                switch (c) {
                    case '#':
                        o.attr.id = s.substring(1);
                        break;

                    case '.':
                        if (!o.attr[sClass]) {
                            // 'class' is a reserved word!
                            o.attr[sClass] = [];
                        }
                        o.attr[sClass].push(s.substring(1));
                        break;

                    case '[':
                        vAttr = s.replace(/\[([^\]]+)\]/, '$1');

                        // Test for the presence of an attribute filter.
                        if (vAttr.indexOf('=') > -1) {
                            vAttr = vAttr.split('=');

                            if (/[*|\^|$|!]/.test(vAttr[0])) {
                                // If an attribute filter is present...
                                vAttr[0] = vAttr[0].replace(/(\w+)([*|\^|$|!]$)/, function (a, b, c) {
                                    if (!o.attr.filter) {
                                        o.attr.filter = {};
                                    }

                                    if (!o.attr.filter.character) {
                                        // Store the filter (i.e., "*", "^", etc.).
                                        o.attr.filter.character = c;
                                    }

                                    // ...store it as filter['id'] = 'foobar'...
                                    o.attr.filter[b] = vAttr[1];
                                    // ...and remove it from the end of the token.
                                    return a.slice(0, -1);
                                })
                            // Only get here if there're no attribute filters, else we'll get duplicate props i.e.,
                            // {class: 'foo', filter: { class: 'foo'}}.
                            } else {
                                if (Pete.isArray(vAttr)) {
                                    sAttr = vAttr[0];
                                    vAttr = vAttr[1];
                                } else {
                                    // If vAttr is a string then make the vars equal to each other.
                                    sAttr = vAttr;
                                }

                                //IE 6 & 7 need 'class' to be 'className' for HTMLElement.getAttribute() method.
                                if (bIEFix) {
                                    // sClass was already determined above (IE req.).
                                    // ie returns null for getAttribute('class').
                                    sAttr = sAttr === 'class' ? sClass : sAttr;

                                    // sClass was already determined above (IE req.).
                                    // ie returns null for getAttribute('class').
                                    vAttr = vAttr === 'class' ? sClass : vAttr;
                                }
                                o.attr[sAttr] = vAttr;
                            }
                        // Check for just the presence of the attribute, i.e., 'p[id]'.
                        } else {
                            if (vAttr === 'class') {
                                vAttr = sClass;
                            }
                            if (!o.attr.has) {
                                o.attr.has = [];
                            }
                            o.attr.has.push(vAttr);
                        }
                        break;
                    default:
                        o.nodeName = s.toLocaleUpperCase();
                }
            }
            return Pete.isEmpty(o) ? false : o;
        },

        fnChunk = function (str) {
            var oParts = {};
            if (Pete.tags.test(str)) {
                oParts.nodeName = str.toLocaleUpperCase();
            } else {
                oParts = fnChunker(str);
            }
            return oParts;
        },

        fnTestClasses = function (oParent, klasses) {
            var bPassed = true,
                sParentClass = oParent.getAttribute(sClass);

            klasses.forEach(function (sKlass) {
                if ((' ' + sParentClass + ' ').indexOf(' ' + sKlass + ' ') === -1) {
                    // If even one fails then we know the classes don't match.
                    bPassed = !bPassed;
                }
            });

            return bPassed;
        },

        fnGetPreviousSibling = function (o) {
            o = o.previousSibling;

            while (o && o.nodeType !== 1) {
                o = o.previousSibling;
            }

            return o;
        },

        fnCheckCombinator = function (el, combinator) {
            var oParent = oParts.parent;

            // Check that the child's parent (el.parentNode) equals the node name of the parent.
            if (combinator === '>') {
                if (el) {
                    if (oParent.nodeName) {
                        el = el.parentNode && el.parentNode.nodeName === oParent.nodeName ? fnIsElementMatched(el.parentNode, oParent.attr) : false;
                    } else {
                        el = fnIsElementMatched(el.parentNode, oParent.attr) ? el : false;
                    }
                }
            } else if (combinator === '+') {
                el = fnGetPreviousSibling(el);

                if (el) {
                    if (oParent.nodeName) {
                        el = el.nodeName === oParent.nodeName ? el : false;
                    } else {
                        el = fnIsElementMatched(el, oParent.attr) ? el : false;
                    }
                }
            }

            return el;
        },

        fnCheckSelector = function (el, aChunks) {
            var oParent,
                fnGetParts = function (sCurrent) {
                    // If oParts is null it's the first time through, else we already know what it is.
                    // Remember on every subsequent loop the parent becomes the child, so to speak.
                    oParts = !oParts ? fnChunk(sBase) : oParts.parent;
                    oParts.parent = fnChunk(sCurrent);
                    oParent = oParts.parent;
                },
                combinator;

            if (reCombinators.exec(sCurrent)) {
                combinator = sCurrent;
                fnGetParts(aChunks.pop());

                return fnCheckCombinator(el, combinator);
            } else {
                fnGetParts(sCurrent);
                el = el.parentNode;

                if (oParent.nodeName) {
                    while (el && el.nodeName !== oParent.nodeName) {
                        el = el.parentNode;
                    }

                    if (el) {
                        el = fnIsElementMatched(el, oParent.attr);
                    }
                } else {
                    while (el && el.nodeName) {
                        if (!fnIsElementMatched(el, oParent.attr)) {
                            el = el.parentNode;
                        } else {
                            return el;
                        }
                    }
                }

                return el;
            }
        },

        fnNext = function (vResult, aChunks) {
            sBase = sCurrent;
            sCurrent = aChunks.pop();

            // If sCurrent is undefined then aChunks is empty, if vResult is null then something an
            // ancestor specified by the user in the selector isn't true.
            while (sCurrent && vResult && (vResult = fnCheckSelector(vResult, aChunks))) {
                vResult = fnNext(vResult, aChunks);
            }

            return vResult;
        },

        fnReplenish = function (el, aChunks) {
            //aChunks.length = 0;
            aChunks = aChunksCache.concat();
        },

        fnSearch = function (sSelector, oRoot) {
            var aSelector = sSelector.indexOf(',') > -1 ?
                sSelector.split(',') :
                [sSelector],
                aElems = [],
                aKeep = [],
                // Holds all the dom elements that pass muster.
                aPassed = [],
                // Will hold the unique dom elements that are found (the same ones can be found csv selectors).
                aUnique = [];

            aSelector.forEach(function (sSelector) {
                aPassed.push((function () {
                    // 20100517: Changed this to be have function scope. aChunks must now be passed as an argument
                    // function since it's no longer a global var in this execution context. The reason is b/c the
                    // following wasn't being handled correctly (Pete.Element.gets(".notes span, .chords span")).
                    // the aChunks stack wasn't being cleared each time a selector was checked (i.e., selectors are
                    // split on commas).
                    var aChunks = [],
                        aTemp = [],
                        vResult;

                    while (reChunker.exec(sSelector)) {
                        aChunks.push(Pete.trim(RegExp.$1));
                    }

                    oRoot = oRoot ? Pete.Element.get(oRoot, true) : document;
                    sBase = aChunks.pop();

                    // Since aChunks is acting as a stack, it will eventually be depleted so make a copy to "replenish" it as needed.
                    aChunksCache = aChunks.concat();

                    if (Pete.tags.test(sBase)) {
                        aElems = Pete.makeArray(oRoot.getElementsByTagName(sBase));
                    } else {
                        oParts = fnChunk(sBase);

                        if (oParts.attr[sClass]) {
                            aTemp = fnGetElementsByClassName(oParts.attr[sClass], oRoot, oParts.nodeName);
                        } else if (oParts.attr.id) {
                            aTemp.push(document.getElementById(oParts.attr.id));
                        } else {
                            aTemp = Pete.makeArray(oRoot.getElementsByTagName(oParts.nodeName));
                        }

                        aTemp.forEach(function (el) {
                            if (oParts.nodeName && el.nodeName !== oParts.nodeName) {
                                // If the node names don't match we can safely ignore it.
                                return;
                            }

                            if (fnIsElementMatched(el, oParts.attr)) {
                                aElems.push(el);
                            }
                        });

                        aTemp = null;
                        // Reset oParts b/c it needs to be need the first time through the loop below.
                        oParts = null;
                    }

                    // If aChunks is empty just return aElems b/c we know that the selector was composed of only one piece.
                    if (!aChunks.length) {
                        return aElems;
                    }

                    if (aElems.length) {
                        aElems.forEach(function (el) {
                            // The stack is empty...
                            if (!aChunks.length) {
                                // ...so replenish it from the cache.
                                aChunks = aChunksCache.concat();
                            }

                            sCurrent = aChunks.pop();
                            vResult = fnCheckSelector(el, aChunks);

                            if (!vResult) {
                                fnReplenish(el, aChunks);
                            } else {
                                if (aChunks.length) {
                                    if (!fnNext(vResult, aChunks)) {
                                        fnReplenish(el, aChunks);
                                    } else {
                                        aKeep.push(el);
                                    }
                                } else {
                                    aKeep.push(el);
                                }
                            }
                        });
                    }

                    return aKeep;
                }()));
            });

            aPassed.forEach(function (arr) {
                aUnique = aUnique.concat(arr);
            });

            return aUnique.unique();
        };

    return {
        find: function (el, selector) {
//            // This prevents accessing fnChunk more than once when walking up the dom looking for an ancestor element.
//            if (!arguments.callee.chunked) {
//                arguments.callee.attr = fnChunk(selector).attr;
//                arguments.callee.chunked = true;
//            }

            return fnIsElementMatched(el, fnChunk(selector).attr);
        },

        search: function (selector, root) {
            return fnSearch(selector, root);
        }//,

//        testClasses: function (parent, klasses) {
//            return fnTestClasses(parent, klasses);
//        }
    };
}());
//</source>

