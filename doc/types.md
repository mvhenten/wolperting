isa(check, value, name)
-----------------------
Perform a type check and trows a TypeError if the check fails. Formats
the error message into a usable string. This function is mainly used
internally and exposed as a utility.



**Parameters**

**check**:  *function*,  A function that returns an error or one of `null`, `undefined`, `true`

**value**:  *Anything*,  The value to check

**name**:  *String*,  Name of the attribute that was checked (optional)

**Returns**

*Anything*,  The value if the check passes

assert(value, type, name)
-------------------------
Perform a type check and trows a TypeError if the check fails. Wraps the
type argument so that we can call `isa`.

Examples:
```javascript

Types.assert( 'foo', Number, 'thing' );
// throws: 'TypeError: TypeConstraint Failed: thing is not a Number it is a...'
```



**Parameters**

**value**:  *Anything*,  The value to check

**type**:  *Object*,  The type to check, can be a class, primitive, or named function

**name**:  *String*,  Name of the attribute that was checked (optional)

wrap(type)
----------
Wrap the first argument in one of the supported `Types` if needed, or returns
the original value if it is a function.



**Parameters**

**type**:  *Object*,  The type to check, can be a class, primitive, or named function

**Returns**

*Function*,  A function that performs a type check

isPlainFunction(value)
----------------------
Check wether the first argument is a function with an empty prototype, e.g.
a plain function ( method or typecheck that should not be instantiated using `new`)



**Parameters**

**value**:  *Function*,  A function

**Returns**

*Boolean*,  plain True if the function directly inherits from Function

Any(value)
----------
The Any type. Checks that the value is at least defined



**Parameters**

**value**:  *Anything*,  The value to check

**Returns**

*Boolean*,  plain True if the value is defined

Instance(type)
--------------
Create an instance check



**Parameters**

**type**:  *Type*,  A javascript function the value should be an `instanceof`

**Returns**

*Boolean|String*,  ok True if the check is successful, or an error string

Native(type)
------------
Create a check for one of the primitives: Object,Number,String,Date,Function,Boolean



**Parameters**

**type**:  *Type*,  A javascript primitive the value should adhere to

**Returns**

*Boolean*,  ok True if the check is successfull

Object(value)
-------------
Native check for Object. Mostly for symetry, you may find PlainObject
more usefull. Wraps lodash' isObject



**Parameters**

**value**:  *Any*,  value to check

**Returns**

*Boolean*,  ok True if the check is successfull

Number(value)
-------------
Native check for Number. Also checks against isNaN



**Parameters**

**value**:  *Any*,  value to check

**Returns**

*Boolean*,  ok True if the check is successfull

String(value)
-------------
Native check for String. Performs a simple `typeof`



**Parameters**

**value**:  *Any*,  value to check

**Returns**

*Boolean*,  ok True if the check is successfull

Date(value)
-----------
Native check for Date. Wraps lodash `isDate`



**Parameters**

**value**:  *Any*,  value to check

**Returns**

*Boolean*,  ok True if the check is successfull

Function(value)
---------------
Native check for Function. Kept mostly for symetry



**Parameters**

**value**:  *Any*,  value to check

**Returns**

*Boolean*,  ok True if the check is successfull

Boolean(value)
--------------
Native check for Boolean. Performs a simple `typeof`



**Parameters**

**value**:  *Any*,  value to check

**Returns**

*Boolean*,  ok True if the check is successfull

Float(value)
------------
Check for Float. wraps lodash isNumber and checks for isNaN



**Parameters**

**value**:  *Any*,  value to check

**Returns**

*Boolean*,  ok True if the check is successfull

Int(value)
----------
Check for Int, both negative and positive



**Parameters**

**value**:  *Any*,  value to check

**Returns**

*Boolean*,  ok True if the check is successfull

PositiveInt(value)
------------------
Check for PositiveInt



**Parameters**

**value**:  *Any*,  value to check

**Returns**

*Boolean*,  ok True if the check is successfull

PlainObject(value)
------------------
Checks for PlainObject, e.g. an object that directly inherits from `Object`,
e.g. {}.



**Parameters**

**value**:  *Any*,  value to check

**Returns**

*Boolean*,  ok True if the check is successfull

Enum(values)
------------
Create an enumerated type check. The value checked by Enum must be one of
the listed arguments to this function.

Not that the values can either be provided as an Array or by overloading
the function.



**Parameters**

**values**:  *Array*,  Values this enumerate checks again.

**Returns**

*Boolean|String*,  ok True if the check is successfull, or an error string

Tuple(values)
-------------
Create a Tuple type check. The values checked by Tuple must be in the right
order and of the right type. Tuples may be nested, and an efford is made to
create error messages that make some sense.

Examples:
```javascript
var type = Types.Tuple( [ Number, Number ]);

console.log( type( [1, 2] ) );
// returns true

console.log( type( ['a', 2] ) );
// returns something like "Wrong type in type: index 0 is not a..."

````



**Parameters**

**values**:  *Array*,  Values this tuple checks again.

**Returns**

*Boolean|String*,  ok True if the check is successfull, or an error string

Maybe(type)
-----------
Create a Maybe type check. Maybe types must either be null or undefined,
or a value that passes the supplied `Type` check.

Examples:
```javascript
var type = Types.Maybe( Number );

console.log( type(null) );
// returns true

console.log( type(1) );
// returns true

console.log( type('1') );
// returns an error string

````



**Parameters**

**type**:  *Type*,  TypeCheck if value is not null or undefined

**Returns**

*Boolean|String*,  ok True if the check is successfull, or an error string

DuckType(name, typedef)
-----------------------
Create a DuckType type check. First argument is optional, and may be
swapped with the second when omitted. The type parameter must be a plain
object of key => type values, where the `Type` values will be wrapped as
valid Wolperting types when needed.

Examples:

```javascript
var type = Types.DuckType({ name: String, age: Number });

console.log( type({ name: 'Hans', age: 89 }) );
// returns true

console.log( type({ name: 90, age: 'Hans' }) );
// returns an error string

```


**Parameters**

**name**:  *String*,  Optional name for this DuckType to identify it with

**typedef**:  *Object*,  Plain object of name => Type pairs

**Returns**

*Boolean|String*,  ok True if the check is successfull, or an error string

RegExp(values)
--------------
Create a RegExp type check. The first argument to this function must be a
regular expression that will be used to validate against.

Examples:

```javascript
var type = Types.RegExp( /\d+/ );

console.log( type(1) );
// returns true

console.log( type( '1.34' ) );
// returns something like "Value 1.34 does not matc: /\d+/"

```


**Parameters**

**values**:  *Array*,  Values this tuple checks again.

**Returns**

*Boolean|String*,  ok True if the check is successfull, or an error string

