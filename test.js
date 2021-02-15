const assert = require('assert');
const c = require('ansi-colors');

const { Strom } = require('.');

const errs = [];

const { log } = console;

// Removes noise from stack trace to make it easier to debug
const cleanTrace = (err) => (

    err && err.stack
        .replace(err.toString(), '')
        .replace(/^\s{1,}at.+(internal\/|node_)modules.+\d\)$/gm, '')
        .replace(new RegExp(process.cwd(), 'g'), '')
        .replace(/\n{2,}/gm, '')
);

// Creates an arbitrary stack trace
const traceCall = (m, ...rest) => {

    log(c.yellow(m), ...rest);
    log(
        c.green(
            cleanTrace(new Error('parent'))
        )
    );
};

const it = (msg, fn) => {

    try {

        const passed = fn();

        assert(!!passed, msg);
        process.stdout.write(c.green('.'));
    }
    catch (e) {

        errs.push(e);
        process.stdout.write(c.red('.'));
    }
};

const stub = {};

it('creates a stream', () => {

    stub.stream = new Strom();
    return true;
});

it('has functions to manage modifiers and listeners', () => {

    const hasModify = typeof stub.stream.modify === 'function';
    const hasUnmodify = typeof stub.stream.unmodify === 'function';

    const hasListen = typeof stub.stream.listen === 'function';
    const hasUnlisten = typeof stub.stream.unlisten === 'function';

    return (
        hasModify &&
        hasUnmodify &&
        hasListen &&
        hasUnlisten
    );
});

it('returns array of states', () => {

    const states = stub.stream.states();
    return states.constructor === Array;
});

it('has state function', () => {

    return typeof stub.stream.state === 'function';
});

it('returns current state', () => {

    const state = stub.stream.state();
    return typeof state === 'object';
});

it('sets empty object as default state', () => {

    const state = stub.stream.state();
    return state.constructor === Object;
});

it('sets passed state in state holder', () => {

    const check = { test: true };
    stub.stream = new Strom(check);
    const state = stub.stream.state();
    return state === check;
});

it('adds a modifer and executes it immediately', () => {

    stub.modifier = (state) => {

        state.updated = true;
        return state;
    };

    stub.stream.modify(stub.modifier);
    const state = stub.stream.state();

    return state.updated === true && state.test === true;
});


it('modifies a new state', () => {

    stub.stream.update({ updated: false });
    const state = stub.stream.state();

    return state.updated === true;
});

it('removes a modifier', () => {

    stub.stream.unmodify(stub.modifier);
    stub.stream.update({ updated: false });
    const state = stub.stream.state();

    return state.updated === false;
});

it('makes current state the passed value if no modifiers exist', () => {

    const check = { blyat: true };
    stub.stream.update(check);
    const state = stub.stream.state();

    return state.updated === undefined && state === check;
});

it('does not update state if modifier returns ignore', () => {

    const stream = new Strom({ oy: true, shouldIgnore: true });

    const modifier1 = function (next, prev, ignore) {


        if (next.shouldIgnore) {

            return ignore;
        }

        next.didUpdate = true;

        return {
            ...prev,
            ...next
        };
    };

    const modifier2 = (n, o) => ({
        ...n,
        ...o,
        otherModifier: true
    });

    stream.modify(modifier1);
    stream.modify(modifier2);

    stream.update({ blyot: true, shouldIgnore: true });

    const state = stream.state();

    return state.didUpdate === undefined &&
           state.otherModifier === true &&
           state.blyot === true &&
           state.oy === true;
});

it('listens for changes', () => {

    const start = { oy: true };
    stub.stream = new Strom(start);
    stub.modifier = (next, prev) => ({
        ...prev,
        ...next
    });
    stub.listener = (next, prev) => {

        stub.next = next;
        stub.prev = prev;
    };

    stub.stream.modify(stub.modifier);

    stub.stream.listen(stub.listener);

    const check = { blyot: true };
    stub.stream.update(check);

    return stub.next.oy === true &&
            stub.next.blyot === true &&
            stub.prev.blyot === undefined;
});

it('removes listener', () => {

    stub.next = null;
    stub.prev = null;

    stub.stream.unlisten(stub.listener);
    stub.stream.update({ pepe: true });

    return stub.next === null && stub.prev === null;
});

it('keeps only a specified number of states', () => {

    const stream = new Strom({}, {

        statesToKeep: 3
    });

    stream.update({ a: 1 });
    stream.update({ a: 2 });
    stream.update({ a: 3 });
    stream.update({ a: 4 });
    stream.update({ a: 5 });

    return stream.states().length === 3;
});


it('removes states after they have been dispatched to listeners', () => {

    const stream = new Strom({}, {

        flushOnRead: true
    });

    stream.update({ a: 1 });
    stream.update({ a: 2 });

    const beforeListeners = stream.states().length;

    stream.listen(() => {});

    stream.update({ a: 3 });
    stream.update({ a: 4 });
    stream.update({ a: 5 });

    const afterListeners = stream.states().length;

    return beforeListeners === 3 &&
           afterListeners === 1;
});

it('goes backward in state', () => {


    stub.stream = new Strom({}, {

        statesToKeep: 10
    });

    stub.stream.update({ a: 1 });
    stub.stream.update({ a: 2 });
    stub.stream.update({ a: 3 });
    stub.stream.update({ a: 4 });
    stub.stream.update({ a: 5 });

    const current = stub.stream.state();

    stub.stream.prevState();

    const prev = stub.stream.state();

    return (
        current.a === 5 &&
        prev.a === 4
    );
});


it('goes forward in state', () => {

    const current = stub.stream.state();

    stub.stream.prevState();
    stub.stream.prevState();
    stub.stream.nextState();

    const prev = stub.stream.state();

    return (
        current.a === 4 &&
        prev.a === 3
    );
});


it('resets to current state', () => {

    const current = stub.stream.state();

    stub.stream.prevState();
    stub.stream.prevState();
    stub.stream.resetState();

    const actual = stub.stream.state();

    return (
        current.a === 3 &&
        actual.a === 5
    );
});

it('creates a clone of stream', () => {

    const stream = new Strom({ a: 0 });

    stub.parentListener = 0;
    stub.parentModifier = 0;

    stream.listen(() => {

        stub.parentListener++;
    });

    stream.modify((n, o) => {

        stub.parentModifier++;

        return { ...o, ...n };
    });

    stream.update ({ a: 1 });

    const parent1stState = stream.state();

    const clone = stream.clone();

    const clone1stSate = clone.state();

    clone.update({ a: 2 });

    const parent2ndState = stream.state();
    const clone2ndState = clone.state();

    stream.update ({ a: 3 });

    const parent3rdState = stream.state();
    const clone3rdState = clone.state();

    return (
        parent1stState.a === 1 &&
        clone1stSate.a === 1 &&
        parent2ndState.a === 1 &&
        clone2ndState.a === 2 &&
        parent3rdState.a === 3 &&
        clone3rdState.a === 3 &&
        stub.parentListener === 2 &&
        stub.parentModifier === 5
    );
});


log();

if (errs.length) {

    log();

    errs.forEach((err) => {

        const e = err.toString();
        log(
            c.red(e),
            c.yellow(
                cleanTrace(err)
            )
        );
        log();
    });

    log();
    log();
    log(
        c.red('\t' + errs.length + ' errors :(')
    )
    log();
    log();

    process.exit(1);
}
else {

    log(c.green('Success! :)'))
}
