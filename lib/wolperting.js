'use strict';

var Attributes = require('./attributes'),
    Types = require('./types');

function _makeConstructor() {
    return function(args) {
        args = args || {};

        for (var key in args) {
            this[key] = args[key];
        }

        Object.defineProperty(this, '__BUILD__', {
            value: false
        });

        if (this._super) {
            this._super.call(this, args);
        }

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