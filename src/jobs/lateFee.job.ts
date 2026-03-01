import cron from 'node-cron';
import { lateFeeService } from '../app/modules/fees/lateFeeService';

// Run every day at 11:59 PM
cron.schedule('59 23 * * *', async () => {
  console.log(
    '🚀 Running daily late fee calculation...',
    new Date().toLocaleString(),
  );

  try {
    const result = await lateFeeService.applyDailyLateFees();

    console.log('✅ Daily late fee calculation completed:', {
      date: new Date().toLocaleDateString(),
      processed: result.totalProcessed,
      totalLateFee: result.totalLateFeeApplied,
      details: result.details.map((d) => ({
        student: d.studentName,
        month: d.month,
        days: d.daysLate,
        amount: d.lateFeeAmount,
      })),
    });

    // If any late fees were applied, log details
    if (result.details.length > 0) {
      console.log(
        '📊 Late fee details:',
        JSON.stringify(result.details, null, 2),
      );
    }
  } catch (error) {
    console.error('❌ Daily late fee calculation failed:', error);
  }
});

// Also run at 12:05 AM to catch any missed calculations
cron.schedule('5 0 * * *', async () => {
  console.log(
    '🔄 Running backup late fee calculation...',
    new Date().toLocaleString(),
  );

  try {
    const result = await lateFeeService.applyDailyLateFees();
    console.log('✅ Backup calculation completed:', result);
  } catch (error) {
    console.error('❌ Backup calculation failed:', error);
  }
});
