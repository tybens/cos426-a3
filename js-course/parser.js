"use strict";

/**
 * The parser for commands.
 * @namespace
 */
var Parser = Parser || {};

// Regular expression helpers
Parser.REGEXP = (() => {
  const SPACES = String.raw`\s*`;
  const START = "^";
  const END = "$";
  const L_BRACKET = String.raw`\[`;
  const R_BRACKET = String.raw`\]`;
  const L_PAREN = String.raw`\(`;
  const R_PAREN = String.raw`\)`;

  const INT_RE = /(\d+)/g;

  const nonNegFloatPattern = String.raw`\d+\.?\d*`;
  const NON_NEG_FLOAT_RE = new RegExp(`(${nonNegFloatPattern})`, "g");
  const FLOAT_RE = new RegExp(`(-?${nonNegFloatPattern})`, "g");
  const FLOAT_ONLY_RE = new RegExp(`${START}${FLOAT_RE.source}${END}`, "g");

  // regexp for "#xxxxxx" (with optional pound sign), where each "x" is a hex
  // character (case insensitive)
  const HEX_STRING_RE = /^(#?[a-f0-9]{6})$/gi;

  // regexp for "rgb(r,g,b)" or "rgb(r,g,b,a)" or "rgba(r,g,b)" or
  // "rgba(r,g,b,a)", where each value is an integer (case insensitive)
  const RGB_CSS_STRING_RE = new RegExp(
    `${START}rgba?${L_PAREN}` +
      new Array(3).fill(INT_RE.source).join(",") +
      `(?:,${INT_RE.source})?` +
      `${R_PAREN}${END}`,
    "gi"
  );

  // regexp for "rgb(r,g,b)", where each value is an integer
  // unused in favor of the general (and flexible) css rgb string re
  const RGB_STRING_RE = new RegExp(
    `${START}rgb${L_PAREN}` +
      new Array(3).fill(INT_RE.source).join(",") +
      `${R_PAREN}${END}`,
    "gi"
  );

  // regexp for "rgba(r,g,b,a)", where each value is an integer
  // unused in favor of the general (and flexible) css rgb string re
  const RGBA_STRING_RE = new RegExp(
    `${START}rgba${L_PAREN}` +
      new Array(4).fill(INT_RE.source).join(",") +
      `${R_PAREN}${END}`,
    "gi"
  );

  // regexp for "[x,y,z]", where each value is a float, with optional whitespace
  // between values
  const VECTOR_RE = new RegExp(
    `${START}${SPACES}${L_BRACKET}` +
      new Array(3).fill(`${SPACES}${FLOAT_RE.source}${SPACES}`) +
      `${R_BRACKET}${SPACES}${END}`,
    "g"
  );

  // regexp for "(start,end,step)", where each value is a float, with optional
  // whitespace between values
  const ANIMATION_RE = new RegExp(
    `${START}${SPACES}${L_PAREN}` +
      new Array(3).fill(`${SPACES}${FLOAT_RE.source}${SPACES}`).join(",") +
      `${R_PAREN}${SPACES}${END}`,
    "g"
  );

  return {
    SPACES,
    START,
    END,
    L_BRACKET,
    R_BRACKET,
    L_PAREN,
    R_PAREN,

    INT_RE,
    NON_NEG_FLOAT_RE,
    FLOAT_RE,
    FLOAT_ONLY_RE,
    HEX_STRING_RE,
    RGB_CSS_STRING_RE,
    RGB_STRING_RE,
    RGBA_STRING_RE,
    VECTOR_RE,
    ANIMATION_RE,
  };
})();

Parser.parseFloats = function (string, re = null) {
  if (re == null) {
    // use default (allows negative)
    re = Parser.REGEXP.FLOAT_RE;
  }
  const floats = [];
  let hasMatch = false;
  for (const match of string.matchAll(re)) {
    hasMatch = true;
    // skip the first element in the array (matched text)
    for (let i = 1; i < match.length; i++) {
      if (match[i] == null) continue;
      floats.push(parseFloat(match[i]));
    }
  }
  if (!hasMatch) return null;
  return floats;
};

/**
 * Returns the search args from the URL as an object that maps from arg name to
 * arg value (as a string).
 *
 * If there are multiple args with the same name, the last one found is used.
 */
Parser.getUrlArgs = function ({ asEntries = false } = {}) {
  // commands with spaces in them are replaced with underscores to make the URL
  // easier to read (and shorter). we must remove them so that the proper
  // commands can be recognized
  const urlArgs = new URLSearchParams(
    // use regexp to replace all
    document.location.search.replace(/_/g, " ")
  );
  const entries = urlArgs.entries();
  if (asEntries) return entries;
  return Object.fromEntries(entries);
};

/**
 * Parses the commands from the URL.
 *
 * See the code in more detail for the structure of each arg object.
 * @returns {!Array<{{name: string, argsStr: string, args: !Array<!Object>}}}
 *     The commands.
 */
Parser.parseUrlCommands = function () {
  const commands = [];
  for (const [cmdName, argsListStr] of Parser.getUrlArgs({ asEntries: true })) {
    if (cmdName.length === 0) continue;
    if (argsListStr === "") {
      // no args
      commands.push({ name: cmdName, argsStr: argsListStr, args: [] });
      continue;
    }
    // parse args list
    const args = argsListStr.split(";").map((argStr) => {
      argStr = argStr.trim();
      const original = argStr;
      if (original === "") return { original, value: null };
      argStr = argStr.toLowerCase();
      if (argStr === "true") {
        const value = true;
        return { original, value, boolean: value };
      }
      if (argStr === "false") {
        const value = false;
        return { original, value, boolean: value };
      }
      const num = Parser.parseFloats(argStr, Parser.REGEXP.FLOAT_ONLY_RE);
      if (num != null) {
        const value = num[0];
        return { original, value, number: value };
      }
      // check if is pixel color
      const colorComponents = Parser.parseFloats(
        argStr,
        Parser.REGEXP.RGB_CSS_STRING_RE
      );
      if (colorComponents != null) {
        // HACK: replicate gui input by giving components in range [0, 255]
        const colorValue = colorComponents.map((comp) =>
          Math.min(Math.max(0, comp), 255)
        );
        return { original, value: colorValue, color: colorValue };
      }
      // check if is vector
      const vectorComponents = Parser.parseFloats(
        argStr,
        Parser.REGEXP.VECTOR_RE
      );
      if (vectorComponents != null) {
        return { original, value: vectorComponents, vector: vectorComponents };
      }
      // check if is animated param
      const animationValues = Parser.parseFloats(
        argStr,
        Parser.REGEXP.ANIMATION_RE
      );
      if (animationValues != null) {
        const [start, end, step] = animationValues;
        const value = { start, end, step };
        return { original, isAnimated: true, value, animationRange: value };
      }
      return { original, value: original };
    });
    commands.push({ name: cmdName, argsStr: argsListStr, args: args });
  }
  return commands;
};

Parser.readFile = function (filename) {
  // We want a synchronous file-reading function.
  // - `fetch()` is asynchronous, and not supported on IE.
  // - jQuery's `$.ajax()` is asynchronous, with a deprecated `async: false`
  //   option.
  // - Synchronous `XMLHttpRequest` (which is possible) is also deprecated
  //   (warning in the console).
  // The best option for now is the last one, but other methods could work
  // better.
  const request = new XMLHttpRequest();
  // add timestamp to request to discourage caching
  request.open("GET", `${filename}?_time=${new Date().getTime()}`, false);
  request.overrideMimeType("text/plain");
  request.send(null);
  if (request.status !== 200) {
    let errorText = `${request.status} ${request.statusText}`;
    if (request.status === 404) {
      errorText += `: ${filename}`;
    }
    throw new Error(errorText);
  }
  return request.responseText;
};

Parser.parseJsonFile = function (jsonFile) {
  return JSON.parse(Parser.readFile(jsonFile));
};

/** Parses the given YAML file. Assumes that `js-yaml` is loaded. */
Parser.parseYamlFile = function (yamlFile) {
  return jsyaml.load(Parser.readFile(yamlFile));
};
