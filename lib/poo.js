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

function _defineProperty(key, createArgs, proto) {
    var val = createArgs[key],
        desc = Object.getOwnPropertyDescriptor(createArgs, key);

    if (desc.writable && !(val instanceof Function)) {
        proto[key] = {
            enumerable: true,
            get: function() {
                if (this.__META__[key] === undefined) {
                    this.__META__[key] = _getter(this.__META__[key], val, key);
                }

                return this.__META__[key];
            },
            set: function(value) {
                if (!val.$writable && this.__buildArgs__[key] !== value) {
                    throw new Error(util.format('Attempting to write property %s', key));
                }

                return this.__META__[key] = _assertType(key, val.$isa, value);
            }
        }
    }

    return proto;

}

var Poo = {};

Poo.create = function(createArgs) {
    var proto = {};

    for (var key in createArgs) {
        _defineProperty(key, createArgs, proto)
    }

    var ctor = function(buildArgs) {
        var self = this;

        Object.defineProperties(self, {
            __META__: {
                value: {}
            },
            __buildArgs__: {
                writable: true,
                configurable: true,
                value: buildArgs
            }
        });

        if (buildArgs) {
            Object.keys(buildArgs).forEach(function(key) {
                self[key] = buildArgs[key];
            });
        }

        Object.defineProperty(self, '__buildArgs__', {
            writable: false,
            value: {}
        });

    };

    ctor.prototype = Object.create(createArgs, proto);

    return ctor;
}

module.exports = Poo;
