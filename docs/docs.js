/*
 * PeteJS
 *
 * Copyright (c) 2009 - 2015 Benjamin Toll (benjamintoll.com)
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 */
Pete.ready(function () {
    // Create the mask and remove once all the scripts have been loaded.
    var //mask = new Pete.ux.Mask(document.body),
        globalSymbol = Pete.globalSymbol,
        // The regex changes 'Array' to 'Pete' and strips '.gets' from 'Pete.Element.gets', for example.
        titleRe = /^(Array)?(.*)\.[^.\W]+$/;

    //mask.show();

    (function () {
        /*first declare all vars and functions*/
        /*save this regex just in case*/
        ///((?:[a-zA-z_\-]*\.)*[a-zA-z_\-]*)\s*[:=]\s*\(?function\s*\([a-zA-Z,\s]*\)/; //matches 'Array.prototype.forEach = function (callback, oOptional)';

        // Set the global symbol to search for.
        var symbol = 'Pete',
            // Set the @tags to search for in the source, i.e., '@param', '@return', etc.
            keywords = ['function', 'property', 'type', 'param', 'return', 'extends', 'mixin', 'events', 'describe', 'example'],
            // This object will hold all of the methods and chunks from each parsed script.
            namespaces = {},
            // This array will hold the method signature constructed from @function and @param, i.e.,
            // 'Pete.dom.attachHandler: function(vElem) { ... }'.
            signature = [],
            fragment = document.createDocumentFragment(),
            // Associative array, holds method name => method source, used for searches.
            source = {},
            arr,

            paintList = function (obj, chunkList) {
                // ex. 'Parameters:'.
                arr.push('<h4>' + obj.name + '</h4>');

                for (var i = 0, iLength = chunkList.length; i < iLength; i++) {
                    arr.push('<ul>');

                    if (chunkList[i].name && chunkList[i].type) {
                        arr.push('<li><code>' + chunkList[i].name + '</code> : ' + chunkList[i].type);
                    } else {
                        arr.push('<li>');

                        // If either is empty it doesn't matter as far as the markup is concerned.
                        arr.push('<code>' + chunkList[i].name + '</code>');
                        arr.push(chunkList[i].type);
                    }

                    if (chunkList[i].description) {
                        arr.push('<p>' + chunkList[i].description + '</p></li>');
                    } else {
                        arr.push('</li>');
                    }

                    arr.push('</ul>');
                }
            },

            map = { //different sections must display differently;
                describe: {
                    name: 'Describe:',
                    template: function (obj, chunk) {
                        arr.push('<h4 id=\'details\'>' + obj.name + '</h4>');
                        arr.push('<div class=\'describe\'>' + chunk.describe[0].description + '</div>');
                    }
                },
                example: {
                    template: function (obj, chunk) {
                        // NOTE the way the regex is written, if the first word consists of alpha characters then it will be
                        // matched by the third subexpression (name) so it's then needed to be added here (aTemp[1]).
                        var aTemp = [];

                        aTemp[0] = '<div class=\'describe\'><pre><code>';
                        aTemp[1] = chunk.example[0].name;
                        aTemp[2] = ' ';
                        aTemp[3] = chunk.example[0].description.invoke('HTMLify');
                        aTemp[4] = '</code></pre></div>';
                        $('example').innerHTML =  aTemp.join('');
                    }
                },
                'function': {
                    template: function (obj, chunk) {
                        var arr = [],
                            method = chunk['function'][0].name,
                            i, len, titleHref, titleText;

                        for (i = 0, len = chunk.param.length; i < len; i++) {
                            arr.push(chunk.param[i].name);
                        }

                        // If there's no period in the function name then append the global symbol. Also, wrap the method name
                        // in a link so the user can click it and go directly to the source.
                        if (method.indexOf('.') === -1) {
                            titleText = titleHref = signature[0] = globalSymbol + '.' + method;
                        } else {
                            titleText = signature[0] = method;
                            titleHref = method.replace(titleRe, function (a, $1, $2) {
                                // Match will either be 'Array' or undefined. Swap out 'Array' for 'Pete' to build the href.
                                // Note that if $1 is undefined then method already contains 'Pete' so just return an empty string.
                                $1 = $1 ? 'Pete' : '';
                                return $1 + $2;
                            });
                        }

                        $('title').innerHTML = ['<a href="../src/', titleHref, '.js" target="_blank">', titleText, '</a>'].join('');

                        signature[1] = method.indexOf('prototype') === -1 ? ':' : ' = ';
                        signature[2] = ' function (';
                        signature[3] = arr.join(', ');
                        // This will be inserted via innerHTML in displayItem.
                        signature[4] = ') { ... }';
                    }
                },
                'property': {
                    template: function (obj, chunk) {
                        var arr;

                        signature.length = 0;
                        signature.push(chunk.type[0].name);
                        $('title').innerHTML = chunk.property[0].name;

                        if (chunk.describe) {
                            arr = [];

                            arr[0] = '<div class="describe"><pre><code>';
                            arr[1] = chunk.describe[0].name;
                            arr[2] = ' ';
                            arr[3] = chunk.describe[0].description.invoke('HTMLify');
                            arr[4] = '</code></pre></div>';
                            $('description').innerHTML =  arr.join('');
                        }
                    }
                },
                param: {
                    name: 'Parameters:',
                    template: paintList
                },
                'return': {
                    name: 'Returns:',
                    template: paintList
                },
                'extends': {
                    name: 'Extends:',
                    template: paintList
                },
                'mixin': {
                    name: 'Mixin:',
                    template: paintList
                },
                events: {
                    name: 'Events:',
                    template: paintList
                }
            },

            ul = {},
            // Remember the elements between invocations.
            link = {},
            // Display all the info for each link that will appear in the tabs.
            displayItem = function (e) {
                // Rel could be "external" or "example", maybe others.
                if (e.target.rel) {
                    if (e.target.rel === 'external') {
                        location.href = e.target.href;
                    }

                    // End if the link isn't in the menu tree, a special link in the api or a link in the search form results.
                    return false;
                }

                var target = e.target,
                    innerHTML = target.innerHTML,
                    jsdoc,
                    chunk,
                    i,
                    s,
                    // Links in the menubar and links in the search list have different target objects.
                    doExpand = function () {
                        var list = Pete.Element.get(ul),
                            href = Pete.Element.get(link);

                        // Close every list except for the one that was clicked on.
                        Pete.Element.gets('#tree > li > a + ul[id!=' + ul.id + ']').replaceClass('hide', 'show');
                        Pete.Element.gets('#tree > li > a').replaceClass('expand', 'contract');

                        if (list.hasClass('hide')) {
                            list.replaceClass('show', 'hide');
                            href.replaceClass('contract', 'expand');
                        } else {
                            list.replaceClass('hide', 'show');
                            href.replaceClass('expand', 'contract');
                        }
                    },

                    howMany = function (innerHTML) {
                        var s;

                        switch (Pete.util.howMany(innerHTML, '.')) {
                            case 1: s = innerHTML.slice(innerHTML.indexOf('.') + 1); break;
                            case 2: s = innerHTML.slice(0, innerHTML.lastIndexOf('.')); break;
                            case 0: return innerHTML;
                        }

                        return s;
                    },

                    getJSDoc = function (innerHTML) {
                        var v, p;

                        try {
                            v = $(innerHTML).jsdoc;
                            // If we get here try to access an object property (remember if $(innerHTML) resolves to an actual
                            // HTMLElement but does not have a jsdoc property we could still get here b/c "undefined" wouldn't
                            // throw an error, but trying to access a property on the undefined data type would throw an error).
                            p = v.chunk;
                        } catch (e) {
                            v = $(howMany(innerHTML)).jsdoc;
                        }

                        return v;
                    };

                // Only target the links within each 'header'.
                if (target.nodeName.toLocaleLowerCase() === 'a' && target.className.indexOf('expand') === -1 && target.className.indexOf('contract') === -1) {
                    // Remove the 'selected' classname from $('tree') and then add it to the current <a>.
                    // Remove the selected class from any element that may have it.
                    Pete.Element.gets('#tree a').removeClass('selected');

                    if (target.href.indexOf('#jsdoc') === -1) {
                        // Only give the target the selected class if it's not a #jsdoc link.
                        target.className = 'selected';
                    }

                    // To be safe remove any text in case the current method doesn't have its @example flag set.
                    $('example').innerHTML = '';

                    // If target.jsdoc is null, the link was clicked in the api (i.e., in the description of a method) so lookup
                    // the jsdoc object using innerHTML (and if that fails use howMany to get just the namespace we need).
                    jsdoc = target.jsdoc || getJSDoc(innerHTML);
                    // Paint the Description tab.
                    if (jsdoc.chunk) {
                        chunk = jsdoc.chunk;
                        arr = [];

                        // To be filled in by map['function'.template(), ex. 'Array.prototype.forEach = function (callback, oOptional) { }'.
                        arr.push('<h1 id="methodSignature"></h1>');

                        for (i in chunk) {
                            if (chunk.hasOwnProperty(i)) {
                                // Some of the @keywords in keywords don't have a template so filter them out.
                                if (map[i]) {
                                    // Functions are varargs.
                                    map[i].template(map[i], chunk, chunk[i]);
                                }
                            }
                        }

                        $('description').innerHTML = arr.join('');
                        $('source').innerHTML = '<div><pre><code>' + jsdoc.source + '</code></pre></div>';
                        $('methodSignature').innerHTML = signature.join('');
                        Pete.Element.fly('response').replaceClass('show', 'hide');
                    }
                }

                // Expand the menu and highlight the method.
                switch (true) {
                    // Only target the 'header' links. Also, trim the classname or it won't match (i.e., ' contract' won't match).
                    case ['expand', 'contract'].contains(Pete.trim(target.className)):
                        ul = target.nextSibling;
                        link = target;
                        doExpand();
                        break;

                    // If the link has a namespace property then we know it's a link from a search.
                    case !!target.namespace:
                        ul = $(target.namespace);
                        link = ul.previousSibling;

                        // Don't expand if user clicked on a method in a module that's already been expanded.
                        if (['hide'].contains(ul.className)) {
                            doExpand();
                        }

                        $(innerHTML).className = 'selected';
                        break;

                    case target.href && target.href.indexOf('#jsdoc') > -1:
                        // Determine how many periods (namespaces) are in the text.
                        s = howMany(innerHTML) || s;

                        // First we must target a <ul> to expand it, so if s doesn't map to a <ul> we know to prefix it with 'Pete'
                        // which will map to a <ul> (this happens in cases where the <ul id='Pete.domQuery'> and <a id='domQuery').
                        ul = !$(s) || $(s).nodeName !== 'UL' ? $('Pete.' + s) : $(s);

                        if (ul.nodeName !== 'UL') {
                            ul = $('Pete');
                        }

                        link = ul.previousSibling;

                        // Don't expand if user clicked on a method in a module that's already been expanded.
                        if (['hide'].contains(ul.className)) {
                            doExpand();
                        }

                        // Do the opposite check as what we did previously when applying the classname.
                        s = !$(s) || $(s).nodeName !== 'A' ? innerHTML : s;
                        $(s).className = 'selected';
                        break;
                }

                // Remove any 'selected' classname from the search list.
                Pete.Element.gets('#searchList a').removeClass('selected');

                if (e.preventDefault) {
                    e.preventDefault();
                } else {
                    return false;
                }
            },

            search = function (e) {
                if ($('search').value !== '') {
                    var searchStr = $('search').value,
                        searchBy = $('searchBy').value,
                        fragment = document.createDocumentFragment(),
                        createListItem = function (obj, method) {
                            return Pete.Element.create({tag: 'li',
                                items: [
                                    Pete.Element.create({tag: 'a',
                                            attr: {
                                                href: '#',
                                                innerHTML: method,
                                                // To open the appropriate menubar.
                                                namespace: obj.namespace,
                                                // Attach the meat and potatoes.
                                                jsdoc: obj.jsdoc
                                            }
                                        })
                                    ]
                                });
                        },
                        i;

                    for (i in source) {
                        if (source.hasOwnProperty(i)) {
                            switch (searchBy) {
                                case 'source':
                                    if (source[i].source.indexOf(searchStr) !== -1) {
                                        fragment.appendChild(createListItem(source[i], i).dom);
                                    }
                                    break;

                                case 'method':
                                    if (i.indexOf(searchStr) !== -1) {
                                        fragment.appendChild(createListItem(source[i], i).dom);
                                    }
                            }
                        }
                    }

                    $('searchList').className = 'show';
                    $('searchList').innerHTML = '';

                    if (fragment.childNodes.length > 0) {
                        $('searchList').appendChild(fragment);
                    } else {
                        $('searchList').appendChild(Pete.Element.create({tag: 'li', attr: {innerHTML: 'No items found.'}}).dom);
                    }

                    // Finally, delegate the listener.
                    Pete.Element.fly('searchList').on('click', displayItem);
                }

                e.preventDefault();
            },

            listBuilder = function (arr, obj) {
                var namespace = obj.namespace,
                    i, len, newElem, abbreviatedMethod, method;

                // Let's sort since the methods can be defined in the source in any order.
                arr.sort(function (a, b) {
                    var s1 = a.chunk.function && a.chunk.function[0].name,
                        s2 = b.chunk.function && b.chunk.function[0].name;

                    if (s1 < s2) {
                        return -1;
                    } else if (s1 > s2) {
                        return 1;
                    } else {
                        return 0;
                    }
                });

                Pete.Element.create({tag: 'li',
                    items: [
                        // Create the top-level <a> that will open/close the menu.
                        Pete.Element.create({tag: 'a',
                            attr: {
                                href: '#',
                                cls: 'expand',
                                innerHTML: namespace
                            }
                        }),

                        // Create the <ul> to which we'll append each <a>method</a>.
                        Pete.Element.create({tag: 'ul',
                            attr: {
                                id: namespace,
                                cls: 'hide'
                            }
                        })
                    ],
                    parent: 'tree'
                });

                for (i = 0, len = arr.length; i < len; i++) {
                    //method = arr[i].chunk['function'][0].name;
                    abbreviatedMethod = '';

                    if (arr[i].chunk['function']) {
                        method = arr[i].chunk['function'][0].name;
                        // Capture all functions and properties and their source (for searches).
                        source[arr[i].chunk['function'][0].name] = {source: arr[i].source, jsdoc: arr[i], namespace: namespace};
                    } else if (arr[i].chunk.property) {
                        method = arr[i].chunk.property[0].name;
                        source[arr[i].chunk.property[0].name] = {source: arr[i].source, jsdoc: arr[i], namespace: namespace};
                    }

//                    ['function', 'property'].forEach(function (value) {
//                        method = arr[i].chunk[value][0].name;
//
//                        // Capture all functions and properties and their source (for searches).
//                        source[arr[i].chunk[value][0].name] = {source: arr[i].source, jsdoc: arr[i], namespace: namespace};
//                    });

                    // If the object the method is in is the same as namespace, then chop off the namespace from @function,
                    // i.e., method above will contain 'Pete.ready' so chop off 'Pete.dom.' else just use method as is
                    // (i.e., 'Array.prototype.forEach'); the point is to allow for function names that are named other than
                    // what is expected. Also, make sure the namespace !== the method, otherwise, Pete.Element doesn't show
                    // up if it's contained w/in Pete.Element.js.
                    if (method.indexOf(namespace) !== -1 && method !== namespace) {
                        abbreviatedMethod = method.substring(namespace.length + 1);
                    }

                    newElem = Pete.Element.create({tag: 'li',
                        items: [
                            Pete.Element.create({tag: 'a',
                                attr: {
                                    href: obj.url,
                                    id: method,
                                    // In the case of 'Pete.Element' or 'Pete.Composite', abbreviatedMethod will be undefined so use method.
                                    innerHTML: abbreviatedMethod || method,
                                    // Attach the meat and potatoes.
                                    jsdoc: arr[i]
                                }
                            })
                        ]
                    });

                    fragment.appendChild(newElem.dom);
                }

                // Finally, ppend fragment to the <ul>.
                $(namespace).appendChild(fragment);
            },

            scripts = document.getElementsByTagName('script'),
                i, len;
            // End variable declaration block.

        for (i = 0, len = scripts.length; i < len; i++) (function (script) {
            // Only parse if they contain a src attribute (so we know they're linking to an external file) and the global
            // symbol is contained in the url.
            if (script.src && script.src.indexOf(symbol) !== -1) {
                var url = script.src,
                    // i.e., 'Pete.Element', 'Pete.dom', etc.
                    namespace = script.src.replace(new RegExp('.*(' + symbol + '.*)\\.js'), '$1');

                Pete.ajax.load({
                    url: url,
                    success: function (sResponse) {
                        var x,
                            //var re = /\/\*\*(?:\n|\r\n){1}(.|\n|\r\n)*?<\/source>/g; //matches /** ... </source>;
                            // Matches /** ... </source>,
                            re = /\/\*\*(?:\r\n){1}(.|\r\n)*?<\/source>/g,
                            // Store each match.
                            chunks = [],
                            i, len, chunk, source, getChunks, rePattern;

                        // Each namespace will be a property whose value will be an array of key/value pairs ('method' and 'chunk').
                        namespaces[namespace] = [];

                        // Load up each chunk.
                        while ((x = re.exec(sResponse))) {
                            chunks.push(x[0]);
                        }

                        for (i = 0, len = chunks.length; i < len; i++) {
                            chunk = chunks[i];
                            //source = chunk.match(/<source>((.|\n|\r\n)*)\/\/<\/source>/)[1];
                            // Get the source code.
                            source = chunk.match(/<source>((.|\r\n)*)\/\/<\/source>/)[1];
                            getChunks = [];
                            if (new RegExp('@' + keywords.join('|')).test(chunk)) {
                                //var rePattern = new RegExp("@(" + keywords.join("|") + ")\\s*(?:{(.*?)})?(?:\\s*\\b(\[a-zA-Z\.]*)\\b\\s*)?((.|\\n|\\r\\n)*?)\\*", "g");
                                rePattern = new RegExp('@(' + keywords.join('|') + ')\\s*(?:{(.*?)})?(?:\\s*\\b(\[a-zA-Z0-9\.]*)\\b\\s*)?((.|\\r\\n)*?)\\*', 'g');

                                // Extract each keyword's stuff.
                                while ((x = rePattern.exec(chunk))) {
                                    if (!getChunks[x[1]]) {
                                        // Create arrays on-the-fly.
                                        getChunks[x[1]] = [];
                                    }

                                    getChunks[x[1]].push({type: x[2] || '', name: x[3] || '', description: x[4] || ''});
                                }
                            }

                            namespaces[namespace].push({chunk: getChunks, source: source});
                        }

                        // Each <script> found gets its own list.
                        listBuilder(namespaces[namespace], {namespace: namespace, url: url});
                    }
                });
            }
        }(scripts[i]));

        setTimeout(function () {
            //Pete.ux.Tabs();
            Pete.dom.targetBlank();
            Pete.Element.fly('searchForm').on('submit', search);

            if (location.hash) {
                var e = {
                    target: {
                        nodeName: 'A',
                        // Chop off the '#'.
                        innerHTML: location.hash.slice(1),
                        href: '#jsdoc',
                        cls: ''
                    }
                };

                displayItem(e);
            }

            if (Pete.isIE) {
                // Kills the nasty background image flicker bug in ie6.
                document.execCommand('BackgroundImageCache', false, true);
            }

            //mask.hide();
        }, 1000);

        // Let's use event delegation.
        Pete.Element.get('tree').on('click', displayItem);
        Pete.Element.get('.Pete_Tabs').on('click', displayItem);
    }());
});

