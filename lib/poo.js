'use strict';

var assert = require('assert'),
    _ = require('lodash'),
    util = require('util');

function _typeCheck( isa, value, key ){
    if( isa == String ){
        return _.isString( value );
    }

    if( isa == Number ){
        return _.isNumber(value);
    }

    return value instanceof isa;
}

function _assertType( name, isa, value ){
    try {
        assert( _typeCheck( isa, value, name ) );
    }
    catch ( AssertionError ){
        throw new TypeError( util.format('TypeConstraint Failed: value for %s is not a %s, it isa: %s: %s', name, typeof isa, typeof value, value ))
    }
    return value;
}

var Poo = {};

Poo.create = function( args ){
    var proto = Object.keys(args).reduce( function( proto, key ){
        var val = args[key];

        if( _.isPlainObject(val) && val.$isa ){
            proto[key] = {
                    enumerable: true,
                    get: function(){
                        if( _.isUndefined( this.__META__[key] ) && val.$lazy ){
                            this.__META__[key] = val.$lazy.bind(this)();
                        }

                        return _assertType( key, val.$isa, this.__META__[key] );
                    },
                    set: function(value){
                        if( ! val.$writable && this.__buildArgs__[key] !== value ){
                            throw new Error( util.format( 'Attempting to write property %s', key ));
                        }

                        return this.__META__[key] = _assertType( key, val.$isa, value );
                    }
                }
            }

        return proto;
    }, {} );

    var ctor = function(buildArgs){
        var self = this;

        Object.defineProperty( self, '__META__', {
            value: {}
        });

        Object.defineProperty( self, '__buildArgs__', {
            value: buildArgs
        });

        Object.keys( buildArgs ).forEach(function(key){
            self[key] = buildArgs[key];
        });

    };

    ctor.prototype = Object.create( args, proto );
    return ctor;
}

module.exports = Poo;