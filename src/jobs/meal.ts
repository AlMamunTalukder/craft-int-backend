// cron/mealCron.ts
import cron from 'node-cron';
import moment from 'moment';
import { Student } from '../app/modules/student/student.model';
import { MealAttendance } from '../app/modules/mealAttendance/model';
import { Types } from 'mongoose';

const MEAL_RATE = 55;

// ছুটির দিন চেক করার ফাংশন
async function checkIfHoliday(date: string, academicYear: string): Promise<boolean> {
    try {
        // আপনার holiday model থাকলে আনকমেন্ট করুন
        // const { Holiday } = await import('../app/modules/holiday/model');
        // const holiday = await Holiday.findOne({
        //     date: moment(date).format('YYYY-MM-DD'),
        //     academicYear: academicYear,
        // });
        // return !!holiday;

        return false;
    } catch (error) {
        console.error('Error checking holiday:', error);
        return false;
    }
}

export const startMealCron = () => {
    // প্রতি দিন রাত ১২:০৫ মিনিটে রান করবে
    cron.schedule('5 0 * * *', async () => {
        try {
            const today = moment().format('YYYY-MM-DD');
            const month = moment().format('YYYY-MM');
            const academicYear = moment().year().toString();

            const isHoliday = await checkIfHoliday(today, academicYear);

            const students = await Student.find({
                admissionStatus: 'enrolled',
                activeSession: { $in: [academicYear] },
            }).select('_id');

            if (!students.length) {
                console.log(`⚠️ No enrolled students found for ${academicYear}`);
                return;
            }

            const operations = students.map(student => {
                const totalMeals = 0;
                const mealCost = 0;

                return {
                    updateOne: {
                        filter: {
                            student: student._id,
                            date: today,
                            academicYear,
                        },
                        update: {
                            $setOnInsert: {
                                student: student._id,
                                date: today,
                                month,
                                academicYear,
                                mealRate: MEAL_RATE,
                            },
                            $set: {
                                breakfast: false,
                                lunch: false,
                                dinner: false,
                                totalMeals,
                                mealCost,
                                isHoliday,
                                isAbsent: false,
                            }
                        },
                        upsert: true,
                    },
                };
            });

            if (operations.length > 0) {
                const result = await MealAttendance.bulkWrite(operations);
                console.log(`✅ Daily meal records created for ${today}${isHoliday ? ' (Holiday)' : ''}`);
                console.log(`📊 Modified: ${result.modifiedCount}, Upserted: ${result.upsertedCount}`);
            }

        } catch (error) {
            console.error('❌ Cron Error:', error);
        }
    });

    console.log('🕐 Meal attendance cron job started (runs daily at 12:05 AM)');
};