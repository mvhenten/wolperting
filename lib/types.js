'use strict';

var util = require('util'),
    _ = require('lodash');

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
                return value;
            }
        }
    });

    Object.freeze(this);
    return null;
};

var Types = {

    /**
     * Base class for a Wolperting type or custom type. This function can be called as a constructor using the `new` keyword or as a function.
     *
     * Examples:
     *
     *     utils.escape('<script></script>')
     *      // type "article" must be a string of either: "a", "an", "the", "some"
     *      var Article = Types.Type( 'Article', function(value){
     *          return ['a','an','the','some'].indexOf(value) > -1;
     *      });
     *
     *
     *      // returns true
     *      Article.isa( 'some', 'the some property');
     *
     *      // throws a `TypeError`
     *      Article.isa( 'foo', 'the foo property');
     *
     * @param {string} name (Optional) name of the type. If this argument is omitted, isa is expected to be the first argument
     * @param {function} isa Function that performs the type check
     * @return {object} A wolperting "type" annotation
     * @api public
     */
    Type: Type,

    /**
     * Determine if value is one of the javascript primitives:
     *
     * Examples:
     *
     *      var x = function(){};
     *
     *      Types.isNative(x);
     *      // => returns false
     *
     *      Types.isNative(Function);
     *      // => returns true
     *
     * @name Types.isNative
     * @param {any} value Value to check against
     * @return {Boolean} True if one of Object, Number, String, Date, Function, Boolean
     */
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

    /**
     * Asserts the type of a value, where "type" is coerced into a Wolperting Type
     *
     * Examples:
     *
     *      Types.assert( 45.2, Types.PositiveInt, 'thing' );
     *      // => throws TypeError:
     *      // TypeConstraint Failed: value for thing is not a PositiveInt, it isa: Number: 45.2
     *
     * @param {any} value Value to typecheck against
     * @param {any} type Type to check against. type can either be a Wolperting type
     */
    assert: function(value, type, name) {
        if (!(type instanceof Type)) {
            type = Types.Native(type);
        }

        type.isa(value, name);
    },

    /**
     * The any type: anything that is not null
     */
    Any: Type(function(value) {
        return _.isNull(value) ? 'Value is not defined' : true;
    }),

    /**
     * Checks if value is an instance of the given object. This type is mainly
     * used internally, to coerce objects with a prototype to a Type
     */
    Instance: function(type) {
        return Type('Instance', function(value) {
            return value instanceof type ? true : value + ' not an instanceof ' + type;
        });
    },

    /**
     * Checks and coerces a javascript primitive to a Type. This type is mainly
     * used internally to coerce primitives to a Type
     */
    Native: function(type) {
        if (Types.isNative(type)) {
            var desc = type.toString().match(/(\w+)\(/g);
            var name = desc[0].slice(0, -1);

            return Type(name, function(value) {
                var check = _['is' + name];
                return check(value);
            });
        }

        return Types.Instance(type);
    },

    /**
     * Checks if value is a number and not NaN
     */
    Float: Type('Float', function(value) {
        return _.isNumber(value) && !isNaN(value);
    }),

    /**
     * Checks if value is one of the given enumerated values
     *
     * Examples:
     *
     *      var enum = Types.Enum( 'one', 'two' );
     *
     *      enum.isa( 'one' );
     *      // => is ok
     *
     *      enum.isa('foo');
     *      // => throws a TypeError
     *
     */
    Enum: function(values) {
        values = _.isArray(values) ? values : Array.prototype.slice.apply(arguments);

        return Type('Enum', function(value) {
            if (values.indexOf(value) === -1) {
                return 'Value ' + value + ' is not one of: ' + values.join(', ');
            }
            return true;
        });
    },

    /**
     * Type Tuple
     *
     * A tuple is an array of set length, where each position of the array must
     * be of the right Type. Types may be nested too.
     *
     * Examples:
     *
     *      var type = Types.Tuple( Number, Number );
     *      type.isa( [1, 1] );
     *
     *      type.isa( [1, 3, 5 ] );
     *      // => throws a TypeError, the length of the value is wrong
     *
     *      type.isa( [1, '1'] );
     *      // => throws a type error, second value is not a number
     *
     */
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

            values.forEach(function(val, index) {
                tuple[index].isa(val);
            });

            return true;
        });
    },

    /**
     * Validate a type by testing it against a regexp
     *
     * Examples:
     *
     *      var type = Types.RegExp(/\w+/);
     *
     *      type.isa('foobar');
     *      // => ok
     *
     *      type.isa( 'not-a-word' );
     *      // => throws a type error
     */
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

    /**
     * Value must be an int
     */
    Int: Type('Int', function(value) {
        return _.isNumber(value) && value % 1 === 0;
    }),

    /**
     * Value must be an int and greater or equal to zero
     */
    PositiveInt: Type('Int', function(value) {
        return _.isNumber(value) && value % 1 === 0 && value >= 0;
    })
};

module.exports = Types;
