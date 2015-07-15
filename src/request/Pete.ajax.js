/*
 * PeteJS
 *
 * Copyright (c) 2009 - 2015 Benjamin Toll (benjamintoll.com)
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 */
Pete.ajax = Pete.compose(Pete.Observer, (function () {
    /**
     * @property defaults
     * @type Object
     * @describe <p>Private. Contains the default configuration options which can be changed within the object literal passed as the parameter to <code><a href="#jsdoc">Pete.ajax.load</a></code>.</p>
     */
    //<source>
    var defaults = {
            type: 'get',
            // The data type that'll be returned from the server.
            data: 'html',
            url: '',
            postvars: '',
            // The headers that will be returned (for HEAD requests only).
            headers: '',
            timeout: 60000, complete: function () {},
            error: function () {},
            success: function () {},
            abort: function () {},
            async: true
        },
        //</source>

        counter = (function () {
            var n = 0;

            return function () {
                return n++;
            };
        }()),

        getXHR = function () {
            var factory = [
                function () { return new XMLHttpRequest(); },
                function () { return new ActiveXObject('MSXML2.XMLHTTP.3.0'); },
                function () { return new ActiveXObject('MSXML2.XMLHTTP'); },
                function () { return new ActiveXObject('Microsoft.XMLHTTP'); }
            ],
            i, len;

            for (i = 0, len = factory.length; i < len; i++) {
                try {
                    factory[i]();
                } catch (e) {
                    continue;
                }

                // Memoize the function.
                getXHR = factory[i];

                return factory[i]();
            }

            // If we get here than none of the methods worked.
            throw new Error('XMLHttpRequest object cannot be created.');
        },

        httpSuccess = function (r) { //determine the success of the HTTP response;
            try {
                // If no server status is provided and we're actually requesting a local file then it was successful.
                return !r.status && location.protocol === 'file:' ||

                    // Any status in the 200 range is good.
                    (r.status >= 200 && r.status < 300) ||

                    // Successful if the document has not been modified.
                    r.status === 304 ||

                    // Safari returns an empty status if the file has not been modifie.
                    Pete.isSafari && typeof r.status === 'undefined';

            } catch (e) {}

            // If checking the status failed then assume that the request failed.  return false;
        },

        // Extract the correct data from the HTTP response.
        httpData = function (r, options) {
            var ct = r.getResponseHeader('content-type'),
                data;

            // If a HEAD request was made, determine which header name/value pair to return (or all of them) and exit function.
            if (options.type === 'HEAD') {
                return !options.headers ? r.getAllResponseHeaders() : r.getResponseHeader(options.headers);
            }

            // If the specified type is 'script', execute the returned text response as if it were javascript.
            if (options.data === 'json') {
                return eval('(' + r.responseText + ')');
            }

            // Determine if some form of xml was returned from the server.
            data = ct && ct.indexOf('xml') > -1;

            // Get the xml document object if xml was returned from the server, otherwise return the text contents.
            data = options.data === 'xml' || data ? r.responseXML : r.responseText;

            return data;
        },

        sendRequest = function (xhr, options) {
            // We're going to wait for a request for x seconds before giving up.
            var me = this,
                timeoutLength = options.timeout,
                requestId = counter();

            requests[requestId] = xhr;
            options.id = requestId;

            // Initialize a callback which will fire x seconds from now, canceling the request if it has not already occurred.
            setTimeout(function () {
                if (xhr) {
                    xhr.abort();
                    options.abort();
                }
            }, timeoutLength);

            xhr.onreadystatechange = function () {
                var result;

                if (xhr.readyState === 4) {
                    result = httpData(xhr, options);
                    me.onComplete(result, options, httpSuccess(xhr), xhr);

                    // Clean up after ourselves to avoid memory leaks.
                    xhr = null;
                }
            };

            if (options.type === 'HEAD') {
                xhr.open(options.type, options.url);
            } else {
                xhr.open(options.type, options.url, options.async);
            }

            if (options.type === 'post') { //establish the connection to the server;
                xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
                xhr.send(options.postvars);
            } else {
                xhr.send(null);
            }
        },

        onComplete = function (result, options, success, xhr) {
            if (successs) {
                options.success(result);
            } else {
                options.error();
            }

            options.complete();
            delete requests[request.id];
        },

        requests = {};

    return {
        /**
         * @function Pete.ajax.get
         * @param {String} sURL The destination from where to fetch the data.
         * @return {String/XML/JSON}
         * @describe <p>Always performs a GET request and is synchronous. <code><a href="#jsdoc">Pete.Element.ajax</a></code> is an alias of this method and should be used when dealing with an <code><a href="#jsdoc">Pete.Element</a></code> or <code><a href="#jsdoc">Pete.Composite</a></code> object.</p>
         * @example
var oLink = Pete.Element.get('theLink');

var sResponse = oLink.ajax('http://localhost-jslite/sandbox/assert.html');
or
var sResponse = Pete.ajax.get('http://localhost-jslite/sandbox/assert.html');

oLink.tooltip(sResponse);
or
oLink.tooltip(Pete.ajax.get('http://localhost-jslite/sandbox/assert.html'));
         */
        //<source>
        get: function (sURL) {
            var xhr,
                options = Pete.mixin(Pete.extend(defaults), {
                    url: sURL,
                    async: false
                });

            xhr = getXHR();
            sendRequest(xhr, options);

            return xhr.responseText;
        },
        //</source>

        getRequests: function () {
            return requests;
        },

        /**
         * @function Pete.ajax.load
         * @param {Object} opts An object literal.
         * @return {String/XML/JSON}
         * @describe <p>Used for general-purpose Ajax request. Define callbacks and other customizable features within <code>opts</code>.</p>
<p><a href="http://jslite.benjamintoll.com/examples/ajaxFormSubmission.php" rel="external">See an example of an Ajax form submission</a></p>
         * @example
var x = Pete.ajax.load({
  url: sURL,
  data: 'html',
  type: 'POST',
  success: function (sResponse) {
    $('myDiv').innerHTML = sResponse.HTMLify();
  }
});
         */
        //<source>
        load: function (opts) {
            var xhr,
                // Make a clone of defaults so each closure gets its own copy.
                options = Pete.mixin(Pete.extend(defaults), opts);

            xhr = getXHR();

            // TODO: Make all private methods public?
            sendRequest.call(this, xhr, options);

            if (!opts.async) {
                if (httpSuccess(xhr)) {
                    return httpData(xhr, options);
                }
            }
        },
        //</source>

        // This has to be exposed in case a prototype defines its own API.
        onComplete: onComplete
    };
    //</source>
}()));

