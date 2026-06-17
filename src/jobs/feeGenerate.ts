/* eslint-disable @typescript-eslint/no-explicit-any */
import cron from 'node-cron';
import { feeGenerationService } from '../app/services/feeGenerate.service';

let isInitialized = false;
let isGenerating = false;

export const startFeeGenerationCron = () => {
    if (isInitialized) {
        return;
    }

    cron.schedule('5 0 1 * *', async () => {
        if (isGenerating) {

            return;
        }

        isGenerating = true;

        try {
            const result = await feeGenerationService.generateCurrentMonthFees();

            if (result.data && result.data.generatedFeeRecords > 0) {

            } else if (result.data && result.data.skippedCount > 0) {
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
            return;
        }


        isGenerating = true;

        try {
            const result = await feeGenerationService.generateCurrentMonthFees();

            if (result.data && result.data.generatedFeeRecords > 0) {

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