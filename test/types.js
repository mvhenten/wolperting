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

});
