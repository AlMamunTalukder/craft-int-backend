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
exports.clearClassReportsCachePattern = exports.clearClassReportsCache = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const ioredis_1 = __importDefault(require("ioredis"));
// Initialize Redis client
const redis = new ioredis_1.default({
    host: process.env.REDIS_HOST || "localhost",
    port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: 3,
});
const clearClassReportsCache = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const keys = yield redis.keys("class_reports:*");
        if (keys.length > 0) {
            yield redis.del(...keys);
        }
    }
    catch (error) {
        console.error("Error clearing class reports cache:", error);
    }
});
exports.clearClassReportsCache = clearClassReportsCache;
// Helper function to clear specific cache patterns
const clearClassReportsCachePattern = (pattern) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const keys = yield redis.keys(`class_reports:*${pattern}*`);
        if (keys.length > 0) {
            yield redis.del(...keys);
        }
    }
    catch (error) {
        console.error("Error clearing class reports cache pattern:", error);
    }
});
exports.clearClassReportsCachePattern = clearClassReportsCachePattern;
