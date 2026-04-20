// // scripts/standardizeAcademicYear.ts
// import mongoose from 'mongoose';
// import { Fees } from '../app/modules/fees/model';


// export const standardizeAcademicYear = async () => {
//     try {
//         await mongoose.connect('your-mongodb-uri');
//         console.log('Connected to MongoDB');

//         // Find all fees with academicYear in "YYYY-YYYY" format
//         const fees = await Fees.find({
//             academicYear: { $regex: /^\d{4}-\d{4}$/ }
//         });

//         console.log(`Found ${fees.length} fees to update`);

//         let updatedCount = 0;

//         for (const fee of fees) {
//             // Extract the first year from "2026-2027"
//             const currentYear = fee.academicYear.split('-')[0];

//             // Update to only the current year
//             fee.academicYear = currentYear;
//             await fee.save();

//             updatedCount++;
//             console.log(`Updated fee ${fee._id}: ${fee.academicYear} -> ${currentYear}`);
//         }

//         console.log('\n=== Summary ===');
//         console.log(`Total fees updated: ${updatedCount}`);

//         await mongoose.disconnect();
//         console.log('Disconnected from MongoDB');
//     } catch (error) {
//         console.error('Error updating academicYear:', error);
//         await mongoose.disconnect();
//     }
// };

// // Run the migration
