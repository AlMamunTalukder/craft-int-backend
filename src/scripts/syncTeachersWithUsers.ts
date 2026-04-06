// scripts/syncTeachersWithUsers.ts
import mongoose from 'mongoose';
import { Teacher } from '../app/modules/teacher/teacher.model';
import config from '../app/config';
import { User } from '../app/modules/user/user.model';

export const syncTeachersWithUsers = async () => {
  try {
    await mongoose.connect(config.database_url as string);
    console.log('Connected to database');

    // Get all teachers
    const teachers = await Teacher.find({});
    console.log(`Found ${teachers.length} teachers`);

    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (const teacher of teachers) {
      try {
        // Check if user already exists
        const existingUser = await User.findOne({
          $or: [{ email: teacher.email }, { userId: teacher.teacherId }],
        });

        if (existingUser) {
          console.log(
            `User already exists for teacher: ${teacher.email} (${teacher.name})`,
          );
          skipped++;
          continue;
        }

        // Create user for teacher
        const userData = {
          email: teacher.email,
          password: 'teacher123', // Default password, they should change it on first login
          name: teacher.name,
          userId: teacher.teacherId,
          role: 'teacher',
          needPasswordChange: true, // Force password change on first login
          status: 'active',
          isDeleted: false,
        };

        await User.create(userData);
        console.log(
          `✅ Created user for teacher: ${teacher.email} (${teacher.name})`,
        );
        created++;
      } catch (error) {
        console.error(
          `❌ Error creating user for teacher ${teacher.email}:`,
          error,
        );
        errors++;
      }
    }

    console.log('\n=== Summary ===');
    console.log(`Total teachers: ${teachers.length}`);
    console.log(`✅ Users created: ${created}`);
    console.log(`⏭️  Skipped (already exists): ${skipped}`);
    console.log(`❌ Errors: ${errors}`);

    await mongoose.disconnect();
  } catch (error) {
    console.error('Sync failed:', error);
  }
};
