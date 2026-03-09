import cron from 'node-cron';
import { lateFeeService } from '../app/modules/fees/lateFeeService';

export const startLateFeeCron = () => {
  //59 23 * * * this run every midnight11.59

  cron.schedule('* * * * *', async () => {
    console.log('Running Late Fee Cron');

    try {
      const result = await lateFeeService.applyDailyLateFees();

      console.log('Late Fee Result', {
        processed: result.totalProcessed,
        lateFee: result.totalLateFeeApplied,
      });
    } catch (error) {
      console.error('Late Fee Cron Failed', error);
    }
  });
};
