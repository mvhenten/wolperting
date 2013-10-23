'use strict';

var _ = require('lodash'),
    util = require('util'),
    Types = require('./types');

function _lazyGetter(value, meta, key, self) {
    if (value === undefined && meta.value !== undefined) {
        value = meta.value;
    }

    if (value === undefined && meta.$lazy instanceof Function) {
        if (!meta.$isa) {
            throw new Error('Found $lazy without $isa');
        }
        value = meta.$lazy.call(self);
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

function _isEmpty(value) {
    for (var i in value) {
        if (i) {
            return false;
        }
    }
    return true;
}

function _normalize(val) {
    if (_.isNull(val)) {
        return {
            $isa: Types.Any
        };
    }

    if (val.$isa) {
        if (val.$isa instanceof Types.Type) return val;
        val.$isa = Types.Native(val.$isa);

        return val;
    }

    if (val instanceof Types.Type) {
        return {
            $isa: val
        };
    }

    if (Types.isNative(val)) {
        return {
            $isa: Types.Native(val)
        };
    }

    if ((val instanceof Function) && _isEmpty(val.prototype)) {
        return val;
    }

    return {
        $isa: Types.Native(val)
    };
}

function _annotate(key, definition) {
    var val = definition[key],
        desc = Object.getOwnPropertyDescriptor(definition, key);

    if (desc.writable) {
        return _makeProperty(key, desc, _normalize(val));
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
