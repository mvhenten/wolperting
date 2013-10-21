'use strict';

var assert = require('assert'),
    _ = require('lodash'),
    util = require('util'),
    Faker = require('Faker'),
    Wolperting = require('../');


suite('Wolperting constructors and tests', function() {
    var Point = Wolperting.create({
        x: {
            $isa: Number,
        },
        y: {
            $isa: Number
        }
    });

    test('Instantiate Wolperting objects', function() {
        _.times(100, function() {
            var x = _.random(-999, 999),
                y = _.random(-999, 999);

            var p = new Point({
                x: x,
                y: y
            });

            assert.equal(p.x, x, 'Constructor has set the expected value');
            assert.equal(p.y, y, 'Constructor has set the expected value');

            assert.throws(function() {
                p.x = Faker.Lorem.words();
            }, /Error: Attempting to write property x/);

            assert.throws(function() {
                p.y = Faker.Lorem.words();
            }, /Error: Attempting to write property y/);


            assert.throws(function() {
                var p = new Point({
                    x: Faker.Lorem.words(),
                    y: y
                });
            }, /TypeError: TypeConstraint Failed: /);

        });
    });

    test('With custom type isa', function() {
        _.times(100, function() {
            var value = _.random(-999, 999);

            var Thing = Wolperting.create({
                count: {
                    $writable: true,
                    $isa: Wolperting.Type(function(value) {
                        return (typeof value == 'number') && value >= 0;
                    }),
                }
            });

            var thing = new Thing();

            if (value < 0) {
                assert.throws(function() {

                    thing.count = value;
                }, /TypeError: TypeConstraint Failed: value for count is not a/);
            } else {
                thing.count = value;
                assert.equal(thing.count, value);

            }
        });
    });


    test('With lazy build', function() {
        var Circle = Wolperting.create({
            center: {
                $isa: Point
            },

            radius: {
                $isa: Wolperting.Type(function() {
                    return true;
                })
            },

            circumference: {
                $writable: false,
                $lazy: function() {
                    return (2 * this.radius) * Math.PI;
                }
            }
        });

        var x = _.random(-999, 999),
            y = _.random(-999, 999),
            r = _.random(1, 999);

        var p = new Point({
            x: x,
            y: y
        });

        var circle = new Circle({
            center: p,
            radius: r
        });


    });

    test('With native getters allowed', function() {
        _.times(100, function() {
            var first = Faker.Name.firstName();
            var last = Faker.Name.lastName();

            var Person = Wolperting.create({
                first: {
                    $isa: String
                },

                last: {
                    $isa: String
                },

                get name() {
                    return [this.last, this.first].join(', ');
                }
            });

            var john = new Person({
                first: first,
                last: last
            });

            assert.equal(john.name, [last, first].join(', '));

        });
    });

    test('With native default value allowed', function() {
        _.times(100, function() {
            // words or empty string
            var words = Faker.Lorem.words().slice(0, _.random(10)).join(' ');

            var Thing = Wolperting.create({
                name: {
                    $isa: String,
                    value: words
                }
            });

            var thing = new Thing();

            assert.equal(thing.name, words);

        });
    });

    test('With native method allowed', function() {
        _.times(100, function() {
            var words = Faker.Lorem.words().join(' ');

            var Thing = Wolperting.create({
                name: {
                    $isa: String,
                    value: words
                },
                sayHello: function() {
                    return this.name + ' says "hello"';
                }
            });

            var thing = new Thing();

            assert.equal(thing.name, words);
            assert.equal(thing.sayHello(), thing.name + ' says "hello"');
        });
    });

    test('With Wolperting type enum', function() {
        _.times(100, function() {
            var value = _.random(-10, 10),
                values = [1, 2, 3];

            var Thing = Wolperting.create({
                count: {
                    $writable: true,
                    $isa: Wolperting.Types.Enum(values)
                }
            });

            var thing = new Thing();

            if (values.indexOf(value) === -1) {
                assert.throws(function() {
                    thing.count = value;
                }, /TypeError: Value [-]?\d+ is not one of/);
            } else {
                thing.count = value;
                assert.equal(thing.count, value);
            }
        });
    });

    test('Wolperting extends plain js', function() {
        var Parent = function(args) {
            this._thing = args;
        }

        Parent.prototype = Object.create({}, {
            thing: {
                get: function() {
                    return this._thing;
                }
            }
        });

        var Child = Wolperting.extend(Parent, {
            name: {
                $isa: String
            }
        });


        _.times(100, function() {
            var words = Faker.Lorem.words().join(' '),
                args = {
                    name: words
                };

            var parent = new Parent(args),
                child = new Child(args);

            assert.deepEqual(parent.thing, args);
            assert.deepEqual(child.thing, args);
        });
    });

    test('Wolperting extends plain js vanilla', function() {
        var Parent = function(args) {
            this._thing = args;
        }

        Parent.prototype = {
            get thing() {
                return this._thing;
            }
        };

        var Child = Wolperting.extend(Parent, {
            name: {
                $isa: String
            }
        });


        _.times(1000, function() {
            var words = Faker.Lorem.words().join(' '),
                args = {
                    name: words
                };

            var parent = new Parent(args),
                child = new Child(args);

            assert.deepEqual(parent.thing, args);
            assert.deepEqual(child.thing, args);
        });
    });

    test('Wolperting handles simple declarations', function() {
        var Any = Wolperting.create({
            any: null
        });

        var a = new Any({
            any: 42
        });

        assert.equal(a.any, 42);
    });
});
