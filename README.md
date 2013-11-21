Wolperting
==========
### minimal object-system inspired by the Perl Meta-protocol API

[![Build Status](https://drone.io/github.com/mvhenten/wolperting/status.png)](https://drone.io/github.com/mvhenten/wolperting/latest)

Introduction
------------

Wolperting is a object-system inspired by the Perl meta-protocol API. It provides
a mimal layer between ES5 `Object.create` and `Object.defineProperties`, achieving
native encapsulation, getters- and setters and protection against un-intended
behaviour.

The basic API adds no other conventions then those introduced by `Object.create`.
This means that Wolperting knows how to handle ES5 `get` and `set`, however works
around the limitation of the second argument to `Object.create`.

Class attributes created by Wolperting are read-only by default, and objects
created by the Wolperting constructor are made __immutable__ after instantiation
using `Object.freeze`. The constructor populates attributes at instantiation,
transforming your object's prototype declaration as a de-facto API.

Additionally, it provides a number of built-in types providing a stable fundament
for type-checking in javascript.

See [types](doc/types.md) for more information on type-checks

Examples
--------

Wolperting tries not to impose any new coding style, for example the following
_"classic point example"_ can be converted from a native implementation simply
by replacing a couple lines of code:

### Simple point example

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

If you assign properties null, no type checking will occur beyond checking that
the property is actually `defined` when trying to set the attribute in the constructor.

However, adding `type annotations` this `Point` class will reveal a more useful
use case:

    var Point = create({
        x: Number,
        y: Number
    });


    assert.throws(function(){
        var p = new Point({ x: 'one', y: 2 });
    }, /value for x is not a Number/);

### using ES5 `get` and vanilla methods

Wolperting allows you to mix javascript native `get` and plain old functions as
methods without any additional syntax beyond `Object.defineProperty`.

    var create = Wolperting.create,
        Types = Wolperting.Types;

    var Point = create({
        x: Number,
        y: Number
    });

    var Circle = create({
        center: Point,

        radius: {
            $isa: Types.PositiveInt,
            value: 10 // set's the default just like Object.create
        },

        get circumference() {
            return (2 * this.radius) * Math.PI;
        },

        pointInCircle: function(x,y) {
            var dx = x - this.center.x,
                dy = y - this.center.y;

            return (Math.sqrt(dx) - Math.sqrt(dy)) < Math.sqrt(this.radius);
        }
    });

    var point = new Point({
        x: 5,
        y: 5
    });

    var circle = new Circle({
        center: point
    });

    assert.equal(circle.radius, 10);
    assert.equal(circle.circumference, 2 * circle.radius * Math.PI);
    assert.ok(circle.pointInCircle( 7, 7 ));
    assert.equal(circle.pointInCircle( 70, 70 ), false);

### Type annotations

Type annotations are nothing more then a simple function, that should return either
a `false` or an error string when the type does not match, or a `true`, `null` or `undefined`.

To distinguish a function as a type annotation, Wolperting assumes that you `name` your function:

    var Foo = create({
        bar: function Bar(value){
            return /bar/.test(value);
        }
    });

To make the attribute "blob" writable however we need to annotate the attribute using `$writable`:

    var Foo = create({
        bar: {
            $writable: true,
            $isa: function Blob(value){
                return /bar/.test(value);
            }
        }
    });

    var foo = new Foo();

    // ok, it's a bar
    thing.bar = 'any bar will do';

    thing.bar = 'a biz is not enough';
    // throws a TyperError







### The `$lazy` annotation

The above example could be optimized using _memoization_ for "expensive" calculations,
provided by the `$lazy` annotation:

    var Circle = create({
        center: Point,

        radius: Types.PositiveInt

        circumference: {
            $isa: Number,
            $lazy: function(){
                return (2 * this.radius) * Math.PI;
            }
        }
    });

In order to provide the `$lazy` annotation, note that we provided a type annotation
using the key `$isa`.

### Extending objects

Wolperting allows you to extend objects in a familiar way:

    var extend = Wolperting.extend,
        Types = Wolperting.Types;

    var Point3D = extend(Point, {
        z: Types.Float // better then "Number" it checks for NaN
    });

    var point = new Point3D({
        x: 1,
        y: 2,
        z: 3
    });
    assert.equal(point.x, 1);
    assert.equal(point.y, 2);
    assert.equal(point.z, 3);

And extend native javascript classes if desired _(assume done the async test callback)_

    var Email = function(message, subject ){
        this.message = message;
        this.subject = subject;
    };

    Email.prototype.send = function(to, done){
        // do sending and call done when done...
        done( to, this );
    };

    var SignupMail = extend( Email, {
        subject: String

        message: String

        // basic regex to check email sanity
        to: Types.RegExp(/[\w._%+-]+@[\w.-]+\.[\w]{2,4}/)

        send: function(done){
            Email.prototype.send.call( this, this.to, done );
        }
    });


    // Note that we are putting constructor arguments to the end
    var mail = new SignupMail( 'Welcome Friend', 'Welcome', { to: 'info@example.com' });

    assert.throws( function(){
        var mail = new SignupMail( 'Welcome Friend', 'Welcome', { to: 'example.com' });
        assert.ok( ! mail );
    }, /TypeError: Value example.com does not match: /);

    // note that the typeconstraint now fails for "inherited" properties
    assert.throws( function(){
        var mail = new SignupMail( null );
        assert.ok( ! mail );
    }, /TypeError: TypeConstraint Failed: value for message is not a String, it isa: object: null/);

    assert.equal( mail.to, 'info@example.com' );
    assert.equal( mail.message, 'Welcome Friend' );
    assert.equal( mail.subject, 'Welcome' );

    mail.send(function( to, email ){
        assert.equal( to, 'info@example.com' );
        assert.deepEqual( email, mail );

        done();
    });

Note that we achieved a number things here: first, we hardened our "legacy" code by
providing type annotations to our `SignupMail`. The class is frozen after the constructor
is done, allowing the original `Email` constructor to set our values as usual. We then
override the original `send` method to provide an adaptor to the legacy interface,
and added a sanity check for the legacy method to handle our new interface properly.

Extend also allows you to add yet another constructor, in this case, we adapt our
interface to allow for more sugar, using a custom constructor:

    var BaseMail = extend(function( message, subject, to ){
        this.to = to;
    }, SignupMail );

    var extmail = new BaseMail('Hello World', 'World says hello', 'info@example.com');

    assert.equal( extmail.to, 'info@example.com');

Note that these examples are also included in Wolperting's test suite.

