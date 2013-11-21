'use strict';

var _ = require('lodash'),
    util = require('util'),
    Types = require('./types');

function _lazy(value, meta, key, self) {
    if (value === undefined && meta.value !== undefined) {
        value = meta.value;
    }

    if (value === undefined && meta.$lazy instanceof Function) {
        value = meta.$lazy.call(self);
    }

    return Types.isa(meta.$isa, value, key);
}

function _getter(key, val) {
    return function() {
        var meta = this.__META__[key];

        if (meta === undefined) {
            this.__META__[key] = _lazy(meta, val, key, this);
        }

        return this.__META__[key];
    };
}

function _setter(key, val) {
    return function(value) {
        if (!val.$writable && this.__BUILD__ !== true) {
            throw new Error(util.format('Attempting to write property %s', key));
        }

        this.__META__[key] = Types.isa(val.$isa, value, key);
    };
}

function _makeProperty(key, val) {
    if (val instanceof Function) {
        return {
            enumerable: true,
            value: val
        };
    }

    if (!val.$isa) {
        return val;
    }

    return {
        enumerable: true,
        get: _getter(key, val),

        set: _setter(key, val)
    };
}

function _annotate(key, definition) {
    var val = definition[key],
        desc = Object.getOwnPropertyDescriptor(definition, key);

    if (desc.writable) {
        return _makeProperty(key, _normalizeAttribute(val));
    }

    return desc;
}

function _normalizeAttribute(val) {
    if (!_.isPlainObject(val)) {
        if (val && Types.isPlainFunction(val) && !val.name) {
            return val;
        }

        val = {
            $isa: val
        };
    }

    if (typeof val.$isa === 'number' || typeof val.$isa === 'string') {
        return {
            value: val.$isa,
        };
    }

    val.$isa = Types.wrap(val.$isa);

    return val;
}

var Attributes = {
    normalize: _normalizeAttribute,

    defineProperties: function(definition) {
        var attributes = [],
            props = {};

        for (var key in definition) {
            props[key] = _annotate(key, definition);
            attributes.push(key);
        }

        props.__ATTRIBUTES__ = {
            value: attributes
        };

        return props;
    }
};

module.exports = Attributes;
