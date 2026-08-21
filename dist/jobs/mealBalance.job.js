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
exports.triggerMealFeeGenerationManually = exports.startMealFeeGenerationCron = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const node_cron_1 = __importDefault(require("node-cron"));
const mealFeeBalance_service_1 = require("../app/services/mealFeeBalance.service");
let isInitialized = false;
const startMealFeeGenerationCron = () => {
    if (isInitialized) {
        console.log('⚠️ Meal fee generation cron already initialized');
        return;
    }
    node_cron_1.default.schedule('59 23 28-31 * *', () => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b;
        const now = new Date();
        const currentMonthIndex = now.getMonth();
        const currentYear = now.getFullYear();
        const currentDay = now.getDate();
        const lastDayOfMonth = new Date(currentYear, currentMonthIndex + 1, 0).getDate();
        console.log(` [CRON Check] Today: ${now.toDateString()} | Day: ${currentDay} | Last Day of Month: ${lastDayOfMonth}`);
        // Only execute if today is actually the last day
        if (currentDay !== lastDayOfMonth) {
            console.log(`⏭️ Skipping... Not the last day of the month.`);
            return;
        }
        // Calculate the "Target Month" for fee generation (The month that is ending)
        const targetMonth = currentMonthIndex + 1;
        console.log(`\n🍽️ [CRON] Starting automatic meal fee generation for ${targetMonth}/${currentYear}`);
        console.log(`⏰ Time: ${now.toLocaleString()}`);
        try {
            const result = yield mealFeeBalance_service_1.mealFeeBalanceService.generateAllStudentsMealFee(targetMonth, currentYear, 55 // Default meal rate
            );
            if (result.success) {
                console.log(`✅ [CRON] Generation completed successfully`);
                console.log(`📊 ${result.data.successCount} students processed`);
                console.log(`💰 Total amount: ৳${((_a = result.data.totalAmount) === null || _a === void 0 ? void 0 : _a.toLocaleString()) || 0}`);
                console.log(`💵 Total due: ৳${((_b = result.data.totalDue) === null || _b === void 0 ? void 0 : _b.toLocaleString()) || 0}`);
            }
            else {
                console.log(`❌ [CRON] Generation failed: ${result.message}`);
            }
        }
        catch (error) {
            console.error('❌ [CRON] Meal fee generation failed:', error.message);
        }
    }), {
        timezone: 'Asia/Dhaka',
    });
    isInitialized = true;
    console.log('✅ Meal Fee Generation Cron initialized');
    console.log('   Schedule: Last day of every month at 11:59 PM (Local Time)');
};
exports.startMealFeeGenerationCron = startMealFeeGenerationCron;
const triggerMealFeeGenerationManually = (month_1, year_1, ...args_1) => __awaiter(void 0, [month_1, year_1, ...args_1], void 0, function* (month, year, mealRate = 55) {
    console.log(`🔧 Manually triggering meal fee generation for ${month}/${year}`);
    return yield mealFeeBalance_service_1.mealFeeBalanceService.generateAllStudentsMealFee(month, year, mealRate);
});
exports.triggerMealFeeGenerationManually = triggerMealFeeGenerationManually;
