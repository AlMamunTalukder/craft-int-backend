// scripts/createAccountantFixed.ts
import mongoose from 'mongoose';
import { User } from '../app/modules/user/user.model';
import config from '../app/config';
import bcrypt from 'bcrypt';

export const createAccountantFixed = async () => {
  try {
    await mongoose.connect(config.database_url as string);
    console.log('✅ Connected to database');

    // Delete existing accountant if exists
    await User.deleteMany({ email: 'accountant@gmail.com' });
    console.log('🗑️ Removed existing accountant');

    const saltRounds = Number(config.bcrypt_salt_round) || 10;
    const plainPassword = 'accountant123';
    const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);

    console.log(
      'Password hash created:',
      hashedPassword.substring(0, 30) + '...',
    );

    // Create accountant
    const accountant = await User.create({
      email: 'accountant@gmail.com',
      name: 'Accountant',
      password: hashedPassword,
      userId: 'ACC001',
      role: 'accountant',
      needPasswordChange: false,
      status: 'active',
      isDeleted: false,
    });

    console.log('✅ Accountant created successfully:', {
      id: accountant._id,
      email: accountant.email,
      userId: accountant.userId,
      role: accountant.role,
    });

    // Verify the password works
    const verifyUser = await User.findOne({
      email: 'accountant@gmail.com',
    }).select('+password');
    if (verifyUser) {
      const isMatch = await bcrypt.compare(
        'accountant123',
        verifyUser.password,
      );
      console.log(
        '🔐 Password verification test:',
        isMatch ? '✅ PASSED' : '❌ FAILED',
      );
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
  }
};
