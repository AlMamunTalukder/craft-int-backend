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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const globalErrorHandler_1 = __importDefault(require("./app/middlewares/globalErrorHandler"));
const notFound_1 = __importDefault(require("./app/middlewares/notFound"));
const routes_1 = __importDefault(require("./app/routes"));
const config_1 = __importDefault(require("./app/config"));
const node_cron_1 = __importDefault(require("node-cron"));
const path_1 = __importDefault(require("path"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const fs_1 = __importDefault(require("fs"));
const logService_1 = require("./utils/logService");
const backupService_1 = require("./utils/backupService");
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
require("./queue/classReport.worker");
const feeGenerate_1 = require("./jobs/feeGenerate");
const mealBalance_job_1 = require("./jobs/mealBalance.job");
// Define ARCHIVE_PATH
const rootDir = process.cwd();
const ARCHIVE_PATH = path_1.default.join(rootDir, 'public', 'craftmanagement.gzip');
// Logging middleware in development environment
if (config_1.default.NODE_ENV === 'development') {
    app.use((0, morgan_1.default)('dev'));
}
app.set('view engine', 'ejs');
app.use(express_1.default.static(path_1.default.join('public')));
app.set('trust proxy', 1);
// Rate limiting middleware
app.use((0, express_rate_limit_1.default)({
    max: 2000,
    windowMs: 60 * 60 * 1000,
    message: 'Too many requests sent by this IP, please try again in an hour!',
}));
// Parsers
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '50mb' }));
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
const allowedOrigins = [
    'https://craftinternationalinstitute.com',
    'https://www.craftinternationalinstitute.com',
    'https://admin.craftinternationalinstitute.com',
    'https://server.craftinternationalinstitute.com',
    'http://localhost:3000',
    'http://localhost:3001',
];
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            console.error('Blocked by CORS:', origin);
            callback(null, false);
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.options('*', (0, cors_1.default)());
// Health Check
app.get('/health', (req, res) => {
    res.json({
        status: 'success',
        message: 'API is healthy',
    });
});
// Root Endpoint
app.get('/', (req, res) => {
    res.json({
        status: 'success',
        message: 'Welcome to the API',
        data: {
            name: 'API',
            version: '1.0.0',
        },
    });
});
app.get('/api/v1/logs', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield (0, logService_1.getAllLogsService)(req);
        res.status(200).json(result);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to read log files' });
    }
}));
app.post('/api/v1/backup', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield (0, backupService_1.backupMongoDB)();
        res.json({ status: 'success', message: 'Backup completed successfully' });
    }
    catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Backup failed',
            error: error.message,
        });
    }
}));
node_cron_1.default.schedule('0 0 * * *', () => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Running automatic database backup...');
    try {
        yield (0, backupService_1.backupMongoDB)();
        console.log('Automatic backup completed successfully ✅');
    }
    catch (error) {
        console.error('Automatic backup failed ❌', error.message);
    }
}));
// startMealCron();
(0, feeGenerate_1.startFeeGenerationCron)();
(0, mealBalance_job_1.startMealFeeGenerationCron)();
app.post('/api/v1/restore', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield (0, backupService_1.restoreMongoDB)();
        res.json({ status: 'success', message: 'Restore completed successfully' });
    }
    catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Restore failed',
            error: error.message,
        });
    }
}));
app.get('/api/v1/download-backup', (req, res) => {
    res.download(ARCHIVE_PATH, 'craft-int.gzip');
});
app.get('/api/v1/backup-logs', (req, res) => {
    const logPath = path_1.default.join(process.cwd(), 'public', 'backup_logs.json');
    if (fs_1.default.existsSync(logPath)) {
        const logs = JSON.parse(fs_1.default.readFileSync(logPath, 'utf8'));
        // Sort logs by backupEndTime in descending order
        logs.sort((a, b) => new Date(b.backupEndTime).getTime() -
            new Date(a.backupEndTime).getTime());
        res.json(logs);
    }
    else {
        res.status(404).json({ message: 'No logs found' });
    }
});
// Application Routes
app.use('/api/v1', routes_1.default);
// createAccountant();
// updateFeesClassField();
// Error Handlers
app.use(globalErrorHandler_1.default);
app.use(notFound_1.default);
exports.default = app;
