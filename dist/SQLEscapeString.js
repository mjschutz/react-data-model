"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sqlEscapeString = void 0;
const CHARS_GLOBAL_BACKSLASH_SUPPORTED_RX = /[\0\b\t\n\r\x1a"'\\]/g;
const CHARS_ESCAPE_BACKSLASH_SUPPORTED_MAP = {
    '\0': '\\0',
    '\b': '\\b',
    '\t': '\\t',
    '\n': '\\n',
    '\r': '\\r',
    '\x1a': '\\Z',
    '"': '\\"',
    '\'': '\\\'',
    '\\': '\\\\'
};
function sqlEscapeString(val, opts) {
    if (val == null) {
        throw new Error('Need to pass a valid string');
    }
    opts = opts || {};
    const backslashSupported = !!opts.backslashSupported;
    if (!backslashSupported)
        return "'" + val.replace(/'/g, "''") + "'";
    const charsRx = CHARS_GLOBAL_BACKSLASH_SUPPORTED_RX;
    const charsEscapeMap = CHARS_ESCAPE_BACKSLASH_SUPPORTED_MAP;
    var chunkIndex = charsRx.lastIndex = 0;
    var escapedVal = '';
    var match;
    while ((match = charsRx.exec(val))) {
        escapedVal += val.slice(chunkIndex, match.index) + charsEscapeMap[match[0]];
        chunkIndex = charsRx.lastIndex;
    }
    if (chunkIndex === 0)
        return "'" + val + "'";
    if (chunkIndex < val.length)
        return "'" + escapedVal + val.slice(chunkIndex) + "'";
    return "'" + escapedVal + "'";
}
exports.sqlEscapeString = sqlEscapeString;
