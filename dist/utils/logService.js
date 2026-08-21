"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllLogsService = exports.getAllLogs = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const readline_1 = __importDefault(require("readline"));
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = require("../app/error/AppError");
const countLogEntries = (filePath) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, e_1, _b, _c;
    let count = 0;
    try {
        const fileStream = fs_1.default.createReadStream(filePath);
        const rl = readline_1.default.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        });
        try {
            for (var _d = true, rl_1 = __asyncValues(rl), rl_1_1; rl_1_1 = yield rl_1.next(), _a = rl_1_1.done, !_a; _d = true) {
                _c = rl_1_1.value;
                _d = false;
                const line = _c;
                if (line.startsWith('[')) {
                    count++;
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (!_d && !_a && (_b = rl_1.return)) yield _b.call(rl_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
    }
    catch (error) {
        console.error(`Error counting log entries in file ${filePath}:`, error);
    }
    return count;
});
// Helper function to read log entries with pagination in reverse order
const readLogFile = (filePath, startIndex, endIndex) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, e_2, _b, _c;
    const logs = [];
    try {
        const fileStream = fs_1.default.createReadStream(filePath, { encoding: 'utf8' });
        const rl = readline_1.default.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        });
        // Read the file line by line, collecting entries
        const entries = [];
        try {
            for (var _d = true, rl_2 = __asyncValues(rl), rl_2_1; rl_2_1 = yield rl_2.next(), _a = rl_2_1.done, !_a; _d = true) {
                _c = rl_2_1.value;
                _d = false;
                const line = _c;
                if (line.startsWith('[')) {
                    entries.push(line);
                }
                else if (entries.length > 0) {
                    entries[entries.length - 1] += `\n${line}`;
                }
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (!_d && !_a && (_b = rl_2.return)) yield _b.call(rl_2);
            }
            finally { if (e_2) throw e_2.error; }
        }
        // Reverse entries for latest data first
        entries.reverse();
        // Return the desired range of log entries
        logs.push(...entries.slice(startIndex, endIndex));
    }
    catch (error) {
        console.error(`Error reading log file ${filePath}:`, error);
    }
    return logs;
});
// Main function to get all logs with pagination
const getAllLogs = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (page = 1, pageSize = 30) {
    const logFiles = {
        combined: path_1.default.resolve(process.cwd(), 'logs', `combined-${new Date().toISOString().slice(0, 10)}.log`),
        error: path_1.default.resolve(process.cwd(), 'logs', 'error.log'),
        exception: path_1.default.resolve(process.cwd(), 'logs', 'exception.log'),
        rejection: path_1.default.resolve(process.cwd(), 'logs', 'rejection.log')
    };
    const logCounts = yield Promise.all([
        countLogEntries(logFiles.combined),
        countLogEntries(logFiles.error),
        countLogEntries(logFiles.exception),
        countLogEntries(logFiles.rejection)
    ]);
    const totalEntries = logCounts.reduce((sum, count) => sum + count, 0);
    const startIndex = Math.max(totalEntries - page * pageSize, 0);
    const endIndex = startIndex + pageSize;
    const logs = {
        combined: [],
        error: [],
        exception: [],
        rejection: [],
        totalEntries
    };
    // Fetch logs for the current page from each log file
    if (startIndex < logCounts[0]) {
        logs.combined = yield readLogFile(logFiles.combined, Math.max(0, logCounts[0] - endIndex), logCounts[0] - startIndex);
    }
    if (endIndex > logCounts[0]) {
        const adjustedStartIndex = Math.max(0, startIndex - logCounts[0]);
        const adjustedEndIndex = Math.min(endIndex - logCounts[0], logCounts[1]);
        logs.error = yield readLogFile(logFiles.error, adjustedStartIndex, adjustedEndIndex);
    }
    if (endIndex > logCounts[0] + logCounts[1]) {
        const adjustedStartIndex = Math.max(0, startIndex - logCounts[0] - logCounts[1]);
        const adjustedEndIndex = Math.min(endIndex - logCounts[0] - logCounts[1], logCounts[2]);
        logs.exception = yield readLogFile(logFiles.exception, adjustedStartIndex, adjustedEndIndex);
    }
    if (endIndex > logCounts[0] + logCounts[1] + logCounts[2]) {
        const adjustedStartIndex = Math.max(0, startIndex - logCounts[0] - logCounts[1] - logCounts[2]);
        const adjustedEndIndex = Math.min(endIndex - logCounts[0] - logCounts[1] - logCounts[2], logCounts[3]);
        logs.rejection = yield readLogFile(logFiles.rejection, adjustedStartIndex, adjustedEndIndex);
    }
    return logs;
});
exports.getAllLogs = getAllLogs;
const getAllLogsService = (req) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const pageSize = parseInt(req.query.pageSize, 10) || 30;
        const logsData = yield (0, exports.getAllLogs)(page, pageSize);
        const totalPages = Math.ceil(logsData.totalEntries / pageSize);
        return {
            status: 'success',
            data: {
                combined: logsData.combined,
                error: logsData.error,
                exception: logsData.exception,
                rejection: logsData.rejection
            },
            meta: {
                page,
                pageSize,
                totalPages,
                totalEntries: logsData.totalEntries
            }
        };
    }
    catch (err) {
        throw new AppError_1.AppError(http_status_1.default.INTERNAL_SERVER_ERROR, 'Failed to read log files');
    }
});
exports.getAllLogsService = getAllLogsService;
