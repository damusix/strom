const isUndefined = (val) => val === undefined;
const assertFunction = (msg, func) => {

    if (typeof func !== 'function') {

        throw TypeError(`${msg} must be a function`);
    }
}

// For skipping state modification
const IGNORE = Symbol();

/**
 * Creates a stream of states.
 * @param {*} state An initial state
 * @returns {function} A function that pushes updates to state
 */
const stream = (state = {}) => {

    // Holds state modifiers
    const modifiers = new Set();

    // Holds listeners
    const listeners = new Set();

    // Holds states
    const states = new Map();

    // Initialize state to state holder
    if (!isUndefined(state)) {

        states.set(state, state);
    }

    // Manage function takes a value and modifies
    const manager = (value) => {

        const oldState = state;

        // If value is not undefined, run modifiers
        // Otherwise we run current state
        if (!isUndefined(value)) {

            // If no modifiers present, state will be overwritten
            if (modifiers.size === 0) {

                state = value;
            }
            else {

                for (const modifier of modifiers) {

                    const modified = modifier(value, state, IGNORE);

                    // Ignore modification if ignore symbol
                    if (modified === IGNORE) {
                        continue;
                    }

                    if (!isUndefined(modified)) {

                        state = modified;
                    }
                }
            }

            // Save new state to holder
            states.set(state, state);
        }

        // Notify listeners
        for (const listener of listeners) {
            listener(state, oldState);
        }
    }

    /**
     * Function that modifies state.
     * Pass a function declaration for ability to return `this.IGNORE`
     * @param {function} func
     * @returns {function} stream manager
     */
    manager.modify = (func) => {

        assertFunction('modifier', func);

        // If initial state was passed, execute function with state
        if (!isUndefined(state)) {

            func(state);
        }

        // Save modifier to holder
        modifiers.add(func, func);

        return manager;
    };


    /**
     * Removes a modifier when passed existing function reference
     * @param {function} func
     * @returns {function} stream manager
     */
    manager.unmodify = (func) => {

        assertFunction('modifier', func);

        if (modifiers.has(func)) {

            modifiers.delete(func);
        }

        return manager;
    };


    /**
     * Adds a listener that runs when stream update is executed
     * @param {function} func
     */
    manager.listen = (func) => {

        assertFunction('listener', func);

        // If initial state was passed, execute function with state
        if (!isUndefined(state)) {

            func(state);
        }

        // Save listener to holder
        listeners.add(func, func);
    }


    /**
     * Removes a listener when passed existing function reference
     * @param {function} func
     */
    manager.unlisten = (func) => {

        assertFunction('listener', func);

        if (listeners.has(func)) {

            listeners.delete(func);
        }
    }


    /**
     * Returns an array of all states
     * @returns {array} Array of states
     */
    manager.states = () => Array.from(states.values());

    return manager;
};

module.exports = stream;