'use strict';

var util = require('util'),
    _ = require('lodash');

function _formatError(err, name, type, value) {
    return err || util.format(
        'value for %s is not a %s, it isa: %s: %s',
        name, type || 'Unknown Type', typeof value, value);
}

function _isNative(value) {
    var primitives = [
        Object,
        Number,
        String,
        Date,
        Function,
        Boolean
    ];

    for (var i = 0; i < primitives.length; i++) {
        if (primitives[i] === value) return true;
    }
    return false;
}

function _isError(ok) {
    if (ok === undefined || ok === null || ok === true) {
        return false;
    }
    return true;
}

var Types = {
    isa: function isa(check, value, name) {
        var ok = check(value);

        if (!_isError(ok)) {
            return value;
        }

        throw new TypeError('TypeConstraint Failed: ' + _formatError(ok, name, check.name, value));
    },

    assert: function(value, type, name) {
        if (!type || !type.name) {
            type = Types.wrap(type);
        }

        Types.isa(type, value, name);
    },

    wrap: function wrapType(type) {
        if (type === null || type === undefined) {
            return Types.Any;
        }

        if (_isNative(type)) {
            return Types.Native(type);
        }

        if (!Types.isPlainFunction(type)) {
            return Types.Instance(type);
        }

        return type;
    },

    isPlainFunction: function isPlainFunction(value) {
        if (typeof value !== 'function') {
            return false;
        }

        var own = Object.getOwnPropertyNames(value.prototype);

        if (own.length >= 2 || (own.indexOf('constructor') < 0 && own.length >= 1)) {
            return false;
        }

        return Object.getPrototypeOf(value.prototype) === Object.prototype;
    },

    Any: function Any(value) {
        return _.isNull(value) ? 'Value is not defined' : true;
    },

    Instance: function(type) {
        return function Instance(value) {
            if (value instanceof type) return null;
            return value + ' not an instanceof ' + type;
        };
    },

    Native: function(type) {
        var name, desc = typeof type;

        if (!desc || ['number', 'boolean', 'string'].indexOf(desc) === -1) {
            name = type.toString().match(/(\w+)\(/g)[0].slice(0, -1);
        } else {
            name = desc[0].toUpperCase() + desc.slice(1);
        }

        return Types[name];
    },

    Object: function Object(value) {
        return _.isObject(value);
    },

    Number: function Number(value) {
        return typeof value === 'number' && !isNaN(value);
    },

    String: function String(value) {
        return typeof value === 'string';
    },

    Date: function Date(value) {
        return _.isDate(value);
    },

    Function: function Function(value) {
        return typeof value === 'function';
    },

    Boolean: function Boolean(value) {
        return typeof value === 'boolean';
    },

    Float: function Float(value) {
        return !isNaN(value) && _.isNumber(value);
    },

    Int: function Integer(value) {
        return _.isNumber(value) && value % 1 === 0;
    },

    PositiveInt: function PositiveInt(value) {
        return _.isNumber(value) && value % 1 === 0 && value >= 0;
    },

    PlainObject: function PlainObject(value) {
        return Object.getPrototypeOf(value) === Object.prototype;
    },

    Enum: function(values) {
        values = _.isArray(values) ? values : Array.prototype.slice.apply(arguments);

        return function Enum(value) {
            if (values.indexOf(value) !== -1) return true;
            return 'Value ' + value + ' is not one of: ' + values.join(', ');
        };
    },

    Tuple: function() {
        var tuple = Array.apply(null, arguments).map(Types.wrap);

        return function Tuple(values) {
            if (!_.isArray(values)) return false;

            if (values.length !== tuple.length)
                return 'Expected ' + tuple.length + ' values, got ' + values.length;

            for (var i = 0; i < tuple.length; i++) {
                var err = tuple[i](values[i]);
                if (!_isError(err)) continue;
                return 'Wrong type in tuple: ' + _formatError(err, 'index ' + i, tuple[i].name, values[i]);
            }

            return true;
        };
    },

    RegExp: function(re) {
        if (!re instanceof RegExp) {
            throw new Error('not a regular expression: ' + re);
        }

        return function RegExp(value) {
            if ((typeof value === 'string' || typeof value === 'number') && re.test(value)) {
                return true;
            }
            return 'Value ' + value + ' does not match: ' + re;
        };
    }
};

module.exports = Types;
