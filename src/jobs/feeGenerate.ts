
import cron from 'node-cron';
import { feeGenerationService } from '../app/services/feeGenerate.service';


let isInitialized = false;

export const startFeeGenerationCron = () => {
    if (isInitialized) {
        console.log('⚠️ Fee generation cron already initialized');
        return;
    }

    console.log(' Initializing Fee Generation Cron Job...');



    cron.schedule('0 0 1 * *', async () => {
        console.log('\n───────────────────────────────────────────────────');
        console.log(' FEE GENERATION CRON JOB TRIGGERED');
        console.log(` Date: ${new Date().toISOString()}`);


        try {
            const result = await feeGenerationService.generateCurrentMonthFees();
            if (result.data && result.data.generatedFeeRecords > 0) {
                console.log('\n Fee generate successfully!');
                console.log(`Generate reqord: ${result.data.generatedFeeRecords}`);
                console.log(`Total: ৳${result.data.totalAmount?.toLocaleString()}`);
            }
        } catch (error) {
            console.error('❌ Fee generation cron job failed:', error);
        }
    });


    setTimeout(async () => {

        try {
            const result = await feeGenerationService.generateCurrentMonthFees();
            if (result.data && result.data.generatedFeeRecords > 0) {
                console.log(`Generated ${result.data.generatedFeeRecords} new fee records on startup`);
                console.log(` Total Amount: ৳${result.data.totalAmount?.toLocaleString()}`);
                console.log(` Paid from Advance: ৳${result.data.totalPaid?.toLocaleString()}`);
            } else if (result.data && result.data.skippedCount > 0) {
                console.log(`ℹ All fees already generated (${result.data.skippedCount} students skipped)`);
            }
        } catch (error) {
            console.error('❌ Initial fee generation check failed:', error);
        }
    }, 15000);

    isInitialized = true;

};