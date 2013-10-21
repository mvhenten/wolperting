'use strict';

var util = require('util'),
    Types = require('./types');

function _lazyGetter(value, meta, key, self) {
    if (value === undefined && meta.value !== undefined) {
        value = meta.value;
    }

    if (value === undefined && meta.$lazy instanceof Function) {
        var cb = meta.$lazy.bind(self);
        return cb();
    }

    return Types.isa(value, meta.$isa, key);
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

            var ret = this.__META__[key] = Types.isa(value, val.$isa, key);

            return ret;
        }
    };
}

function _annotate(key, definition) {
    var val = definition[key],
        desc = Object.getOwnPropertyDescriptor(definition, key);

    if (desc.writable) {
        if (val.$isa && !(val.$isa instanceof Types.Type)) {
            val.$isa = Types.Native(val.$isa);
        }

        return _makeProperty(key, desc, val);
    }

    return desc;
}

var Attributes = {
    defineProperties: function(definition) {
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
};

module.exports = Attributes;