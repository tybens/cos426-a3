/** Global utility constants, functions, and classes. */

const EPS = 1e-6;

// from http://stackoverflow.com/questions/15313418/javascript-assert
function assert(condition, message) {
  if (!condition) {
    message = message ?? "Assertion failed";
    if (typeof Error !== "undefined") {
      throw new Error(message);
    }
    throw message; // Fallback
  }
  return condition;
}

$.isJquery = function (obj) {
  return obj instanceof jQuery;
};

$.fn.hasAttr = function (attrName) {
  // https://stackoverflow.com/a/1318091
  const attr = this.attr(attrName);
  return !(attr === undefined || attr === false);
};

// Helper functions for iterating over arrays (Python inspired)

Array.enumerated = function* (array) {
  if (!array) return;
  for (let i = 0; i < array.length; i++) {
    yield [i, array[i]];
  }
};

// not to be confused with `Array.prototype.reverse`!
Array.reversed = function* (array) {
  if (!array) return;
  for (let i = array.length - 1; i >= 0; i--) {
    yield array[i];
  }
};

Array.zip = function* (...arrays) {
  if (arrays.length === 0) return;
  const n = Math.max(...arrays.map((array) => array.length));
  for (let i = 0; i < n; i++) {
    yield arrays.map((array) => array[i]);
  }
};

/**
 * Returns true if any of the elements of any of the given arrays satisfy the
 * predicate.
 */
Array.any = function (predicate, ...arrays) {
  return arrays.some((array) => Array.isArray(array) && array.some(predicate));
};

class Enum {
  constructor(name) {
    this.name = name;
  }

  /**
   * Gets all the possible enum keys.
   * @returns {!Array<string>}
   */
  static keys() {
    return Object.keys(this);
  }
}
