# Strom

Simple streaming state manager. Inspired by [meiosis pattern](https://meiosis.js.org). Browser must support `new Map`, `new Set`, and `Symbol`.

```
npm install -S strom
```

### Usage

```jsx

const stream = strom({ ...initialState });

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
        stream({ things: [1,2,3] });
    },
    breakThings: () => {
        stream({ broken: true });
    }
};

class MyApp extends Component {

    constructor(props) {
        super(props);

        // Set initial state
        this.state = props.state;

        // When states are pushed, setState
        update.listen((nextState, prevState) => {

            this.setState(nextState);
        });
    }

    componentDidMount() {

        // Get things after mount
        this.actions.getThings();
    }

    render() {

        // Pass state and actions down to child components
        const { state } = this;
        return <>
            <My2ndComponent { ...props, state } />
            <My3rdComponent { ...props, state } />
        </>
    }
};

// Initialize component with state
<MyApp state={ ...initialState } actions={ actions } />

```


### API

To access the API you must execute `strom` in order to create a state stream. If you do not pass an initial value, an empty object will be used.

```js
const stream = strom();
// typeof stream === 'function'
```

You can now pass states to your stream.

```js
stream({ abc: 123 });
```


##### `stream.modify`

Adds a state modifier. State will be modified to this function's return value everytime a new state is passed.

```js
stream.modify((value, currentState) => {

    value.justBecause = true;

    return value;
});
```

Alternative, you can create modifiers that don't actually modify state. Instead, they just introspect the current state. You accomplish this by returning then 3rd argument passed to modifiers, `ignore`. This may also be useful for cases when you don't want to update state because of conditions.

```js
stream.modify(function (value, currentState, ignore) {

    pushToInspector(currentState);

    return ignore;
})
```

##### `stream.unmodify`

Removes a modifier function from stream.


```js
const modifier = (value, currentState) => {

    return {
        ...currentState,
        ...value
    }
};

// adds the modifier
stream.modify(modifier);

// removes the modifier
stream.unmodify(modifier);
```


##### `stream.listen`

Attaches a listener function. Each listener is executed and passed `currentState` and `previousState` after modifiers have modified the state.

```js
stream.listen((currentState, previousState) => {

    this.setState(currentState);
})
```

##### `stream.unlisten`

Removes a listener function from stream. This is useful for cases where you have to unmount a component, or no longer want the side effect of having this listener executing.


```js
const listener = (value, currentState) => {

    value.justBecause = true;

    return value;
};

// adds the listener
stream.listen(listener);

// removes the listener
stream.unlisten(listener);
```

##### `stream.states`

Returns an array of previous states.

```js
const arr = stream.states();
```
