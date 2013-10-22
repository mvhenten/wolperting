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
                this[key] = wargs[key];
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
    Types: Types,

    Type: Types.Type,

    extend: function(spr, definition) {
        var ctor = _makeConstructor();

        ctor.prototype = Object.create(spr.prototype || spr, Attributes.defineProperties(definition));

        if (spr.prototype !== undefined) {
            Object.defineProperty(ctor.prototype, '_super', {
                value: spr
            });
        }

        return ctor;
    },

    create: function(definition) {
        return Wolperting.extend({}, definition);
    }
};

module.exports = Wolperting;
