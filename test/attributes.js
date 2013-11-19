'use strict';

var assert = require('assert'),
    Attributes = require('../lib/attributes'),
    Types = require('../').Types;


suite('Attributes.normalize', function() {
    test('expected normalization', function() {

        var Foo = function() {};
        Foo.prototype = {
            get thing() {
                return 1;
            }
        };

        var method = function() {
            // just an emtpy function
        };

        var type = function Thing() {
            // named function passes as a type
        };

        var cases = [
            {
                val: null,
                expect: {
                    $isa: Types.Any
                }
        },
            {
                val: {},
                expect: {
                    $isa: Types.Any
                }
        },
            {
                val: method,
                expect: method
        },
            {
                val: Foo,
                expect: {
                    $isa: Types.Instance(Foo)
                },
                shallow: true
        },
            {
                val: Number,
                expect: {
                    $isa: Types.Number
                },
        },
            {
                val: type,
                expect: {
                    $isa: type
                },
        },
            {
                val: {
                    $isa: type,
                },
                expect: {
                    $isa: type
                },
        },
            {
                val: {
                    $isa: Number
                },
                expect: {
                    $isa: Types.Number
                }
        },
            {
                val: {
                    $isa: method
                },
                expect: {
                    $isa: method
                }
        },
            {
                val: {
                    $isa: Foo
                },
                expect: {
                    $isa: Types.Instance(Foo)
                },
                shallow: true
        },
            {
                val: 42,
                expect: {
                    value: 42
                }
        }
    ];

        cases.forEach(function(testCase) {
            if (testCase.shallow) {
                assert.equal(Attributes.normalize(testCase.val) + '', testCase.expect);
                return;
            }

            assert.deepEqual(Attributes.normalize(testCase.val), testCase.expect);
        });

    });
});
