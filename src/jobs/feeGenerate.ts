/* eslint-disable @typescript-eslint/no-explicit-any */
import cron from 'node-cron';
import { feeGenerationService } from '../app/services/feeGenerate.service';

let isInitialized = false;
let isGenerating = false;

export const startFeeGenerationCron = () => {
    if (isInitialized) {
        console.log('✅ Fee generation cron already initialized');
        return;
    }

    // Schedule to run on the 1st of every month at 12:05 AM (give some buffer time)
    cron.schedule('5 0 1 * *', async () => {
        if (isGenerating) {
            console.log('⚠️ Fee generation already in progress, skipping this cron run');
            return;
        }

        console.log('\n───────────────────────────────────────────────────');
        console.log('🔄 FEE GENERATION CRON JOB TRIGGERED');
        console.log(`📅 Date: ${new Date().toISOString()}`);
        console.log('───────────────────────────────────────────────────\n');

        isGenerating = true;

        try {
            const result = await feeGenerationService.generateCurrentMonthFees();

            if (result.data && result.data.generatedFeeRecords > 0) {
                console.log('\n✅ Fee generation completed successfully!');
                console.log(`📊 Generated ${result.data.generatedFeeRecords} fee records`);
                console.log(`   - Admission Fee: ${result.data.admissionFeesGenerated}`);
                console.log(`   - Monthly Fees: ${result.data.monthlyFeesGenerated}`);
                console.log(`💰 Total Amount: ৳${result.data.totalAmount?.toLocaleString()}`);
                console.log(`💸 Total Due: ৳${result.data.totalDue?.toLocaleString()}`);
            } else if (result.data && result.data.skippedCount > 0) {
                console.log(`ℹ️ No new fees generated (${result.data.skippedCount} students skipped)`);
            }
        } catch (error: any) {
            console.error('❌ Fee generation cron job failed:', error?.message || error);
        } finally {
            isGenerating = false;
        }
    });

    // Initial check on startup
    setTimeout(async () => {
        if (isGenerating) {
            console.log('⚠️ Fee generation already in progress, skipping initial check');
            return;
        }

        console.log('\n🔍 Checking if any fees need to be generated on startup...');

        isGenerating = true;

        try {
            const result = await feeGenerationService.generateCurrentMonthFees();

            if (result.data && result.data.generatedFeeRecords > 0) {
                console.log(`✅ Generated ${result.data.generatedFeeRecords} new fee records on startup`);
                console.log(`   - Admission Fee: ${result.data.admissionFeesGenerated}`);
                console.log(`   - Monthly Fees: ${result.data.monthlyFeesGenerated}`);
                console.log(`💰 Total Amount: ৳${result.data.totalAmount?.toLocaleString()}`);
            } else if (result.data && result.data.skippedCount > 0) {
                console.log(`ℹ️ All fees are up to date (${result.data.skippedCount} students have no new fees)`);
            }
        } catch (error: any) {
            console.error('❌ Initial fee generation check failed:', error?.message || error);
        } finally {
            isGenerating = false;
        }
    }, 20000); // Wait 20 seconds for DB connection to establish

    isInitialized = true;
    console.log('✅ Fee generation cron job initialized successfully');
};