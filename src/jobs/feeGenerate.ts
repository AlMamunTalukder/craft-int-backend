
import cron from 'node-cron';
import { feeGenerationService } from '../app/services/feeGenerate.service';

let isInitialized = false;

export const startFeeGenerationCron = () => {
    if (isInitialized) {
        console.log(' Fee generation cron already initialized');
        return;
    }

    // Schedule to run on the 1st of every month at midnight
    cron.schedule('0 0 1 * *', async () => {
        console.log('\n───────────────────────────────────────────────────');
        console.log(' FEE GENERATION CRON JOB TRIGGERED');
        console.log(` Date: ${new Date().toISOString()}`);
        console.log('───────────────────────────────────────────────────\n');

        try {
            const result = await feeGenerationService.generateCurrentMonthFees();
            if (result.data && result.data.generatedFeeRecords > 0) {
                console.log('\n ফি জেনারেশন সফলভাবে সম্পন্ন হয়েছে!');
                console.log(` Generated ${result.data.generatedFeeRecords} fee records`);
                console.log(`   - Admission Fee: ${result.data.admissionFeesGenerated}`);
                console.log(`   - Monthly Fees: ${result.data.monthlyFeesGenerated}`);
                console.log(` Total Amount: ৳${result.data.totalAmount?.toLocaleString()}`);
                console.log(` Total Due: ৳${result.data.totalDue?.toLocaleString()}`);
            } else if (result.data && result.data.skippedCount > 0) {
                console.log(`ℹ No new fees generated (${result.data.skippedCount} students skipped)`);
            }
        } catch (error) {
            console.error(' Fee generation cron job failed:', error);
        }
    });

    // Initial check on startup
    setTimeout(async () => {
        console.log('\n Checking if any fees need to be generated on startup...');
        try {
            const result = await feeGenerationService.generateCurrentMonthFees();
            if (result.data && result.data.generatedFeeRecords > 0) {
                console.log(` Generated ${result.data.generatedFeeRecords} new fee records on startup`);
                console.log(`   - Admission Fee: ${result.data.admissionFeesGenerated}`);
                console.log(`   - Monthly Fees: ${result.data.monthlyFeesGenerated}`);
                console.log(` Total Amount: ৳${result.data.totalAmount?.toLocaleString()}`);
            } else if (result.data && result.data.skippedCount > 0) {
                console.log(`ℹ All fees are up to date (${result.data.skippedCount} students have no new fees)`);
            }
        } catch (error) {
            console.error('❌ Initial fee generation check failed:', error);
        }
    }, 15000);

    isInitialized = true;
    console.log('✅ Fee generation cron job initialized successfully');
};