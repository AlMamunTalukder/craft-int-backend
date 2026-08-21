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
exports.startFeeGenerationCron = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const node_cron_1 = __importDefault(require("node-cron"));
const feeGenerate_service_1 = require("../app/services/feeGenerate.service");
let isInitialized = false;
let isGenerating = false;
const startFeeGenerationCron = () => {
    if (isInitialized) {
        return;
    }
    node_cron_1.default.schedule('5 0 1 * *', () => __awaiter(void 0, void 0, void 0, function* () {
        if (isGenerating) {
            return;
        }
        isGenerating = true;
        try {
            const result = yield feeGenerate_service_1.feeGenerationService.generateCurrentMonthFees();
            if (result.data && result.data.generatedFeeRecords > 0) {
            }
            else if (result.data && result.data.skippedCount > 0) {
            }
        }
        catch (error) {
            console.error('❌ Fee generation cron job failed:', (error === null || error === void 0 ? void 0 : error.message) || error);
        }
        finally {
            isGenerating = false;
        }
    }));
    // Initial check on startup
    setTimeout(() => __awaiter(void 0, void 0, void 0, function* () {
        if (isGenerating) {
            return;
        }
        isGenerating = true;
        try {
            const result = yield feeGenerate_service_1.feeGenerationService.generateCurrentMonthFees();
            if (result.data && result.data.generatedFeeRecords > 0) {
            }
            else if (result.data && result.data.skippedCount > 0) {
                console.log(`ℹ️ All fees are up to date (${result.data.skippedCount} students have no new fees)`);
            }
        }
        catch (error) {
            console.error('❌ Initial fee generation check failed:', (error === null || error === void 0 ? void 0 : error.message) || error);
        }
        finally {
            isGenerating = false;
        }
    }), 20000); // Wait 20 seconds for DB connection to establish
    isInitialized = true;
    console.log('✅ Fee generation cron job initialized successfully');
};
exports.startFeeGenerationCron = startFeeGenerationCron;
