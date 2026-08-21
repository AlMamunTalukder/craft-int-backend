"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.classReportQueue = exports.redisConnection = void 0;
const bullmq_1 = require("bullmq");
exports.redisConnection = {
    connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT) || 6379,
    },
};
exports.classReportQueue = new bullmq_1.Queue('classReportQueue', exports.redisConnection);
