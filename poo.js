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

var Class = {}

Class.create = function( args ){
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

    //proto.__buildArgs__ = { value: null };
    //proto.__META__ = { value: {} };

    var ctor = function(buildArgs){
        var self = this;

        console.log('entering constructor', buildArgs );

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

var Business = function(name){this.name = name}
Business.prototype.toString = function(){
    return this.name;
}

var Foo = Class.create({

    // create ro getter
    // caching the value
    // check the value upon read
    business: {
        $isa: Business
    },

    related: {
        $isa: Business,
        $writable: true,
        $lazy: function(){
            return this.business;
        }
    },

    // initializes in constructor,
    // or fromt lazy build,
    // remains writable
    name: {
        $isa: String,
        $writable: true,
        $lazy: function(self){
            return this.description;
        }
    },

    // initializes in constructor,
    // or fromt lazy build,
    // remains writable
    short_name: {
        $isa: String,
        $writable: true,
        $lazy: function(self){
            return this.description;
        }
    },

    // another check with bulitin types
    count: {
        $isa: Number,
        value: 90
    },

    // allow constructor,
    // initialize from $lazy otherwize
    // check the getter for type
    stamp: {
        $isa: Date,
        $lazy: function(){
            return new Date();
        }
    },

    get plain(){
        return 'plain string';
    },

    // plain getter
    get description(){
        return util.format( '%s created on %s', this.business, this.stamp );
        //_.memoize(function(){
        //}.bind(this))
    },

    // plain method
    foobar: function(){
        return this.description + ' foobar';
    }
});


var a = new Business('Example Inc');
var c = new Foo({ business: a, short_name: 'Example' });
var d = new Foo({ business: new Business('Other Example Inc'), short_name: 'Example', count: 90 });


//for( var k in c ){
//    console.log( k, ''+c[k]);
//}
//console.log( Object.keys(c) );
//console.log( c );

assert.equal( c.business, a );
//assert.throws( function(){ c.business = 'A brand new name'; }, /Attempting to write property/ );
//assert.ok( c.stamp instanceof Date );
//assert.equal( c.name, c.description );
//
//c.name = 'A brand new name';
//assert.equal( c.name, 'A brand new name');
//assert.equal( c.short_name, 'Example');
//assert.equal( c.related, c.business );
//assert.equal( c.foobar(), c.description + ' foobar' );
//
//var other = new Business('Got some other business');
//c.related = other;
//
//assert.equal( c.related,other );
//
//assert.throws( function(){ c.related = 'foobar'; }, /TypeError: TypeConstraint Failed/ );
//
//assert.throws( function(){ console.log(c.count ) }, /TypeError: TypeConstraint Failed:/, 'We get errors for things undefined in constructors' );

//var x = d.count;
