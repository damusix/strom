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

    stub.update = strom();
    return typeof stub.update === 'function';
});

it ('has modifying functions', () => {

    const hasModify = typeof stub.update.modify === 'function';
    const hasUnmodify = typeof stub.update.unmodify === 'function';

    return hasModify && hasUnmodify;
});

it ('has listening functions', () => {

    const hasListen = typeof stub.update.listen === 'function';
    const hasUnlisten = typeof stub.update.unlisten === 'function';

    return hasListen && hasUnlisten;
});

it ('has states function', () => {

    return typeof stub.update.states === 'function';
});

it ('returns array of states', () => {

    const states = stub.update.states();
    return states.constructor === Array;
});

it ('sets empty object as default state', () => {

    const state = stub.update.states()[0];
    return state.constructor === Object;
});

it ('sets passed state in state holder', () => {

    const check = { test: true };
    stub.update = strom(check);
    const state = stub.update.states()[0];
    return state === check;
});

it ('adds a modifer and executes it immediately', () => {

    stub.modifier = (state) => {

        state.updated = true;
        return state;
    };

    stub.update.modify(stub.modifier);
    const state = stub.update.states()[0];

    return state.updated === true && state.test === true;
});


it ('modifies a new state', () => {

    stub.update({ updated: false });
    const state = stub.update.states().pop();

    return state.updated === true;
});

it ('removes a modifier', () => {

    stub.update.unmodify(stub.modifier);
    stub.update({ updated: false });
    const state = stub.update.states().pop();

    return state.updated === false;
});

it ('makes state passed value if no modifiers exist', () => {

    const check = { blyat: true };
    stub.update(check);
    const state = stub.update.states().pop();

    return state.updated === undefined && state === check;
});

it ('does not update state if modifier returns ignore', () => {

    stub.update = strom({ oy: true });
    stub.modifier = function (next, prev, ignore) {

        if (prev) {

            next.didUpdate = true;
        }

        return ignore;
    };

    stub.update.modify(stub.modifier);

    const check = { blyot: true };
    stub.update(check);
    const state = stub.update.states().pop();

    return state.didUpdate === undefined &&
        state.blyot === undefined &&
        state.oy === true;
});

it ('listens for changes', () => {

    const start = { oy: true };
    stub.update = strom(start);
    stub.modifier = (next, prev) => ({
        ...prev,
        ...next
    });
    stub.listener = (next, prev) => {

        stub.next = next;
        stub.prev = prev;
    };

    stub.update.modify(stub.modifier);

    stub.update.listen(stub.listener);

    const check = { blyot: true };
    stub.update(check);

    return stub.next.oy === true &&
            stub.next.blyot === true &&
            stub.prev.blyot === undefined;
});

it ('removes listener', () => {

    stub.next = null;
    stub.prev = null;

    stub.update.unlisten(stub.listener);
    stub.update({ pepe: true });

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
