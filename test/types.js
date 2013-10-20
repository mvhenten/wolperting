'use strict';

var assert = require('assert'),
    _ = require('lodash'),
    Faker = require('Faker'),
    Types = require('../').Types;


suite('poo constructors and tests', function() {
    test('Types.Type is a constructor', function() {
        var type = Types.Type(function(value) {
            return value;
        });

        assert.ok(type instanceof Types.Type, 'Types.Type is a constructor for Type');
        assert.ok(type.isa(true), true, 'isa returns true');

        assert.throws(function() {
            type.isa(false);
        },
            /not a Anonymous Type/);
    });

    test('Types.Type is frozen', function() {
        var type = Types.Type(function(value) {
            return value;
        });

        assert.ok(type.isa(true), true, 'isa returns true');

        assert.throws(function() {
            type.isa = function() {};
        }, /Cannot assign/);

        assert.throws(function() {
            type.foo = function() {};
        }, /object is not extensible/);
    });

    test('Types.Type with name', function() {
        var type = Types.Type('Foo', function(value) {
            return value;
        });

        assert.ok(type instanceof Types.Type, 'Types.Type is a constructor for Type');
        assert.ok(type.isa(true), true, 'isa returns true');

        assert.throws(function() {
            type.isa(false);
        },
            /not a Foo/);
    });

    test('Types.Type with custom error', function() {
        var type = Types.Type('Foo', function(value) {
            return value;
        });

        assert.ok(type instanceof Types.Type, 'Types.Type is a constructor for Type');
        assert.ok(type.isa(true), true, 'isa returns true');

        assert.throws(function() {
            type.isa('Not the expected value for Foo');
        },
            /Not the expected value for Foo/);
    });

    test('Types.[types] behave like expected', function() {
        var words = Faker.Lorem.words();

        var cases = [
            {
                label: 'Float is ok for random integers',
                type: Types.Float,
                value: _.random(0, 999),
                throws: false
            },
            {
                label: 'Float is ok for random floats',
                type: Types.Float,
                value: _.random(1, 999) / 10,
                throws: false
            },
            {
                label: 'Float is ok for zero',
                type: Types.Float,
                value: 0,
                throws: false
            },
            {
                label: 'Float is not ok for NaN',
                type: Types.Float,
                value: NaN,
                throws: /number: NaN/
            },
            {
                label: 'Enum only allowed one of the values provided',
                type: Types.Enum.apply(null, words),
                value: _.shuffle(words)[0],
                throws: false
            },
            {
                label: 'First argument can be an array too',
                type: Types.Enum(words),
                value: _.shuffle(words)[0],
                throws: false
            },
            {
                label: 'Enum allows only enumerated values',
                type: Types.Enum(words),
                value: 'not a lorem ipsum',
                throws: /TypeError: Value not a lorem ipsum is not one of/
            },
            {
                label: 'Regexp tests for matches',
                type: Types.RegExp(/\d+/),
                value: _.random(999),
                throws: false
            },
            {
                label: 'Regexp tests for matches',
                type: Types.RegExp(/\d+/),
                value: Faker.Lorem.words(),
                throws: /TypeError/
            },
            {
                label: 'Regexp checks for scalar values',
                type: Types.RegExp(/\w+/),
                value: Faker.Lorem.words(),
                throws: /does not match: /
            }
        ];

        cases.forEach(function(testCase) {
            assert.ok(testCase.type instanceof Types.Type, testCase.label);

            if (testCase.throws) {
                assert.throws(function() {
                    testCase.type.isa(testCase.value);
                },
                    testCase.throws,
                    testCase.label);
                return;
            }

            assert.ok(testCase.type.isa(testCase.value), testCase.label);
        });
    })

    test('Types.Tuple behave like expected', function() {
        var cases = [
            {
                label: 'Tuple is ok',
                tuple: Types.Tuple(Number, String),
                value: [_.random(99), Faker.Lorem.sentence()]
            },
            {
                label: 'Tuple length',
                tuple: Types.Tuple(Number, String),
                value: [],
                throws: /Wrong length for tuple/
            },
            {
                label: 'Tuple types',
                tuple: Types.Tuple(Number, String),
                value: [_.random(99), _.random(99)],
                throws: /TypeError/
            },
            {
                label: 'Tuple types in the right order',
                tuple: Types.Tuple(Number, String),
                value: [Faker.Lorem.sentence(), _.random(99)],
                throws: /TypeError/
            },
            {
                label: 'Tuple types nested',
                tuple: Types.Tuple(Types.Tuple(Number, Number), String),
                value: [[1, 2], Faker.Lorem.sentence()],
            },
            {
                label: 'Tuple types nested are checked',
                tuple: Types.Tuple(Types.Tuple(Number, Number), String),
                value: [[], Faker.Lorem.sentence()],
                throws: /Wrong length for tuple/
            }
        ];

        cases.forEach(function(testCase) {
            if (testCase.throws) {
                assert.throws(function() {
                    testCase.tuple.isa(testCase.value);
                }, testCase.throws, testCase.label);
                return;
            }
            assert.ok(testCase.tuple.isa(testCase.value), testCase.label);
        });

    });


    test('Types.Native behave like expected', function() {
        var Instance = function() {
            this.stuff = Faker.Lorem.words()
        };

        var cases = [
            {
                error: 'value for thing is not a Number',
                type: Number,
                ok: _.random(0, 99),
                fail: Faker.Lorem.sentence()
            },
            {
                error: 'value for thing is not a Object',
                type: Object,
                ok: {},
                fail: Faker.Lorem.sentence()
            },
            {
                error: 'value for thing is not a Date',
                type: Date,
                ok: new Date(),
                fail: Faker.Lorem.sentence()
            },
            {
                error: 'value for thing is not a String',
                type: String,
                ok: Faker.Lorem.sentence(),
                fail: _.random(0, 999)
            },
            {
                error: 'value for thing is not a Boolean',
                type: Boolean,
                ok: _.random(0, 1) ? true : false,
                fail: _.random(0, 999)
            },
            {
                error: 'value for thing is not a Function',
                type: Function,
                ok: function() {},
                fail: _.random(0, 999)
            },
            {
                error: 'not an instanceof',
                type: Instance,
                ok: new Instance(),
                fail: _.random(0, 999)
            },
        ];

        cases.forEach(function(testCase) {
            var type = Types.Native(testCase.type);
            assert.ok(type.isa(testCase.ok));

            assert.throws(function() {
                type.isa(testCase.fail, 'thing')
            }, new RegExp(testCase.error));
        });
    });
});
