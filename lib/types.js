'use strict';

var util = require('util'),
    _ = require('lodash');

var Types = {

    isNative: function(value) {
        var primitives = [
            Object,
            Number,
            String,
            Date,
            Function,
            Boolean
        ];

        return primitives.some(function(primitive) {
            return primitive === value;
        });
    },

    isa: function isa(check, value, name) {
        var ok = check(value);

        if (ok === undefined || ok === null || ok === true) {
            return value;
        }

        throw new TypeError('TypeConstraint Failed: ' + Types.formatError(ok, name, check.name, value));
    },

    formatError: function formatError(err, name, type, value) {
        return err || util.format(
            'value for %s is not a %s, it isa: %s: %s',
            name, type || 'Unknown Type', typeof value, value);
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

        if (Types.isNative(type)) {
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

        var own = Object.getOwnPropertyNames(value.prototype),
            ctorIndex = own.indexOf('constructor');

        if (ctorIndex !== -1) {
            own.splice(ctorIndex, 1);
        }


        if (own.length) {
            return false;
        }

        // walk prototype chain
        var proto = Object.getPrototypeOf(value.prototype);

        if (proto === Object.prototype) {
            return true;
        }

        return false;
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
        var desc = type.toString().match(/(\w+)\(/g);
        var name = desc[0].slice(0, -1);
        var check = Types[name];

        return check;
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
                if (err === null || err === undefined || err === true) continue;
                return 'Wrong type in tuple: ' + Types.formatError(err, 'index ' + i, tuple[i].name, values[i]);
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
