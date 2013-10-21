'use strict';

var util = require('util'),
    _ = require('lodash');

var _primitives = [
    'Object',
    'Number',
    'String',
    'Date',
    'Function',
    'Boolean'
];

var _isPrimitive = function(name) {
    return _primitives.indexOf(name) !== -1;
};

var Type = function(name, isa) {
    if (!(this instanceof Type)) {
        return new Type(name, isa);
    }

    if (name instanceof Function) {
        isa = name;
        name = null;
    }

    Object.defineProperties(this, {
        name: {
            value: name || 'Anonymous Type'
        },

        isa: {
            value: function(value, propertyName) {
                for (var err = isa.call(this, value); err !== true; err = true) {
                    err = err || util.format(
                        'TypeConstraint Failed: value for %s is not a %s, it isa: %s: %s',
                        propertyName, this.name, typeof value, value);

                    throw new TypeError(err);
                }
                return true;
            }
        }
    });

    Object.freeze(this);
    return null;
};

/* jshint newcap: false */
var Types = {
    Type: Type,

    isa: function(value, type, name) {
        if (!type.isa(value, name)) {
            throw new TypeError(util.format(
                'TypeConstraint Failed: value for %s is not a %s, it isa: %s: %s', name, type, typeof value, value));
        }

        return value;
    },

    Any: Type(function(value) {
        return _.isNull(value) ? 'Value is not defined' : true;
    }),

    Native: function(type) {
        var desc = type.toString().match(/(\w+)\(/g);
        var name = desc[0].slice(0, -1);

        if (!_isPrimitive(name)) {
            return Type(function(value) {
                return value instanceof type ? true : value + ' not an instanceof ' + type;
            });
        }

        return Type(name, function(value) {
            var check = _['is' + name];
            return check(value);
        });
    },

    Float: Type('Float', function(value) {
        return _.isNumber(value) && !isNaN(value);
    }),

    Enum: function(values) {
        values = _.isArray(values) ? values : Array.prototype.slice.apply(arguments);

        return Type('Enum', function(value) {
            if (values.indexOf(value) === -1) {
                return 'Value ' + value + ' is not one of: ' + values.join(', ');
            }
            return true;
        });
    },

    Tuple: function() {
        var tuple = Array.apply(null, arguments).map(function(type) {
            if (type instanceof Type) {
                return type;
            }

            return Types.Native(type);
        });

        return Type('Tuple', function(values) {
            if (!_.isArray(values)) return false;

            if (values.length !== tuple.length)
                return util.format('Wrong length for tuple %s, %s', tuple, values);

            var ok = values.every(function(val, index) {
                return Types.isa(val, tuple[index]);
            });

            return ok;
        });
    },

    RegExp: function(re) {
        if (!re instanceof RegExp) {
            throw new Error('not a regular expression: ' + re);
        }

        return Type('RegExp', function(value) {
            if ((_.isString(value) || _.isNumber(value)) && re.test(value)) {
                return true;
            }
            return 'Value ' + value + ' does not match: ' + re;
        });
    },

    Int: function() {
        return Type('Int', function(value) {
            return _.isNumber(value) && value % 1 === 0;
        });
    },

    PositiveInt: function() {
        return Type('Int', function(value) {
            return _.isNumber(value) && value % 1 === 0 && value >= 0;
        });
    }
};

module.exports = Types;
