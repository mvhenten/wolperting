'use strict';

var util = require('util'),
    _ = require('lodash');

//function is(type, obj) {
//    var clas = Object.prototype.toString.call(obj).slice(8, -1);
//    return obj !== undefined && obj !== null && clas === type;
//}


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


var _typeCheck = function(isa, value) {
    if (isa == String) {
        return _.isString(value);
    }

    if (isa == Number) {
        return _.isNumber(value);
    }

    console.log(typeof isa, 'typeof isa ' + value);
    console.log(isa instanceof Function, 'instanceof function');
    console.log(isa instanceof Object, 'intancse of object');
    console.log('===========');

    //if ( isa instanceof Object ) {
    //    return value instanceof isa;
    //}


    if (isa instanceof Function && !isa.prototype) {
        return isa(value);
    }

    return value instanceof isa;
};

var isa = function(value, type) {
    if (type instanceof Type) {
        return Type.isa(value);
    }

    if (type == String) {
        return _.isString(value);
    }

    if (type == Number) {
        return _.isNumber(value);
    }

    return value instanceof type;
};


var _isInt = function() {
    return _.isNumber(value) && value % 1 === 0;
}

module.exports = {
    Type: Type,

    _typeCheck: _typeCheck,

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

    Tuple: function(values) {
        var tuple = Array.apply(null, arguments);

        return function(value) {
            if (!_.isArray(value)) return false;

            if (value.length !== tuple.length)
                return util.format('Wrong length for tupe %s, %s', tupe, value);

            return values.every(function(val, index) {
                return isa(val, value[index]);
            });
        }
    },

    Int: _isInt,

    PositiveInt: function(value) {
        console.log(value, 'value');
        return _isInt(value);
        //        return _isInt(value) && value > 0;
    }
};
