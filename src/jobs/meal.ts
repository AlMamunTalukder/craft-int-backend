// // cron/mealCron.ts
// import cron from 'node-cron';
// import { Student } from '../app/modules/student/student.model';
// import { MealAttendance } from '../app/modules/mealAttendance/model';

// const MEAL_RATE = 55;

// const MONTH_NAMES = [
//     'January', 'February', 'March', 'April', 'May', 'June',
//     'July', 'August', 'September', 'October', 'November', 'December'
// ];

// async function checkIfHoliday(_date: Date, _academicYear: string): Promise<boolean> {
//     // TODO: holiday logic
//     return false;
// }

// export const startMealCron = () => {
//     // প্রতিদিন রাত ১২:০৫ এ run করবে
//     cron.schedule('5 0 * * *', async () => {
//         try {
//             const now = new Date();

//             // ✅ date: Date object (model এ Date type)
//             const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

//             // ✅ month: 'January' format — model এর enum এর সাথে match
//             const monthName = MONTH_NAMES[now.getMonth()];

//             // ✅ academicYear: '2026' format
//             const academicYear = now.getFullYear().toString();

//             const isHoliday = await checkIfHoliday(todayDate, academicYear);

//             const students = await Student.find({
//                 admissionStatus: 'enrolled',
//                 status: 'active',
//             }).select('_id');

//             if (!students.length) {
//                 console.log(`⚠️ No enrolled students found`);
//                 return;
//             }

//             // ✅ bulkWrite এ pre-save hook কাজ করে না
//             // তাই totalMeals এবং mealCost manually set করতে হবে
//             const operations = students.map(student => ({
//                 updateOne: {
//                     filter: {
//                         student: student._id,
//                         date: todayDate,
//                         academicYear,
//                     },
//                     update: {
//                         $setOnInsert: {
//                             student: student._id,
//                             date: todayDate,
//                             month: monthName,   // ✅ 'January' format
//                             academicYear,
//                             mealRate: MEAL_RATE,
//                             breakfast: false,
//                             lunch: false,
//                             dinner: false,
//                             totalMeals: 0,      // ✅ manually set (hook কাজ করে না bulkWrite এ)
//                             mealCost: 0,
//                             isHoliday,
//                             isAbsent: false,
//                         },
//                     },
//                     upsert: true,
//                 },
//             }));

//             const result = await MealAttendance.bulkWrite(operations);

//             console.log(`✅ Meal records created: ${todayDate.toDateString()} (${monthName} ${academicYear})`);
//             console.log(`   Modified: ${result.modifiedCount}, Inserted: ${result.upsertedCount}`);

//         } catch (error) {
//             console.error('❌ Meal cron error:', error);
//         }
//     });

//     console.log('🕐 Meal attendance cron started (daily at 12:05 AM)');
// };