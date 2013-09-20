'use strict';

var assert = require('assert'),
    _ = require('lodash'),
    util = require('util');

var Poo = {};

Poo.Type = {
    Enum: function(values) {
        return function(value) {
            return values.indexOf(value) > -1;
        }
    }
}

function _typeCheck(isa, value, key) {
    if (isa == String) {
        return _.isString(value);
    }

    if (isa == Number) {
        return _.isNumber(value);
    }

    if (isa instanceof Function) {
        return isa(value);
    }

    return value instanceof isa;
}

function _assertType(name, isa, value) {
    if (isa === undefined) {
        return value;
    }

    if (!_typeCheck(isa, value, name)) {
        throw new TypeError(util.format('TypeConstraint Failed: value for %s is not a %s, it isa: %s: %s', name, isa, typeof value, value))
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

function _property(key, desc, val) {
    var property = {
        enumerable: true
    };

    if (val instanceof Function) {
        property.value = val;
        return property;
    }
    property.get = function() {
        if (this.__META__[key] === undefined) {
            this.__META__[key] = _getter(this.__META__[key], val, key);
        }

        return this.__META__[key];
    };

    property.set = function(value) {
        if (!val.$writable && !this.__BUILD__ === true) {
            throw new Error(util.format('Attempting to write property %s', key));
        }

        return this.__META__[key] = _assertType(key, val.$isa, value);
    }

    return property;
}

function _annotate(key, definition) {
    var val = definition[key],
        desc = Object.getOwnPropertyDescriptor(definition, key);

    if (desc.writable) {
        return _property(key, desc, val);
    }

    return desc;
}

function _ctor() {
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
    };
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
        props[key] = _annotate(key, definition)
    }

    return props;
}

function _create(proto, definition) {
    var ctor = _ctor();
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
