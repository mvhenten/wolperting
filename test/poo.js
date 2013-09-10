var assert = require('assert'),
    _ = require('lodash'),
    Faker = require('Faker'),
    Poo = require('../');


suite('poo constructors and tests', function() {
    var Point = Poo.create({
        x: {
            $isa: Number,
        },
        y: {
            $isa: Number
        }
    });

    var Line = Poo.create({
        start: {
            $isa: Point
        },

        end: {
            $isa: Point
        }
    });

    test('Instantiate Poo objects', function() {
        _.times(99, function() {
            var x = _.random(0, 999),
                y = _.random(0, 999);

            x = 0;


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
            }, /TypeError: TypeConstraint Failed: value for x is not a/);

        });
    });

    test('With native getters allowed', function() {
        _.times(99, function() {
            var first = Faker.Name.firstName();
            var last = Faker.Name.lastName();

            var Person = Poo.create({
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
        _.times(99, function() {
            var words = Faker.Lorem.words().join(' ');

            var Thing = Poo.create({
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
        _.times(99, function() {
            var words = Faker.Lorem.words().join(' ');

            var Thing = Poo.create({
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

});
