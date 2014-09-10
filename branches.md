# Lib Branches

These branches have the purpose of trying new ways of encapsulating and using the library.

## Master (Object encapsulation)

**Encapsulation:** Uses an object with the vars and functions, where the functions have callbacks
**Usage:** `libraryName.varOrFunction()`

### Pros

* Easy?
* Useful if you want a Singleton?

### Cons

* Only one instance

### When to use

.....

## Refactor_new ("Class" encapsulation - using new)

**Encapsulation:** Export the library as a function with "class" variables and prototype functions, where functions have callbacks
**Usage:** `var hs = new libraryName()`, and `hs.varOrFunction()`


### Pros

* Multiple instances
* Prototype inheritance?

### Cons

* Not sure what the "class" does when you instanciate it?

### When to use
....

## Refactor_events (Emit 'connected' and 'data' events)

**Encapsulation:** The
**Usage:** `var hs = libraryName.connectHS(args)` and listen to events `hs.on('connected')` or `hs.on('dataN')`

### Pros

### Cons

### When to use