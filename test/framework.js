let total = 0;
let passes = 0;
let failures = 0;

let doneTm = null;

function nice(x) {
  if (typeof x === 'function') {
    return String(x);
  }
  let wrap = '';
  if (typeof x === 'object' && x) {
    wrap = '\n';
  }
  return wrap + JSON.stringify(x, null, 2) + wrap;
}

function checkDone() {
  if (passes + failures === total) {
    console.info(`Complete. Tests: ${total}. Passes: ${passes}. Failures: ${failures}`);
  }
  if (failures) {
    console.error('FAILED.\n');
    process.exit(1);
  } else {
    console.info('PASSED.\n');
  }
}

async function it(name, fn) {
  ++ total;
  try {
    await fn();
    ++ passes;
  } catch (e) {
    ++ failures;
    console.error(`FAIL: ${name}\n`);
    console.error(e);
  }
  clearTimeout(doneTm);
  doneTm = setTimeout(checkDone, 0);
}

function equal(observed, expected, message = 'Expectation failed', internalPath = '') {
  const prefix = `${message}${internalPath ? ` at ${internalPath}` : ''} - `;
  if (observed === expected) {
    return;
  }
  if (typeof observed !== typeof expected || typeof expected !== 'object' || !observed || !expected) {
    throw new Error(`${prefix}Expected ${nice(expected)} but got ${nice(observed)}`);
  }
  Object.keys(expected).forEach((k) => {
    equal(observed[k], expected[k], message, internalPath + '.' + k);
  });

  Object.keys(observed).forEach((k) => {
    if (!expected.hasOwnProperty(k)) {
      throw new Error(`${prefix}Unexpected entry: ${k}`);
    }
  });
}

const matches = (a) => (b) => {
  try {
    equal(a, b);
    return true;
  } catch (e) {
    return false;
  }
};

function contains(observed, expectedItem, message = 'Expectation failed', internalPath = '') {
  const prefix = `${message}${internalPath ? ` at ${internalPath}` : ''} - `;
  if (!Array.isArray(observed)) {
    throw new Error(`${prefix}Expected array containing ${nice(expectedItem)} but got ${nice(observed)}`);
  }

  if (typeof expectedItem === 'function') {
    if (observed.some(expectedItem)) {
      return;
    }
    throw new Error(`${prefix}Expected array satisfying ${nice(expectedItem)} but got ${nice(observed)}`);
  }

  if (observed.includes(expectedItem) || observed.some(matches(expectedItem))) {
    return;
  }

  throw new Error(`${prefix}Expected array containing ${nice(expectedItem)} but got ${nice(observed)}`);
}

function containsAll(observed, expected, message, internalPath) {
  expected.forEach((expectedItem) => {
    contains(observed, expectedItem, message, internalPath);
  });
}

const expect = { equal, contains, containsAll, not: {} };

Object.keys(expect).forEach((k) => {
  if (typeof expect[k] === 'function') {
    expect.not[k] = (o, e, message = 'Expected not to match', ...rest) => {
      try {
        expect[k](o, e, '', ...rest);
      } catch (e) {
        return;
      }
      throw new Error(message);
    };
  }
});

module.exports = { it, expect };
