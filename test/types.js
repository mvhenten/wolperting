'use strict';

var assert = require('assert'),
    _ = require('lodash'),
    Faker = require('Faker'),
    Types = require('../').Types;


suite('Types constructors and tests', function() {
    test('Types.Maybe checks type when defined', function() {
        var cases = [
            {
                label: 'null is ok for a maybe',
                type: String,
                value: null,
                expect: true,
            },
            {
                label: 'undefined is ok for a maybe',
                type: String,
                value: undefined,
                expect: true,
            },
            {
                label: 'a string is not a valid number (maybe)',
                type: Number,
                value: Faker.Lorem.sentence(),
                expect: /value for Maybe\[Number\] is not a Number/,
            },
            {
                label: 'tuple types are deeply checked',
                type: Types.Tuple(Number, Number),
                value: [1, (22).toString(2)],
                expect: /Wrong type in tuple: value for index 1 is not a Number/,
            }
        ];

        cases.forEach(function(testCase) {
            var type = Types.Maybe(testCase.type),
                got = type(testCase.value);


            if (testCase.expect instanceof RegExp) {
                assert.ok(testCase.expect.test(got), testCase.label);
                return;
            }

            assert.equal(got, testCase.expect, testCase.label);
        });
    });

    test('Types.[types] behave like expected', function() {
        var words = Faker.Lorem.words();

        var cases = [
            {
                label: 'Float is ok for random integers',
                type: Types.Float,
                value: _.random(0, 999),
                expect: true
            },
            {
                label: 'Float is ok for random floats',
                type: Types.Float,
                value: _.random(1, 999) / 10,
                expect: true
            },
            {
                label: 'Float is ok for zero',
                type: Types.Float,
                value: 0,
                expect: true
            },
            {
                label: 'Float is not ok for NaN',
                type: Types.Float,
                value: NaN,
                expect: false
            },
            {
                label: 'Enum only allowed one of the values provided',
                type: Types.Enum(words),
                value: _.shuffle(words)[0],
                expect: true
            },
            {
                label: 'First argument can be an array too',
                type: Types.Enum(words),
                value: _.shuffle(words)[0],
                expect: true
            },
            {
                label: 'Enum allows only enumerated values',
                type: Types.Enum(words),
                value: 'not a lorem ipsum',
                expect: /is not one of: /
            },
            {
                label: 'Regexp tests for matches',
                type: Types.RegExp(/\d+/),
                value: _.random(999),
                expect: true
            },
            {
                label: 'Regexp tests for matches',
                type: Types.RegExp(/\d+/),
                value: Faker.Lorem.words(),
                expect: /does not match: \/[\\]d+/
            },
            {
                label: 'Regexp checks for scalar values',
                type: Types.RegExp(/\w+/),
                value: Faker.Lorem.words(),
                expect: /does not match: \/[\\]w+/
            }
        ];

        cases.forEach(function(testCase) {
            var got = testCase.type(testCase.value);

            if (testCase.expect instanceof RegExp) {
                assert.ok(testCase.expect.test(got), testCase.label);
                return;
            }

            assert.equal(got, testCase.expect, testCase.label);
        });
    });

    test('Types.Tuple behave like expected', function() {
        var n = _.random(99),
            s = Faker.Lorem.sentence();
        var cases = [
            {
                label: 'Tuple is ok',
                type: Types.Tuple(Number, String),
                value: [_.random(99), Faker.Lorem.sentence()],
                expect: true
            },
            {
                label: 'Tuple length',
                type: Types.Tuple(Number, String),
                value: [],
                expect: 'Expected 2 values, got 0'
            },
            {
                label: 'Tuple checks types',
                type: Types.Tuple(Number, String),
                value: [_.random(99), n],
                expect: 'Wrong type in tuple: value for index 1 is not a String, it isa: number: ' + n
            },
            {
                label: 'Tuple types in the right order',
                type: Types.Tuple(Number, String),
                value: [s, _.random(99)],
                expect: 'Wrong type in tuple: value for index 0 is not a Number, it isa: string: ' + s
            },
            {
                label: 'Tuple types nested',
                type: Types.Tuple(Types.Tuple(Number, Number), String),
                value: [[1, 2], Faker.Lorem.sentence()],
                expect: true
            },
            {
                label: 'Tuple types nested are checked',
                type: Types.Tuple(Types.Tuple(Number, Number), String),
                value: [[], Faker.Lorem.sentence()],
                expect: 'Wrong type in tuple: Expected 2 values, got 0'
            }
        ];

        cases.forEach(function(testCase) {
            var got = testCase.type(testCase.value);
            assert.equal(got, testCase.expect, testCase.label);
        });
    });

    test('Types.Native behave like expected', function() {

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
                ok: false,
                fail: _.random(0, 999)
            },
            {
                error: 'value for thing is not a Function',
                type: Function,
                ok: function() {},
                fail: _.random(0, 999)
            }
        ];

        cases.forEach(function(testCase) {
            var type = Types.Native(testCase.type);

            assert.equal(type(testCase.fail), false);
        });
    });
});
