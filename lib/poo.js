'use strict';

var util = require('util');

var Poo = {};

Poo.Types = require('./types');

Poo.Type = Poo.Types.Type;


function _lazyGetter(value, meta, key, self) {
    if (value === undefined && meta.value !== undefined) {
        value = meta.value;
    }

    if (value === undefined && meta.$lazy instanceof Function) {
        var cb = meta.$lazy.bind(self);
        return cb();
    }

    return Poo.Types.isa(value, meta.$isa, key);
}

function _makeProperty(key, desc, val) {
    if (val instanceof Function) {
        return {
            enumerable: true,
            value: val
        };
    }

    return {
        enumerable: true,
        get: function() {
            var meta = this.__META__[key];

            if (meta === undefined) {
                this.__META__[key] = _lazyGetter(meta, val, key, this);
            }

            return this.__META__[key];
        },

        set: function(value) {
            if (!val.$writable && this.__BUILD__ !== true) {
                throw new Error(util.format('Attempting to write property %s', key));
            }

            var ret = this.__META__[key] = Poo.Types.isa(value, val.$isa, key);

            return ret;
        }
    };
}

function _annotate(key, definition) {
    var val = definition[key],
        desc = Object.getOwnPropertyDescriptor(definition, key);

    if (desc.writable) {
        if (val.$isa && !(val.$isa instanceof Poo.Type)) {
            val.$isa = Poo.Types.Native(val.$isa);
        }

        return _makeProperty(key, desc, val);
    }

    return desc;
}

function _defineProperties(definition) {
    var props = {
        __BUILD__: {
            configurable: true,
            value: true,
        },
        __META__: {
            value: {}
        }
    };

    for (var key in definition) {
        props[key] = _annotate(key, definition);
    }

    return props;
}

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

function _create(proto, definition) {
    var ctor = _makeConstructor();

    ctor.prototype = Object.create(proto, _defineProperties(definition));
    return ctor;
}

Poo.create = function(definition) {
    return _create({}, definition);
};

Poo.extend = function(spr, definition) {
    var ctor = _create(spr.prototype, definition);

    Object.defineProperty(ctor.prototype, '_super', {
        value: spr
    });

    return ctor;
};

module.exports = Poo;
