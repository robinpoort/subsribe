'use strict';

/**
 *
 * Subscriber v1.0.0
 * A vanilla JS Subscribe section plugin, by Robin Poort - Timble
 * http://robinpoort.com - http://www.timble.net
 *
 * Browser support: IE9+
 *
 * Dependency: apollo JS | https://github.com/toddmotto/apollo
 * Plugin boilerplate by | http://gomakethings.com/mit/
 *
 * Free to use under the MIT License.
 *
 */

(function (root, factory) {
    if ( typeof define === 'function' && define.amd ) {
        define('subscriber', factory(root));
    } else if ( typeof exports === 'object' ) {
        module.subscriber = factory(root);
    } else {
        root.subscriber = factory(root);
    }
})(this, function (root) {

    'use strict';

    // Variables
    var exports = {}; // Object for public APIs
    var supports = !!document.querySelector && !!root.addEventListener; // Feature test
    var settings; // Plugin settings

    // Default settings
    var defaults = {
        wrapper: '',
        wrapper_static_class: '',
        form: '',
        append_button_to: '',
        closebuttontype: 'button',
        closebuttonclass: 'js-close-button',
        closebuttoncontent: 'close',
        class_init: 'js-subscribe-init',
        class_stuck: 'js-subscribe-stuck',
        class_loose: 'js-subscribe-loose',
        class_closed: 'js-subscribe-closed',
        cookie_name: 'subscribe',
        cookie_value: 'closed',
        cookie_days: 365,
        scrollamountbottom: 200,
        scrollamounttop: 100,
        width: 600
    };

    // Methods
    /**
     * A simple forEach() implementation for Arrays, Objects and NodeLists
     * @private
     * @param {Array|Object|NodeList} collection Collection of items to iterate
     * @param {Function} callback Callback function for each iteration
     * @param {Array|Object|NodeList} scope Object/NodeList/Array that forEach is iterating over (aka `this`)
     */
    var forEach = function (collection, callback, scope) {
        if (Object.prototype.toString.call(collection) === '[object Object]') {
            for (var prop in collection) {
                if (Object.prototype.hasOwnProperty.call(collection, prop)) {
                    callback.call(scope, collection[prop], prop, collection);
                }
            }
        } else {
            for (var i = 0, len = collection.length; i < len; i++) {
                callback.call(scope, collection[i], i, collection);
            }
        }
    };

    /**
     * Merge defaults with user options
     * @private
     * @param {Object} defaults Default settings
     * @param {Object} options User options
     * @returns {Object} Merged values of defaults and options
     */
    var extend = function ( defaults, options ) {
        var extended = {};
        forEach(defaults, function (value, prop) {
            extended[prop] = defaults[prop];
        });
        forEach(options, function (value, prop) {
            extended[prop] = options[prop];
        });
        return extended;
    };

    /**
     * Remove whitespace from a string
     * @private
     * @param {String} string
     * @returns {String}
     */
    var trim = function ( string ) {
        return string.replace(/^\s+|\s+$/g, '');
    };

    /**
     * Convert data-options attribute into an object of key/value pairs
     * @private
     * @param {String} options Link-specific options as a data attribute string
     * @returns {Object}
     */
    var getDataOptions = function ( options ) {
        var settings = {};
        // Create a key/value pair for each setting
        if ( options ) {
            options = options.split(';');
            options.forEach( function(option) {
                option = trim(option);
                if ( option !== '' ) {
                    option = option.split(':');
                    settings[option[0]] = trim(option[1]);
                }
            });
        }
        return settings;
    };

    function getParents(element, tag, stop) {
        var nodes = [];
        while (element.parentNode && element.parentNode != stop) {
            element = element.parentNode;
            if (element.tagName == tag) {
                nodes.push(element);
            }
        }
        return nodes
    }

    // Create cookie
    function createCookie(name, value, days) {
        var expires;
        if (days) {
            var date = new Date();
            date.setTime(date.getTime()+(days*24*60*60*1000));
            expires = "; expires="+date.toGMTString();
        }
        else {
            expires = "";
        }
        document.cookie = name+"="+value+expires+"; path=/";
    }

    // Read cookie
    function readCookie(name) {
        var nameEQ = name + "=";
        var ca = document.cookie.split(';');
        for(var i=0;i < ca.length;i++) {
            var c = ca[i];
            while (c.charAt(0) === ' ') {
                c = c.substring(1,c.length);
            }
            if (c.indexOf(nameEQ) === 0) {
                return c.substring(nameEQ.length,c.length);
            }
        }
        return null;
    }

    // Erase cookie
    function eraseCookie(name) {
        createCookie(name,"",-1);
    }

    // Initialize
    function initialize(settings) {

        // Variables
        var cookie = readCookie(settings.cookie_name);
        var windowWidth;
        var scrollBarPosition;
        var closeButton;

        // Get the current windowWidth
        function getWindowWidth() {
            windowWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
            return windowWidth;
        }

        // Add initial classes
        function subscribeInit() {
            apollo.addClass(settings.wrapper, [settings.class_init, settings.class_loose]);
            apollo.removeClass(settings.wrapper, settings.wrapper_static_class);
        }

        // Add classes according to scroll
        function subscribeSet() {
            // Only run if user didn't close the form yet
            if ( !apollo.hasClass(settings.wrapper, settings.class_closed) ) {

                // Check current scrollposition
                scrollBarPosition = window.pageYOffset | document.body.scrollTop;

                // If scroll is large enough add the stuck class
                if (scrollBarPosition >= settings.scrollamountbottom && !apollo.hasClass(settings.wrapper, settings.class_stuck)) {
                    apollo.addClass(settings.wrapper, settings.class_stuck);
                }

                // Remove the stuck class when scroll is small enough
                if (scrollBarPosition <= settings.scrollamounttop) {
                    apollo.removeClass(settings.wrapper, settings.class_stuck);
                }
            }
        }

        // Remove all classes
        function subscribeUnSet() {
            apollo.removeClass(settings.wrapper, [settings.class_stuck, settings.class_loose, settings.class_init]);
        }

        // Set a cookie
        function setCookie() {
            createCookie(settings.cookie_name, settings.cookie_value, settings.cookie_days);
        }

        // Close area
        function closearea() {
            closeButton = document.getElementsByClassName(settings.closebuttonclass)[0];
            closeButton.onclick = function(event) {
                event.preventDefault();
                apollo.removeClass(settings.wrapper, settings.class_stuck);
                apollo.addClass(settings.wrapper, settings.class_closed);
                setCookie();
            }
        }

        // Create close button
        function createCloseButton() {
            closeButton = document.getElementsByClassName(settings.closebuttonclass)[0];
            if ( !closeButton ) {
                closeButton = document.createElement(settings.closebuttontype);
                apollo.addClass(closeButton, [settings.closebuttonclass]);
                if (settings.append_button_to == '' ) {
                    settings.wrapper.appendChild(closeButton);
                } else {
                    settings.append_button_to.appendChild(closeButton);
                }
                closeButton = document.getElementsByClassName(settings.closebuttonclass)[0];
                closeButton.innerHTML = settings.closebuttoncontent;
                closeButton.setAttribute('aria-hidden', 'true');
                closeButton.setAttribute('aria-pressed', 'false');
            }
        }

        // Remove close button
        function removeCloseButton() {
            closeButton = document.getElementsByClassName(settings.closebuttonclass)[0];
            closeButton.parentNode.removeChild(closeButton);
        }

        // Only run script if no cookies are set
        function checkCookie() {
            if ( cookie != settings.cookie_value ) {

                getWindowWidth();

                // initialize
                if ( windowWidth >= settings.width ) {
                    subscribeInit();
                    createCloseButton();
                    closearea();
                }

                // Unset
                if ( windowWidth < settings.width ) {
                    subscribeUnSet();
                    removeCloseButton();
                }
            }
        }

        // On submit
        function onSubmit() {
            settings.form.onsubmit = function() {
                setCookie();
            };
        }

        // On load
        checkCookie();
        onSubmit();

        // On scroll
        window.onscroll = function() {
            subscribeSet();
        }

        // On resize
        window.onresize = function() {
            checkCookie();
        }
    }

    /**
     * Initialize Plugin
     * @public
     * @param {Object} options User settings
     */
    exports.init = function ( options ) {
        // feature test
        if ( !supports ) {
            return;
        }
        settings = extend( defaults, options || {} ); // Merge user options with defaults
        initialize(settings);
    };

    // Public APIs
    return exports;

});