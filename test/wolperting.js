'use strict';

var assert = require('assert'),
    _ = require('lodash'),
    Faker = require('Faker'),
    Wolperting = require('../');


suite('Wolperting constructors and tests', function() {
    test('REGRESSION: getters must not be triggerd in create', function() {
        var Thing = Wolperting.create({
            get cantouchthis() {
                throw new Error('Can\'t touch this');
            }
        });

        assert.throws(function() {
            var me = new Thing();
            return me.cantouchthis;
        }, /Can't touch this/);
    });

    var Point = Wolperting.create({
        x: Number,
        y: Number
    });

    test('Example from the readme: point', function() {
        var Point = Wolperting.create({
            x: null,
            y: null
        });

        var ax = _.random(0, 99),
            ay = _.random(0, 99),
            bx = _.random(0, 99),
            by = _.random(0, 99);

        var a = new Point({
            x: ax,
            y: ay
        });
        var b = new Point({
            x: bx,
            y: by
        });

        assert.equal(a.x, ax);
        assert.equal(a.y, ay);

        assert.equal(b.x, bx);
        assert.equal(b.y, by);
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
                assert.ok(!p);
            }, /TypeError: TypeConstraint Failed: /);

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

    test('With native getters allowed', function() {
        _.times(100, function() {
            var first = Faker.Name.firstName();
            var last = Faker.Name.lastName();

            var Person = Wolperting.create({
                first: String,
                last: String,

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

    test('With custom type isa', function() {
        _.times(100, function() {
            var value = _.random(-999, 999);

            var Thing = Wolperting.create({
                count: {
                    $writable: true,
                    $isa: function PositiveInt(value) {
                        return (typeof value == 'number') && value >= 0;
                    },
                }
            });

            var thing = new Thing();

            thing.count = 42;

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
            center: Point,

            radius: function True() {
                return true;
            },

            circumference: {
                $isa: Number,
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

        assert.equal(circle.circumference, r * 2 * Math.PI);
    });



    test('Wolperting extends plain js', function() {
        var Parent = function(args) {
            this._thing = args;
        };

        Parent.prototype = Object.create({}, {
            thing: {
                get: function() {
                    return this._thing;
                }
            }
        });

        var Child = Wolperting.extend(Parent, {
            name: String
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
        };

        Parent.prototype = {
            get thing() {
                return this._thing;
            }
        };

        var Child = Wolperting.extend(Parent, {
            name: String
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

    test('Wolperting handles simple declarations', function() {
        var Any = Wolperting.create({
            any: null
        });

        var a = new Any({
            any: 42
        });

        assert.equal(a.any, 42);
    });

    test('Example code from the readme: circle and point', function() {
        var create = Wolperting.create,
            Types = Wolperting.Types;

        var Point = create({
            x: Number,
            y: Number
        });

        assert.throws(function() {
            var p = new Point({
                x: 'one',
                y: 2
            });

            assert.ok(!p);
        }, /value for x is not a Number/);

        var Circle = create({
            center: Point,

            radius: {
                $isa: Types.PositiveInt,
                value: 10 // set's the default just like Object.create
            },

            get circumference() {
                return (2 * this.radius) * Math.PI;
            },

            pointInCircle: function(point) {
                Types.assert(point, Point, 'point'); // TypeError if point isn't a Point

                var dx = point.x - this.center.x,
                    dy = point.y - this.center.y;

                return (Math.sqrt(dx) - Math.sqrt(dy)) < Math.sqrt(this.radius);
            }
        });

        var point = new Point({
            x: 5,
            y: 5
        }),
            circle = new Circle({
                center: point
            });

        assert.equal(circle.radius, 10);
        assert.equal(circle.circumference, 2 * circle.radius * Math.PI);
        assert.ok(circle.pointInCircle(new Point({
            x: 7,
            y: 7
        })));
        // type check asserts valid input
        assert.throws(function() {
            circle.pointInCircle(5, 5);
        }, /TypeError: TypeConstraint Failed: 5 not an instanceof/);
    });

    test('Example code from the readme: extending point', function() {
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
    });

    test('example code from the readme: extending native js: email', function(done) {
        var extend = Wolperting.extend,
            Types = Wolperting.Types;

        var Email = function(message, subject) {
            this.message = message;
            this.subject = subject;
        };

        Email.prototype.send = function(to, done) {
            // do sending and call done when done...
            done(to, this);
        };

        var SignupMail = extend(Email, {
            subject: String,

            message: String,

            to: Types.RegExp(/[\w._%+-]+@[\w.-]+\.[\w]{2,4}/),

            send: function(done) {
                Email.prototype.send.call(this, this.to, done);
            }
        });

        // Note that we are putting constructor arguments to the end
        var mail = new SignupMail('Welcome Friend', 'Welcome', {
            to: 'info@example.com'
        });

        assert.throws(function() {
            var mail = new SignupMail('Welcome Friend', 'Welcome', {
                to: 'example.com'
            });
            assert.ok(!mail);
        }, /TypeError: TypeConstraint Failed: Value example.com does not match: /);

        assert.throws(function() {
            var mail = new SignupMail(null);
            assert.ok(!mail);
        }, /TypeError: TypeConstraint Failed: value for message is not a String, it isa: object: null/);

        assert.equal(mail.to, 'info@example.com');
        assert.equal(mail.message, 'Welcome Friend');
        assert.equal(mail.subject, 'Welcome');

        var BaseMail = extend(function(message, subject, to) {
            this.to = to;
        }, SignupMail);

        var extmail = new BaseMail('Hello World', 'World says hello', 'info@example.com');

        assert.equal(extmail.to, 'info@example.com');

        mail.send(function(to, email) {
            assert.equal(to, 'info@example.com');
            assert.deepEqual(email, mail);

            done();
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
                }, /TypeError: TypeConstraint Failed: Value [-]?\d+ is not one of/);
            } else {
                thing.count = value;
                assert.equal(thing.count, value);
            }
        });
    });

    test('various type of attribute defenitions', function() {
        // when defining a simple value attribute,
        // it becomes locked

        var create = Wolperting.create,
            Types = Wolperting.Types;

        var n = _.random(99);

        var cases = [
            {
                label: 'Simple value attributes become read-only properties no sugar',
                proto: {
                    one: n
                },
                attrs: {
                    one: n
                },
                args: {
                    ok: undefined,
                    throws: {
                        one: n + 1
                    }
                },
                readonly: {
                    one: n
                }
            },
            {
                label: 'Primitive attributes become read-only properties with sugar',
                proto: {
                    one: Number
                },
                attrs: {
                    one: n
                },
                args: {
                    ok: {
                        one: n
                    },
                    throws: {
                        one: Faker.Lorem.sentence()
                    }
                },
                readonly: {
                    one: _.random(99)
                }
            },
            {
                label: 'Simple function attributes become read-only properties no sugar',
                proto: {
                    method: function() {
                        return n;
                    }
                },
                args: {
                    ok: undefined,
                    throws: {
                        method: _.random(99)
                    }
                },
                methods: {
                    method: n
                },
                readonly: {
                    method: function() {}
                }
            },
            {
                label: 'Type attributes become read-only properties with sugar',
                proto: {
                    one: Types.Int
                },
                attrs: {
                    one: n
                },
                args: {
                    ok: {
                        one: n
                    },
                    throws: {
                        one: Faker.Lorem.sentence()
                    }
                },
                readonly: {
                    one: _.random(99)
                }
            },
            {
                label: 'One bag to throw it all in',
                proto: {
                    one: n,
                    two: Number,
                    three: Types.Int,
                    method: function() {
                        return n;
                    }
                },
                attrs: {
                    one: n,
                    two: n,
                    three: n
                },
                args: {
                    ok: {
                        two: n,
                        three: n
                    },
                    throws: {
                        one: n,
                        three: Faker.Lorem.sentence(),
                        two: Faker.Lorem.sentence(),
                        method: _.random(99)
                    }
                },
                readonly: {
                    two: _.random(99),
                    three: _.random(99),
                    method: function() {}
                },
                methods: {
                    method: n
                },
            },
        ];

        var _testIfConstructorThrows = function(testCase) {
            if (!testCase.args.throws) return;

            var Class = create(testCase.proto);

            assert.throws(function() {
                var instance = new Class(testCase.args.throws);
                assert.equal(instance, null);
            }, /TypeError/, 'cannot instantiate this class with: ' + testCase.args.throws);
        };

        var _testIfAttributesAreImmutable = function(testCase) {
            var Class = create(testCase.proto);

            var instance = new Class(testCase.args.ok);

            _.each(testCase.readonly, function(value, key) {
                assert.throws(function() {
                    instance[key] = value;
                });
            });
        };

        var _testIfAttrsAreReadable = function(testCase) {
            var Class = create(testCase.proto);

            _.each(testCase.attrs, function(value, key) {
                var instance = new Class(testCase.args.ok);
                assert.equal(instance[key], value);
            });
        };

        var _testIfMethodsAreCallable = function(testCase) {
            var Class = create(testCase.proto);

            _.each(testCase.methods, function(value, key) {
                var instance = new Class(testCase.args.ok);
                assert.equal(instance[key](), value);
            });
        };


        cases.forEach(function(testCase) {
            _testIfConstructorThrows(testCase);
            _testIfAttributesAreImmutable(testCase);
            _testIfAttrsAreReadable(testCase);
            _testIfMethodsAreCallable(testCase);

        });

    });
});
