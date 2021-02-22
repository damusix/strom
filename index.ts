const isUndefined = (val: any) => val === undefined;
// const undefOrNull = (val: any) => isUndefined(val) || val === null;
const assertFunction = (msg: String, func: Function) => {

    if (typeof func !== 'function') {

        throw TypeError(`${msg} must be a function`);
    }
};


export type StromOptions = {

    /** Immediately execute state modifiers when added */
    execNewModifiers?: boolean;

    /** Immediately execute listeners when added */
    execNewListeners?: boolean;

    /** How many states changes to keep in memory */
    statesToKeep?: number;

    /** Removes states after reading */
    flushOnRead?: boolean;

    /** Parent stream. Only used for cloning. */
    parent?: Strom
};

export type ModifierFunction = (value: any, state?: any, ignore?: symbol) => any

// For skipping state modification
const IGNORE = Symbol();

const DEFAULT_OPTIONS: StromOptions = {
    execNewModifiers: true,

    execNewListeners: false,

    statesToKeep: 5
};


export class Strom {

    _options: StromOptions|null = null;
    _sid = 0;
    stateId(): number {
        return this._sid++;
    }

    _state: any = null;
    _modifiers: Set<ModifierFunction>|null = null;
    _listeners: Set<Function>|null = null;

    _states: Map<number, any>|null = null;
    _currentState: number|null = null;
    _latestState: number|null = null;
    _parent: Strom|null = null;

    constructor(state: any = {}, options: StromOptions = {}) {

        this._state = state;

        // Holds state modifiers
        this._modifiers = new Set();

        // Holds listeners
        this._listeners = new Set();

        // Holds states
        this._states = new Map();

        this._currentState = null;
        this._latestState = null;

        this._options = {
            ...DEFAULT_OPTIONS,
            ...options
        };

        const { parent } = options;

        if (parent) {
            this._parent = parent;

            for (const mod of parent._modifiers) {

                this._modifiers.add(mod);
            }

            parent.listen(this.update.bind(this));
        }

        this._addState(state);
    }

    private _addState(state: any) {

        const { statesToKeep } = this._options;
        const { _states } = this;

        if (statesToKeep && _states.size >= statesToKeep) {

            const { value: firstState } = _states.keys().next();
            _states.delete(firstState);
        }

        this._currentState = this.stateId();
        this._latestState = this._currentState;

        // Initialize state to state holder
        _states.set(this._currentState, state);
        this._state = state;
    }

    private _notifyListeners(newState: any, oldState: any) {

        // Notify listeners
        for (const listener of this._listeners) {
            listener(newState, oldState);
        }
    };

    /**
     * Push an update
     * @param value new state
     */
    update(value: any) {

        const {
            _modifiers,
            _listeners
        } = this;

        const {
            flushOnRead
        } = this._options;

        const oldState = this._state;
        let newState;

        // If value is not undefined, run modifiers
        // Otherwise we run current state
        if (!isUndefined(value)) {

            // If no modifiers present, state will be overwritten
            if (_modifiers.size === 0) {

                newState = value;
            }
            else {

                let modified = value;

                for (const modifier of _modifiers) {

                    const _modified = modifier(modified, oldState, IGNORE);

                    // Ignore modification if ignore symbol
                    if (_modified === IGNORE) {

                        continue;
                    }

                    if (!isUndefined(_modified)) {

                        newState = _modified;
                    }
                }
            }

            if (newState) {

                // Save new state to holder
                this._addState(newState);
            }
        }

        if (_listeners.size) {

            // Notify listeners
            this._notifyListeners(newState, oldState);

            if (flushOnRead) {

                this.flushStates();
            };
        }

        return this;
    }

    /**
     * Function that modifies state.
     * Pass a function declaration for ability to return `this.IGNORE`
     * @param {function} func
     * @returns {Strom} Strom instance
     */
    modify(func: ModifierFunction){

        assertFunction('modifier', func);

        // If initial state was passed, execute function with state if option enabled
        if (!isUndefined(this._state) && this._options.execNewModifiers) {

            func(this._state);
        }

        // Save modifier to holder
        this._modifiers.add(func);

        return this;
    }


    /**
     * Removes a modifier when passed existing function reference
     * @param {function} func
     * @returns {Strom} Strom instance
     */
    unmodify(func: ModifierFunction) {

        assertFunction('modifier', func);

        if (this._modifiers.has(func)) {

            this._modifiers.delete(func);
        }

        return this;
    };


    /**
     * Adds a listener that runs when stream update is executed
     * @param {function} func
     * @returns {Strom} Strom instance
     */
    listen(func: Function) {

        assertFunction('listener', func);

        // If initial state was passed, execute function with state if option enabled
        if (this._options.execNewListeners) {

            func(this._state);
        }

        // Save listener to holder
        this._listeners.add(func);

        return this;
    }


    /**
     * Removes a listener when passed existing function reference
     * @param {function} func
     * @returns {Strom} Strom instance
     */
    unlisten(func: Function) {

        assertFunction('listener', func);

        if (this._listeners.has(func)) {

            this._listeners.delete(func);
        }

        return this;
    }


    /**
     * Returns an array of all states
     * @returns {array} Array of states
     */
    states() {

        return Array.from(this._states.values());
    }

    /**
     * Returns current state
     * @returns {*} Current state
     */
    state() {

        return this._state;
    }

    /**
     * Cleans all stored states, except current state.
     * State is reset if it wasn't on the current state
     */
    flushStates() {

        for (const key of this._states.keys()) {

            if (key === this._currentState) {
                continue;
            }

            this._states.delete(key);
        }

        this.resetState();
    };

    /**
     * Sets the current state back to whatever it was. Useful for
     * where stepping forward and backwards between states and then
     * returning to your original state.
     */
    resetState() {

        const {
            _currentState,
            _latestState,
            _states
        } = this;

        if (_currentState === _latestState) {
            return;
        }

        const oldState = this._state;
        const newState = _states.get(_latestState);

        this._notifyListeners(newState, oldState);

        this._currentState = _latestState;
        this._state = newState;
    }

    private _stateStepper(increment: number, warning: string) {

        const { _currentState, _states } = this;
        const { flushOnRead } = this._options;

        if (flushOnRead) {
            console.warn('cannot traverse states when flushOnRead option is set');
            return;
        }

        const sid = _currentState + increment;

        if (_states.has(sid)) {

            const oldState = this._state;
            const newState = _states.get(sid);

            this._notifyListeners(
                newState,
                oldState
            );

            this._currentState = sid;
            this._state = newState;
        }
        else {

            console.warn(warning);
        }
    }

    /**
     * Go back 1 state. Does not work if `flushOnRead` is true.
     */
    prevState() {

        this._stateStepper(-1, 'previous state does not exist');
    }

    /**
     * Go forward 1 state. Does not work if `flushOnRead` is true.
     */
    nextState() {

        this._stateStepper(1, 'next state does not exist');
    }

    /**
     * Creates a child instance of Strom. Receives parent's modifiers
     * and will update whever parent is updated. Adding modifiers and
     * listeners will not affect parent Strom instance.
     *
     * @returns {Strom} Strom instance
     */
    clone() {

        return new Strom(
            this._state,
            {
                ...this._options,
                parent: this
            }
        );
    }
}

export default Strom;