'use strict';

var assert = require('assert'),
    _ = require('lodash'),
    util = require('util');

function _typeCheck(isa, value, key) {
    if (isa == String) {
        return _.isString(value);
    }

    if (isa == Number) {
        return _.isNumber(value);
    }

    return value instanceof isa;
}

function _assertType(name, isa, value) {
    if (isa === undefined) {
        return value;
    }

    if (!_typeCheck(isa, value, name)) {
        throw new TypeError(util.format('TypeConstraint Failed: value for %s is not a %s, it isa: %s: %s', name, typeof isa, typeof value, value))
    }

    return value;
}

function _getter(value, meta, key) {
    if (value === undefined && meta.value !== undefined) {
        value = meta.value;
    }

    if (value === undefined && meta.$lazy instanceof Function) {
        value = meta.$lazy.bind(this)();
    }

    return _assertType(key, meta.$isa, value);
}

function _defineProperty(key, desc, val) {
    return {
        enumerable: true,
        get: function() {
            if (this.__META__[key] === undefined) {
                this.__META__[key] = _getter(this.__META__[key], val, key);
            }

            return this.__META__[key];
        },
        set: function(value) {
            if (!val.$writable && !this.__BUILD__ === true) {
                throw new Error(util.format('Attempting to write property %s', key));
            }

            return this.__META__[key] = _assertType(key, val.$isa, value);
        }
    }
}

function _annotate(key, definition, proto) {
    var val = definition[key],
        desc = Object.getOwnPropertyDescriptor(definition, key);

    if (desc.writable && !(val instanceof Function)) {
        proto[key] = _defineProperty(key, desc, val);
    }

    return proto;

}

var Poo = {};

Poo.create = function(definition) {
    var ctor = function(args) {
        args = args || {};
        for (var key in args) {
            this[key] = args[key];
        }

        Object.defineProperty(this, '__BUILD__', {
            value: false
        });
    };

    var proto = {
        __BUILD__: {
            configurable: true,
            value: true,
        },
        __META__: {
            value: {}
        }
    };

    for (var key in definition) {
        _annotate(key, definition, proto)
    }

    ctor.prototype = Object.create(definition, proto);

    return ctor;
}

module.exports = Poo;
