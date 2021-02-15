# Strom <!-- omit in toc -->

Simple streaming state manager. Inspired by [meiosis pattern](https://meiosis.js.org). Browser must support `new Map`, `new Set`, and `Symbol`.

```
npm install -S strom
```

- [Usage](#usage)
- [API](#api)
    - [`update(value: any): this;`](#updatevalue-any-this)
    - [`modify(func: Function): this;`](#modifyfunc-function-this)
    - [`unmodify(func: Function): this;`](#unmodifyfunc-function-this)
    - [`listen(func: Function): this;`](#listenfunc-function-this)
    - [`unlisten(func: Function): this;`](#unlistenfunc-function-this)
    - [`states(): any[];`](#states-any)
    - [`state(): any;`](#state-any)
    - [`flushStates(): void;`](#flushstates-void)
    - [`resetState(): void;`](#resetstate-void)
    - [`prevState(): void;`](#prevstate-void)
    - [`nextState(): void;`](#nextstate-void)
    - [`clone(): Strom;`](#clone-strom)
- [Types](#types)

## Usage

```jsx

const { Strom } = require('strom');

// or

import Strom from 'strom';

const stream = new Strom({ ...initialState }, { ...opts });

// Add a modifier
stream.modify((value, state) => {

    // Perform modifications here and return modified state
    return {
        ...state,
        ...value
    }
})

// Simple actions object store that pushes states to stream
const actions = {
    getThings: () => {
        stream.update({ things: [1,2,3] });
    },
    breakThings: () => {
        stream.update({ broken: true });
    }
};

export default (props) => {

    const [appState, setAppState] = useState(props.appState);

    useEffect(() => {

        const listener = (nextState) => {

            setAppState(nextState);
        };

        stream.listen(listener);

        return () => stream.unlisten(listener);
    }, [])

    useEffect(() => {

        actions.getThings();
    })

    return <>
        <My2ndComponent { ...props, state } />
        <My3rdComponent { ...props, state } />
    </>
}
```


## API


---
#### `update(value: any): this;`

Push an update


---
#### `modify(func: Function): this;`

Function that modifies state.
Pass a function declaration for ability to return `this.IGNORE`

returns Strom instance

```js
stream.modify((value, state, ignore) => {

    if (value.dontModify) {
        return ignore;
    }

    return merge(state, value);
})
```


---
#### `unmodify(func: Function): this;`

Removes a modifier when passed existing function reference

returns Strom instance


---
#### `listen(func: Function): this;`

Adds a listener that runs when stream update is executed

returns Strom instance



---
#### `unlisten(func: Function): this;`

Removes a listener when passed existing function reference

returns Strom instance



---
#### `states(): any[];`

Returns an array of all states



---
#### `state(): any;`

Returns current state


---
#### `flushStates(): void;`

Cleans all stored states, except current state.
State is reset if it wasn't on the current state



---
#### `resetState(): void;`

Sets the current state back to whatever it was. Useful for
where stepping forward and backwards between states and then
returning to your original state.



---
#### `prevState(): void;`

Go back 1 state. Does not work if `flushOnRead` is true.




---
#### `nextState(): void;`

Go forward 1 state. Does not work if `flushOnRead` is true.



---
#### `clone(): Strom;`

Creates a child instance of Strom. Receives parent's modifiers
and will update whever parent is updated. Adding modifiers and
listeners will not affect parent Strom instance.

returns `{Strom} Strom instance


## Types

```ts
type StromOptions = {
    /** Immediately execute state modifiers when added */
    execNewModifiers?: boolean;
    /** Immediately execute listeners when added */
    execNewListeners?: boolean;
    /** How many states changes to keep in memory */
    statesToKeep?: number;
    /** Removes states after reading */
    flushOnRead?: boolean;
    /** Parent stream. Only used for cloning. */
    parent?: Strom;
};
```

```ts
type ModifierFunction = (value: any, state?: any, ignore?: symbol) => any;
```


```ts
class Strom {
    _options: StromOptions | null;
    _sid: number;
    stateId(): number;
    _state: any;
    _modifiers: Set<ModifierFunction> | null;
    _listeners: Set<Function> | null;
    _states: Map<number, any> | null;
    _currentState: number | null;
    _latestState: number | null;
    _parent: Strom | null;
    constructor(state?: any, options?: StromOptions);
    private _addState;
    private _notifyListeners;
    update(value: any): this;
    modify(func: Function): this;
    unmodify(func: Function): this;
    listen(func: Function): this;
    unlisten(func: Function): this;
    states(): any[];
    state(): any;
    flushStates(): void;
    resetState(): void;
    private _stateStepper;
    prevState(): void;
    nextState(): void;
    clone(): Strom;
}
```