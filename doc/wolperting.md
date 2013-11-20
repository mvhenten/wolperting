extend(spr, defintion)
----------------------
Create a new Wolperting object that inherits it's prototype from a super
class. see [introduction](index.html)

Examples:

var Parent = function(){ console.log('i am parent') }
var Child = Wolperting.extend( Parent, { get name(){  return 'foo' } });



**Parameters**

**spr**:  *function*,  Parent class

**defintion**:  *Object*,  A plain object that defines the new attributes

create()
--------
Create a new Wolperting Object. see [introduction](index.html)


