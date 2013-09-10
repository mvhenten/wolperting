var assert = require('assert'),
    _ = require('lodash'),
    Faker = require('Faker'),
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

    test('Instantiate Poo objects', function(done){
        _.range( 0, 999 ).forEach(function(){
            var x = _.random(0, 999),
                y = _.random(0, 999);

            var p = new Point({
                x: x,
                y: y
            });

            assert.equal( p.x, x, 'Constructor has set the expected value');
            assert.equal( p.y, y, 'Constructor has set the expected value');

            assert.throws(function(){
                p.x = Faker.Lorem.words();
            }, /Error: Attempting to write property x/);

            assert.throws(function(){
                p.y = Faker.Lorem.words();
            }, /Error: Attempting to write property y/);


            assert.throws(function(){
                var p = new Point({
                    x: Faker.Lorem.words(),
                    y: y
                });
            }, /TypeError: TypeConstraint Failed: value for x is not a/ );

     });

        done();
    })
});
