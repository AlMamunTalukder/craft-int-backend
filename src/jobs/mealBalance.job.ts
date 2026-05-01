// jobs/mealFeeGeneration.job.ts
import cron from 'node-cron';
import { mealFeeBalanceService } from '../app/services/mealFeeBalance.service';

let isInitialized = false;

export const startMealFeeGenerationCron = () => {
    if (isInitialized) {
        console.log('⚠️ Meal fee generation cron already initialized');
        return;
    }

    console.log('🚀 Initializing Meal Fee Generation Cron Job...');
    console.log('═══════════════════════════════════════════════════');

    // মাসের শেষ দিন রাত ১১:৫৯ মিনিটে চালু হবে
    cron.schedule('59 23 28-31 * *', async () => {
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();
        const lastDayOfMonth = new Date(currentYear, currentMonth, 0).getDate();
        const currentDay = now.getDate();

        // শুধুমাত্র মাসের শেষ দিনে রান করবে
        if (currentDay === lastDayOfMonth) {
            console.log('\n───────────────────────────────────────────────────');
            console.log('🍽️ MEAL FEE GENERATION CRON JOB TRIGGERED');
            console.log(`📅 Date: ${new Date().toISOString()}`);
            console.log(`📆 Generating meal fees for: ${currentMonth}/${currentYear}`);
            console.log('───────────────────────────────────────────────────\n');

            try {
                const result = await mealFeeBalanceService.generateAllStudentsMealFee(
                    currentMonth,
                    currentYear,
                    55 // ডিফল্ট মিল রেট
                );

                console.log(`✅ মিল ফি জেনারেশন সম্পূর্ণ:`);
                console.log(`   - মোট শিক্ষার্থী: ${result.data.totalStudents}`);
                console.log(`   - সফল: ${result.data.successCount}`);
                console.log(`   - স্কিপড: ${result.data.skippedCount}`);
                console.log(`   - ত্রুটি: ${result.data.errorCount}`);
                console.log(`   - মোট ফি: ৳${result.data.totalAmount.toLocaleString()}`);

                if (result.data.generatedFees.length > 0) {
                    console.log(`\n📊 জেনারেটেড ফি সমূহ (প্রথম ১০টি):`);
                    result.data.generatedFees.slice(0, 10).forEach((fee: any) => {
                        console.log(`   - ${fee.studentName}: ৳${fee.totalMealCost} (${fee.totalMeals} meals)`);
                    });
                    if (result.data.generatedFees.length > 10) {
                        console.log(`   ... এবং ${result.data.generatedFees.length - 10} জন বেশি`);
                    }
                }
            } catch (error) {
                console.error('❌ Meal fee generation cron job failed:', error);
            }
        }
    });

    isInitialized = true;
    console.log('✅ Meal Fee Generation Cron Job initialized successfully');
    console.log('⏰ Will run on last day of every month at 11:59 PM');
    console.log('📝 Generates meal fees based on actual meal consumption\n');
};

// টেস্টিং এর জন্য ম্যানুয়াল ট্রিগার ফাংশন
export const triggerMealFeeGenerationManually = async (month: number, year: number, mealRate: number = 55) => {
    console.log('🧪 Manual trigger for testing...');
    return await mealFeeBalanceService.generateAllStudentsMealFee(month, year, mealRate);
};