'use strict';

var _ = require('lodash'),
    Attributes = require('./attributes'),
    Types = require('./types');

function _applyConstructorArgs( ctor, wargs) {
    if (!_.isPlainObject(wargs)) return;

    for (var key in wargs) {
        if (ctor.__ATTRIBUTES__.indexOf(key) !== -1) {
            ctor[key] = wargs[key];
        }
    }
}

function _initMeta(ctor) {
    if (ctor.__META__) return;

    Object.defineProperties(ctor, {
        __BUILD__: {
            writable: true,
            configurable: true,
            value: true,
        },
        __META__: {
            value: {}
        }
    });
}

function _callSuper(ctor, args) {
    if (!ctor._super) return;

    var spr = ctor._super;

    Object.defineProperty(ctor, '_super', {
        value: null
    });

    spr.apply(ctor, args);
}

function _makeConstructor() {
    return function() {
        var args = Array.prototype.slice.apply(arguments),
            wargs = args[args.length - 1];

        _initMeta(this);
        _applyConstructorArgs(this, wargs);
        _callSuper(this, arguments);

        if (this.__BUILD__) {
            // delete temporary __BUILD__ var if not already
            // removed by _super
            delete this.__BUILD__;
        }

        Object.freeze(this);
    };
}

var Wolperting = {
    /**
     * Expose wolperting Types, see [types](types.html)
     */
    Types: Types,

    /**
     * Create a new Wolperting object that inherits it's prototype from a super
     * class. see [introduction](index.html)
     *
     * Examples:
     *
     * ```javascript
     *      var Parent = function(){ console.log('i am parent') }
     *
     *      var Child = Wolperting.extend( Parent, { get name(){  return 'foo' } });
     *      // parent constructor is called, log 'i am parent'
     *     var child = new Child();
     *     child.name // returns 'foo'
     *
     *  ```
     *
     * @param {function} spr Parent class
     * @param {Object} defintion A plain object that defines the new attributes
     * @constructor A new wolperting class
     */
    extend: function(spr, definition) {
        var ctor = _makeConstructor();

        ctor.prototype = Object.create(spr.prototype || spr, Attributes.defineProperties(definition));

        if (spr.prototype !== undefined) {
            Object.defineProperty(ctor.prototype, '_super', {
                value: spr
            });

            if (spr.prototype.__ATTRIBUTES__ !== undefined) {
                Array.prototype.push.apply(ctor.prototype.__ATTRIBUTES__, spr.prototype.__ATTRIBUTES__);
            }
        }

        return ctor;
    },

    /**
     * Create a new Wolperting Object. see [introduction](index.html)
     */
    create: function(definition) {
        return Wolperting.extend({}, definition);
    }
};

module.exports = Wolperting;
