// scripts/updateFeesClassField.ts
import mongoose from 'mongoose';
import { Fees } from '../app/modules/fees/model';
import { Student } from '../app/modules/student/student.model';
import { Enrollment } from '../app/modules/enrollment/model';

export const updateFeesClassField = async () => {
    try {
        console.log('Starting fees class field update...');

        // Find all fees where class field is missing or empty
        const fees = await Fees.find({
            $or: [
                { class: { $exists: false } },
                { class: '' },
                { class: null },
            ],
        }).lean();

        console.log(`Found ${fees.length} fees to update`);

        let updatedCount = 0;
        let skippedCount = 0;

        for (const fee of fees) {
            let className: string | null = null;

            // First try enrollment (more specific to this fee record)
            if (fee.enrollment) {
                const enrollment = await Enrollment.findById(fee.enrollment)
                    .populate<{ className: { _id: mongoose.Types.ObjectId; className: string }[] }>('className')
                    .lean();

                if (enrollment?.className) {
                    if (Array.isArray(enrollment.className) && enrollment.className.length > 0) {
                        const classObj = enrollment.className[0];
                        // After populate: { _id: "...", className: "One" }
                        className =
                            typeof classObj === 'object' && 'className' in classObj
                                ? (classObj as { className: string }).className
                                : null;
                    }
                }
            }

            // Fallback: try student
            if (!className && fee.student) {
                const student = await Student.findById(fee.student)
                    .populate<{ className: { _id: mongoose.Types.ObjectId; className: string }[] }>('className')
                    .lean();

                if (student?.className) {
                    if (Array.isArray(student.className) && student.className.length > 0) {
                        const classObj = student.className[0];
                        className =
                            typeof classObj === 'object' && 'className' in classObj
                                ? (classObj as { className: string }).className
                                : null;
                    }
                }
            }

            if (className) {
                await Fees.findByIdAndUpdate(fee._id, { class: className });
                updatedCount++;
                console.log(`Updated fee ${fee._id} → class: ${className}`);
            } else {
                skippedCount++;
                console.log(`Skipped fee ${fee._id} — no class found`);
            }
        }

        console.log('\n=== Summary ===');
        console.log(`Total processed: ${fees.length}`);
        console.log(`Updated:         ${updatedCount}`);
        console.log(`Skipped:         ${skippedCount}`);
    } catch (error) {
        console.error('Error updating fees class field:', error);
    }
};