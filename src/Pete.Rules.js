/*
 * PeteJS
 *
 * Copyright (c) 2009 - 2015 Benjamin Toll (benjamintoll.com)
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 */

/**
 * @function Rules
 * @param {None}
 * @return {None}
 * @describe <p>Singleton.</p>
<p><a href="http://jslite.benjamintoll.com/examples/validate.php" rel="external">See an example</a></p>
 * @example
Pete.Rules.setRule("alpha", {re: "^[a-zA-Z]+$", message: "Can only contain letters."});
Pete.Rules.setRule("phone", {re: "^[a-zA-Z0-9]+$", message: "This is a bogus phone rule."});
oContactForm.validate(callback);

NOTE that any rule you set will only bind to the form element if it has its class set properly.
For instance, to set an "alpha" rule, the form element should look like the following in the markup:

<input type="text" id="firstName" name="firstName" class="required-alpha" />
 */
//<source>
Pete.Rules = (function () {
    var rules = {
          email: {
              re: "^[_a-z0-9-]+(\\.[_a-z0-9-]+)*@[a-z0-9-]+(\\.[a-z0-9-]+)*(\\.[a-z]{2,3})$",
              //re: "^[\w-]+(\\.[\w-]+)*@[a-z0-9-]+(\\.[\w-]+)*(\\.[a-z]{2,3})$",
              message: "Must be a valid email address."
          },
          phone: {
              re: "^1?\\(?(\\d{3})\\)?\\s?(\\d{3})-?(\\d{4})$",
              mask: "({1}) {2}-{3}",
              message: "Can only contain numbers, parenthesis, spaces and a dash."
          },
          ssn: {
              re: "^(\\d{3})(?:[-\\s]?)(\\d{2})(?:[-\\s]?)(\\d{4})$",
              mask: "{1}-{2}-{3}",
              message: "Can only contain numbers separated by a dash or a space."
          },
          zip: {
              re: "^([0-9]{5})(?:[-\\s]?)([0-9]{4})?$",
              mask: "{1}-{2}",
              message: "Can only contain numbers and a dash."
          }
      };

    return {
        getRule: function (name) {
            return rules[name];
        }.assert(String),

        setRule: function (name, oRule) {
            var obj = {};

            obj[name] = oRule;
            rules = Pete.mixin(rules, obj);

            return rules;
        }.assert(String, Object),

        removeRule: function (name) {
            delete rules[name];
            return rules;
        }.assert(String),

        rules: function () {
            return rules;
        }
    };
}());
//</source>

