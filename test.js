const assert = require('assert');
const c = require('ansi-colors');
const strom = require('.');

const errs = []
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

it ('creates a stream and returns update function', () => {

    stub.stream = strom();
    return typeof stub.stream === 'function';
});

it ('has modifying functions', () => {

    const hasModify = typeof stub.stream.modify === 'function';
    const hasUnmodify = typeof stub.stream.unmodify === 'function';

    return hasModify && hasUnmodify;
});

it ('has listening functions', () => {

    const hasListen = typeof stub.stream.listen === 'function';
    const hasUnlisten = typeof stub.stream.unlisten === 'function';

    return hasListen && hasUnlisten;
});

it ('has states function', () => {

    return typeof stub.stream.states === 'function';
});

it ('returns array of states', () => {

    const states = stub.stream.states();
    return states.constructor === Array;
});

it ('has state function', () => {

    return typeof stub.stream.state === 'function';
});

it ('returns current state', () => {

    const state = stub.stream.state();
    return typeof state === 'object';
});

it ('sets empty object as default state', () => {

    const state = stub.stream.states()[0];
    return state.constructor === Object;
});

it ('sets passed state in state holder', () => {

    const check = { test: true };
    stub.stream = strom(check);
    const state = stub.stream.states()[0];
    return state === check;
});

it ('adds a modifer and executes it immediately', () => {

    stub.modifier = (state) => {

        state.updated = true;
        return state;
    };

    stub.stream.modify(stub.modifier);
    const state = stub.stream.states()[0];

    return state.updated === true && state.test === true;
});


it ('modifies a new state', () => {

    stub.stream({ updated: false });
    const state = stub.stream.states().pop();

    return state.updated === true;
});

it ('removes a modifier', () => {

    stub.stream.unmodify(stub.modifier);
    stub.stream({ updated: false });
    const state = stub.stream.states().pop();

    return state.updated === false;
});

it ('makes state passed value if no modifiers exist', () => {

    const check = { blyat: true };
    stub.stream(check);
    const state = stub.stream.states().pop();

    return state.updated === undefined && state === check;
});

it ('does not update state if modifier returns ignore', () => {

    stub.stream = strom({ oy: true });
    stub.modifier = function (next, prev, ignore) {

        if (prev) {

            next.didUpdate = true;
        }

        return ignore;
    };

    stub.stream.modify(stub.modifier);

    const check = { blyot: true };
    stub.stream(check);
    const state = stub.stream.states().pop();

    return state.didUpdate === undefined &&
        state.blyot === undefined &&
        state.oy === true;
});

it ('listens for changes', () => {

    const start = { oy: true };
    stub.stream = strom(start);
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
    stub.stream(check);

    return stub.next.oy === true &&
            stub.next.blyot === true &&
            stub.prev.blyot === undefined;
});

it ('removes listener', () => {

    stub.next = null;
    stub.prev = null;

    stub.stream.unlisten(stub.listener);
    stub.stream({ pepe: true });

    return stub.next === null && stub.prev === null;
})

console.log();

if (errs.length) {

    console.log();

    errs.forEach((err) => {

        console.log(c.red(err));
        console.log();
    });

    process.exit(1);
}
else {

    console.log(c.green('Success!'))
}
