"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.releaseLock = exports.acquireLock = void 0;
const locks = new Map();
const acquireLock = (key) => {
    if (locks.has(key)) {
        return false;
    }
    locks.set(key, true);
    return true;
};
exports.acquireLock = acquireLock;
const releaseLock = (key) => {
    locks.delete(key);
};
exports.releaseLock = releaseLock;
