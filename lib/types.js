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

/**
 * The Wolperting type library and utilities
 */
var Types = {

    /**
     * Perform a type check and trows a TypeError if the check fails. Formats
     * the error message into a usable string. This function is mainly used
     * internally and exposed as a utility.
     *
     * @param {function} check A function that returns an error or one of `null`, `undefined`, `true`
     * @param {Anything} value The value to check
     * @param {String} name Name of the attribute that was checked (optional)
     * @returns {Anything} The value if the check passes
     */
    isa: function isa(check, value, name) {
        var ok = check(value);

        if (!_isError(ok)) {
            return value;
        }

        throw new TypeError('TypeConstraint Failed: ' + _formatError(ok, name, check.name, value));
    },

    /**
     * Perform a type check and trows a TypeError if the check fails. Wraps the
     * type argument so that we can call `isa`.
     *
     *  Examples:
     * ```javascript
     *
     *     Types.assert( 'foo', Number, 'thing' );
     *     // throws: 'TypeError: TypeConstraint Failed: thing is not a Number it is a...'
     * ```
     *
     * @param {Anything} value The value to check
     * @param {Object} type The type to check, can be a class, primitive, or named function
     * @param {String} name Name of the attribute that was checked (optional)
     */
    assert: function(value, type, name) {
        if (!type || !type.name) {
            type = Types.wrap(type);
        }

        Types.isa(type, value, name);
    },

    /**
     * Wrap the first argument in one of the supported `Types` if needed, or returns
     * the original value if it is a function.
     *
     * @param {Object} type The type to check, can be a class, primitive, or named function
     * @returns {Function} A function that performs a type check
     */
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

    /**
     * Check wether the first argument is a function with an empty prototype, e.g.
     * a plain function ( method or typecheck that should not be instantiated using `new`)
     *
     * @param {Function} value A function
     * @returns {Boolean} plain True if the function directly inherits from Function
     */
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

    /**
     * The Any type. Checks that the value is at least defined
     *
     * @param {Anything} value The value to check
     * @returns {Boolean} plain True if the value is defined
     */
    Any: function Any(value) {
        return _.isNull(value) ? 'Value is not defined' : true;
    },

    /**
     * Create an instance check
     *
     * @param {Type} type A javascript function the value should be an `instanceof`
     * @returns {Boolean|String} ok True if the check is successful, or an error string
     */
    Instance: function(type) {
        return function Instance(value) {
            if (value instanceof type) return null;
            return value + ' not an instanceof ' + type;
        };
    },

    /**
     * Create a check for one of the primitives: Object,Number,String,Date,Function,Boolean
     *
     * @param {Type} type A javascript primitive the value should adhere to
     * @returns {Boolean} ok True if the check is successfull
     */
    Native: function(type) {
        var name, desc = typeof type;

        if (!desc || ['number', 'boolean', 'string'].indexOf(desc) === -1) {
            name = type.toString().match(/(\w+)\(/g)[0].slice(0, -1);
        } else {
            name = desc[0].toUpperCase() + desc.slice(1);
        }

        return Types[name];
    },

    /**
     * Native check for Object. Mostly for symetry, you may find PlainObject
     * more usefull. Wraps lodash' isObject
     *
     * @param {Any} value value to check
     * @returns {Boolean} ok True if the check is successfull
     */
    Object: function Object(value) {
        return _.isObject(value);
    },

    /**
     * Native check for Number. Also checks against isNaN
     *
     * @param {Any} value value to check
     * @returns {Boolean} ok True if the check is successfull
     */
    Number: function Number(value) {
        return typeof value === 'number' && !isNaN(value);
    },

    /**
     * Native check for String. Performs a simple `typeof`
     *
     * @param {Any} value value to check
     * @returns {Boolean} ok True if the check is successfull
     */
    String: function String(value) {
        return typeof value === 'string';
    },

    /**
     * Native check for Date. Wraps lodash `isDate`
     *
     * @param {Any} value value to check
     * @returns {Boolean} ok True if the check is successfull
     */
    Date: function Date(value) {
        return _.isDate(value);
    },

    /**
     * Native check for Function. Kept mostly for symetry
     *
     * @param {Any} value value to check
     * @returns {Boolean} ok True if the check is successfull
     */
    Function: function Function(value) {
        return typeof value === 'function';
    },

    /**
     * Native check for Boolean. Performs a simple `typeof`
     *
     * @param {Any} value value to check
     * @returns {Boolean} ok True if the check is successfull
     */
    Boolean: function Boolean(value) {
        return typeof value === 'boolean';
    },

    /**
     *  Check for Float. wraps lodash isNumber and checks for isNaN
     *
     * @param {Any} value value to check
     * @returns {Boolean} ok True if the check is successfull
     */
    Float: function Float(value) {
        return !isNaN(value) && _.isNumber(value);
    },

    /**
     *  Check for Int, both negative and positive
     *
     * @param {Any} value value to check
     * @returns {Boolean} ok True if the check is successfull
     */
    Int: function Integer(value) {
        return _.isNumber(value) && value % 1 === 0;
    },

    /**
     *  Check for PositiveInt
     *
     * @param {Any} value value to check
     * @returns {Boolean} ok True if the check is successfull
     */
    PositiveInt: function PositiveInt(value) {
        return _.isNumber(value) && value % 1 === 0 && value >= 0;
    },

    /**
     * Checks for PlainObject, e.g. an object that directly inherits from `Object`,
     * e.g. {}.
     *
     * @param {Any} value value to check
     * @returns {Boolean} ok True if the check is successfull
     */
    PlainObject: function PlainObject(value) {
        return Object.getPrototypeOf(value) === Object.prototype;
    },

    /**
     * Create an enumerated type check. The value checked by Enum must be one of
     * the listed arguments to this function.
     *
     * Not that the values can either be provided as an Array or by overloading
     * the function.
     *
     * @param {Array} values Values this enumerate checks again.
     * @returns {Boolean|String} ok True if the check is successfull, or an error string
     */
    Enum: function(values) {
        values = _.isArray(values) ? values : Array.prototype.slice.apply(arguments);

        return function Enum(value) {
            if (values.indexOf(value) !== -1) return true;
            return 'Value ' + value + ' is not one of: ' + values.join(', ');
        };
    },

    /**
     * Create a Tuple type check. The values checked by Tuple must be in the right
     * order and of the right type. Tuples may be nested, and an efford is made to
     * create error messages that make some sense.
     *
     * Examples:
     * ```javascript
     *      var type = Types.Tuple( [ Number, Number ]);
     *
     *      console.log( type( [1, 2] ) );
     *      // returns true
     *
     *      console.log( type( ['a', 2] ) );
     *      // returns something like "Wrong type in type: index 0 is not a..."
     *
     * ````
     *
     * @param {Array} values Values this tuple checks again.
     * @returns {Boolean|String} ok True if the check is successfull, or an error string
     */
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

    DuckType: function(name, def) {
        if (arguments.length === 1) def = name, name = 'DuckType';

        var duck = _.reduce(def, function(collect, type, key) {
            collect[key] = Types.wrap(type);
            return collect;
        }, {});


        return function DuckType(values) {
            for (var key in duck) {
                var err = duck[key](values[key]);

                if (!_isError(err)) continue;
                return 'Wrong type in ' + name + ': ' + _formatError(err, 'key ' + key, duck[key].name, values[key]);
            }
        };
    },

    /**
     * Create a RegExp type check. The first argument to this function must be a
     * regular expression that will be used to validate against.
     *
     * Examples:
     *
     * ```javascript
     *      var type = Types.RegExp( /\d+/ );
     *
     *      console.log( type(1) );
     *      // returns true
     *
     *      console.log( type( '1.34' ) );
     *      // returns something like "Value 1.34 does not matc: /\d+/"
     *
     * ```
     * @param {Array} values Values this tuple checks again.
     * @returns {Boolean|String} ok True if the check is successfull, or an error string
     */
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
