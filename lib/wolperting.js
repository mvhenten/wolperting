'use strict';

var _ = require('lodash'),
    Attributes = require('./attributes'),
    Types = require('./types');

function _makeConstructor() {
    return function() {
        var args = Array.prototype.slice.apply(arguments),
            wargs = args[args.length - 1];

        // only use wargs if it's a plain object
        if (_.isPlainObject(wargs)) {
            for (var key in wargs) {
                // TODO this ignores unknow attributes
                // but does not complain about them.
                if (this.__ATTRIBUTES__.indexOf(key) !== -1) {
                    this[key] = wargs[key];
                }
            }
        }

        if (this._super) {
            var spr = this._super;

            Object.defineProperty(this, '_super', {
                value: null
            });

            spr.apply(this, arguments);
        }

        Object.defineProperty(this, '__BUILD__', {
            value: false
        });

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
     *      var Parent = function(){ console.log('i am parent') }
     *      var Child = Wolperting.extend( Parent, { get name(){  return 'foo' } });
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
