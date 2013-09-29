'use strict';

var util = require('util');

var Poo = {};

Poo.Type = require('./types');
Poo.Types = require('./types');

function _assertType(name, isa, value) {
    if (isa === undefined) {
        return value;
    }

    if (!Poo.Type._typeCheck(isa, value, name)) {
        throw new TypeError(util.format(
            'TypeConstraint Failed: value for %s is not a %s, it isa: %s: %s', name, isa, typeof value, value));
    }

    return value;
}

function _getter(value, meta, key, self) {
    if (value === undefined && meta.value !== undefined) {
        value = meta.value;
    }

    if (value === undefined && meta.$lazy instanceof Function) {
        var cb = meta.$lazy.bind(self);
        return cb();
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
            this.__META__[key] = _getter(this.__META__[key], val, key, this);
        }

        return this.__META__[key];
    };

    property.set = function(value) {
        if (!val.$writable && this.__BUILD__ !== true) {
            throw new Error(util.format('Attempting to write property %s', key));
        }

        var ret = this.__META__[key] = _assertType(key, val.$isa, value);
        return ret;
    };

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

        Object.freeze(this);
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
        props[key] = _annotate(key, definition);
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
