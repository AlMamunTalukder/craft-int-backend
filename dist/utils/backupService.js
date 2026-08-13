"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.backupMongoDB = backupMongoDB;
exports.restoreMongoDB = restoreMongoDB;
/* eslint-disable @typescript-eslint/no-explicit-any */
// utils/backupService.js
const child_process_1 = require("child_process");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const config_1 = __importDefault(require("../app/config"));
const DB_NAME = config_1.default.DB_NAME || 'sarabelanews';
const rootDir = process.cwd();
const ARCHIVE_PATH = path_1.default.join(rootDir, 'public', 'sarabelanews.gzip');
const LOG_PATH = path_1.default.join(rootDir, 'public', 'backup_logs.json');
function backupMongoDB() {
    return new Promise((resolve, reject) => {
        const backupStartTime = new Date().toISOString();
        const command = `mongodump --db=${DB_NAME} --archive=${ARCHIVE_PATH} --gzip`;
        (0, child_process_1.exec)(command, (error, stdout, stderr) => {
            if (error) {
                console.error('Backup error:', error);
                logBackupMetadata({ status: 'failed', error: error.message, backupStartTime });
                reject(error);
                return;
            }
            if (stderr) {
                console.error('stderr:\n', stderr);
            }
            logBackupMetadata({ status: 'successful', backupStartTime });
            resolve();
        });
    });
}
function restoreMongoDB() {
    return new Promise((resolve, reject) => {
        const command = `mongorestore --db=${DB_NAME} --archive=${ARCHIVE_PATH} --gzip`;
        (0, child_process_1.exec)(command, (error, stdout, stderr) => {
            if (error) {
                console.error('Restore error:', error);
                reject(error);
                return;
            }
            if (stderr) {
                console.error('stderr:\n', stderr);
            }
            resolve();
        });
    });
}
function logBackupMetadata({ status, error = null, code = null, signal = null, backupStartTime }) {
    const backupEndTime = new Date().toISOString();
    const logEntry = {
        status,
        error,
        code,
        signal,
        backupStartTime,
        backupEndTime,
        archivePath: ARCHIVE_PATH
    };
    // Calculate expiration date (7 days ago)
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() - 7);
    // Read existing logs
    const logs = fs_1.default.existsSync(LOG_PATH) ? JSON.parse(fs_1.default.readFileSync(LOG_PATH, 'utf8')) : [];
    // Filter out logs older than 7 days
    const prunedLogs = logs.filter((log) => new Date(log.backupEndTime) >= expirationDate);
    // Append the new log entry
    prunedLogs.push(logEntry);
    // Write the updated and pruned logs back to file
    fs_1.default.writeFileSync(LOG_PATH, JSON.stringify(prunedLogs, null, 2));
}
