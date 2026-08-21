"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const node_cron_1 = __importDefault(require("node-cron"));
const DB_NAME = 'craft-international';
const ARCHIVE_PATH = path_1.default.join(__dirname, 'public', `${DB_NAME}.gzip`);
// Ensure the public directory exists
const PUBLIC_DIR = path_1.default.join(__dirname, 'public');
if (!fs_1.default.existsSync(PUBLIC_DIR)) {
    fs_1.default.mkdirSync(PUBLIC_DIR);
}
// Run backup immediately when the script starts
backupMongo();
// Schedule the backup every 5 seconds
node_cron_1.default.schedule('*/5 * * * * *', () => backupMongo());
function backupMongo() {
    const child = (0, child_process_1.spawn)('mongodump', [
        `--db=${DB_NAME}`,
        `--archive=${ARCHIVE_PATH}`,
        '--gzip',
    ]);
    child.stdout.on('data', (data) => {
        console.log('stdout:\n', data.toString());
    });
    child.stderr.on('data', (data) => {
        console.log('stderr:\n', data.toString());
    });
    child.on('error', (error) => {
        console.error('Error:\n', error);
    });
    child.on('exit', (code, signal) => {
        if (code !== null)
            console.log('Process exited with code:', code);
        else if (signal !== null)
            console.log('Process killed with signal:', signal);
        else
            console.log('Backup is successful ✅');
    });
}
exports.default = backupMongo;
