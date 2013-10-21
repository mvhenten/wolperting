Wolperting
==========
### minimal object-system inspired by the Perl Meta-protocol API


Introduction
------------

Wolperting is a object-system inspired by the Perl meta-protocol API. It provides
a mimal layer between ES5 `Object.create` and `Object.defineProperties`, achieving
native encapsulation, getters- and setters and protection against un-intended
behaviour.

The basic API adds no other conventions then those imposed by `Object.create`.
This means that Wolperting knows how to handle ES5 `get` and `set`, however works
around the limitation of the second argument to `Object.create`.

Class attributes created by Wolperting are read-only by default, and objects
created by the Wolperting constructor are made __immutable__ after instantiation
using `Object.freeze`. The constructor populates attributes at instantiation,
transforming your object's prototype declaration as a de-facto API.

Additionally, it adds a type-checking mechanism that leverages `lodash`'s `isXXX`
functions, providing a stable fundament for type-checking in javascript.

Examples
--------

Wolperting tries not to impose any new coding style, for example the following
_"classic point example"_ can be converted from a native implementation simply
by replacing a couple lines of code:

###### point example in native javascript

    var _ = require('lodash');

    var Point = function(args){
        // check for x and y possibly...

        this._private = args;
    }

    Point.prototype = {
        get x(){
            return this._private.x;
        }
        get y(){
            return this._private.y;
        }
    }

    var p = new Point({ x: 1, y: 2 });
    assert.equal( p.x, 1 );
    assert.equal( p.y, 2 );

###### point example in wolperting

    var create = require('wolperting').create;

    var Point = create({
        x: null,
        y: null
    });

    var p = new Point({ x: 1, y: 2 });
    assert.equal( p.x, 1 );
    assert.equal( p.y, 2 );
