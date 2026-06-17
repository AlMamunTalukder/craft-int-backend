/* eslint-disable @typescript-eslint/no-explicit-any */
import cron from 'node-cron';
import { mealFeeBalanceService } from '../app/services/mealFeeBalance.service';

let isInitialized = false;

export const startMealFeeGenerationCron = () => {
    if (isInitialized) {
        console.log('⚠️ Meal fee generation cron already initialized');
        return;
    }

    cron.schedule(
        '59 23 28-31 * *',
        async () => {
            const now = new Date();
            const currentMonthIndex = now.getMonth();
            const currentYear = now.getFullYear();
            const currentDay = now.getDate();
            const lastDayOfMonth = new Date(currentYear, currentMonthIndex + 1, 0).getDate();

            console.log(
                ` [CRON Check] Today: ${now.toDateString()} | Day: ${currentDay} | Last Day of Month: ${lastDayOfMonth}`
            );

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
                const result = await mealFeeBalanceService.generateAllStudentsMealFee(
                    targetMonth,
                    currentYear,
                    55 // Default meal rate
                );

                if (result.success) {
                    console.log(`✅ [CRON] Generation completed successfully`);
                    console.log(`📊 ${result.data.successCount} students processed`);
                    console.log(`💰 Total amount: ৳${result.data.totalAmount?.toLocaleString() || 0}`);
                    console.log(`💵 Total due: ৳${result.data.totalDue?.toLocaleString() || 0}`);
                } else {
                    console.log(`❌ [CRON] Generation failed: ${result.message}`);
                }
            } catch (error: any) {
                console.error('❌ [CRON] Meal fee generation failed:', error.message);
            }
        },
        {
            timezone: 'Asia/Dhaka',
        }
    );

    isInitialized = true;
    console.log('✅ Meal Fee Generation Cron initialized');
    console.log('   Schedule: Last day of every month at 11:59 PM (Local Time)');
};

export const triggerMealFeeGenerationManually = async (
    month: number,
    year: number,
    mealRate: number = 55
) => {
    console.log(`🔧 Manually triggering meal fee generation for ${month}/${year}`);
    return await mealFeeBalanceService.generateAllStudentsMealFee(month, year, mealRate);
};