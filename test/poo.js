var assert = require('assert'),
    _ = require('lodash'),
    Poo = require('../');


suite('poo constructors and tests', function(){
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

    test('Instantiate Poo objects', function(){
        var x = _.random(), y = _.random();

        var p = new Point({
            x: x,
            y: x
        });

        assert.equal( p.x, x );
        assert.equal( p.y, y );

    })
});
