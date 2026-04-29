// jobs/mealBalance.job.ts
import cron from 'node-cron';
import { mealFeeBalanceService } from '../app/services/mealFeeBalance.service';

let isInitialized = false;

export const startMealBalanceCron = () => {
    if (isInitialized) {
        console.log('⚠️ Meal balance cron already initialized');
        return;
    }

    console.log('🚀 Initializing Meal Balance Cron Job...');
    console.log('═══════════════════════════════════════════════════');

    // মাসের শেষ দিন রাত ১১:৫৯ মিনিটে চালু হবে (সঠিক সিনট্যাক্স)
    // "59 23 28-31 * *" মানে: ২৮ থেকে ৩১ তারিখের মধ্যে যেটা শেষ তারিখ সেটাতে রাত ১১:৫৯ এ চালু হবে
    cron.schedule('59 23 28-31 * *', async () => {
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();
        const lastDayOfMonth = new Date(currentYear, currentMonth, 0).getDate();
        const currentDay = now.getDate();

        // শুধুমাত্র মাসের শেষ দিনে রান করবে
        if (currentDay === lastDayOfMonth) {
            console.log('\n───────────────────────────────────────────────────');
            console.log('🍽️ MEAL BALANCE CALCULATION CRON JOB TRIGGERED');
            console.log(`📅 Date: ${new Date().toISOString()}`);
            console.log('───────────────────────────────────────────────────\n');

            try {
                const result = await mealFeeBalanceService.calculateAllStudentsMonthlyMealBalance(currentMonth, currentYear);

                console.log(`✅ মিল ব্যালেন্স ক্যালকুলেশন সম্পূর্ণ:`);
                console.log(`   - মোট শিক্ষার্থী: ${result.data.totalStudents}`);
                console.log(`   - সফল: ${result.data.successCount}`);
                console.log(`   - ত্রুটি: ${result.data.errorCount}`);

                if (result.data.adjustments.length > 0) {
                    console.log(`\n📊 অ্যাডজাস্টমেন্ট সমূহ:`);
                    result.data.adjustments.forEach((adj: any) => {
                        console.log(`   - ${adj.studentName}: ${adj.message}`);
                    });
                }
            } catch (error) {
                console.error('❌ Meal balance cron job failed:', error);
            }
        }
    });

    isInitialized = true;
    console.log('✅ Meal Balance Cron Job initialized successfully');
    console.log('⏰ Will run on last day of every month at 11:59 PM\n');
};