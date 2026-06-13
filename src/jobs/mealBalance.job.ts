/* eslint-disable @typescript-eslint/no-explicit-any */

import cron from 'node-cron';
import { mealFeeBalanceService } from '../app/services/mealFeeBalance.service';

let isInitialized = false;

/**
 * Start cron job for automatic meal fee generation
 * Runs on the last day of every month at 11:59 PM
 */
export const startMealFeeGenerationCron = () => {
    if (isInitialized) {
        console.log('⚠️ Meal fee generation cron already initialized');
        return;
    }

    // ✅ Runs at 23:59 on the last day of every month
    cron.schedule('59 23 28-31 * *', async () => {
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();

        // Check if today is the last day of the month
        const lastDayOfMonth = new Date(currentYear, currentMonth, 0).getDate();
        const currentDay = now.getDate();

        if (currentDay !== lastDayOfMonth) {
            console.log(`📅 Not last day of month (today: ${currentDay}, last: ${lastDayOfMonth}), skipping...`);
            return;
        }

        console.log(`\n🍽️ [CRON] Starting automatic meal fee generation for ${currentMonth}/${currentYear}`);
        console.log(`⏰ Time: ${now.toLocaleString()}`);

        try {
            const result = await mealFeeBalanceService.generateAllStudentsMealFee(
                currentMonth,
                currentYear,
                55
            );

            if (result.success) {
                console.log(`✅ [CRON] Generation completed successfully`);
                console.log(`📊 ${result.data.successCount} students processed`);
                console.log(`💰 Total amount: ৳${result.data.totalAmount.toLocaleString()}`);
                console.log(`💵 Total due: ৳${result.data.totalDue.toLocaleString()}`);
            } else {
                console.log(`❌ [CRON] Generation failed: ${result.message}`);
            }
        } catch (error: any) {
            console.error('❌ [CRON] Meal fee generation failed:', error.message);
        }
    });

    isInitialized = true;
    console.log('✅ Meal Fee Generation Cron initialized');
    console.log('   Schedule: Last day of every month at 11:59 PM');
};

/**
 * Manually trigger meal fee generation for testing
 */
export const triggerMealFeeGenerationManually = async (
    month: number,
    year: number,
    mealRate: number = 55
) => {
    console.log(`🔧 Manually triggering meal fee generation for ${month}/${year}`);
    return await mealFeeBalanceService.generateAllStudentsMealFee(month, year, mealRate);
};