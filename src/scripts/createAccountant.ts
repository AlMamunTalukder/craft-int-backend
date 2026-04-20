// // scripts/createAccountantFinal.ts
// import mongoose from 'mongoose';
// import bcrypt from 'bcrypt';
// import config from '../app/config';

// export const createAccountantFinal = async () => {
//   try {
//     // Connect to MongoDB
//     await mongoose.connect(config.database_url as string);
//     console.log('✅ Connected to database');

//     const db = mongoose.connection.db;
//     const usersCollection = db.collection('users');

//     // Delete existing accountant
//     await usersCollection.deleteMany({ email: 'accountant@gmail.com' });
//     console.log('🗑️ Removed existing accountant');

//     // Generate password hash with salt rounds 10
//     const saltRounds = 10;
//     const plainPassword = 'accountant123';
//     const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);
//     console.log('Generated hash:', hashedPassword);

//     // Create new accountant
//     const result = await usersCollection.insertOne({
//       email: 'accountant@gmail.com',
//       name: 'Accountant',
//       password: hashedPassword,
//       userId: 'ACC001',
//       role: 'accountant',
//       needPasswordChange: false,
//       status: 'active',
//       isDeleted: false,
//       passwordChangeAt: new Date(),
//       createdAt: new Date(),
//       updatedAt: new Date(),
//     });

//     console.log('✅ Accountant created with ID:', result.insertedId);

//     // Verify the password works
//     const createdUser = await usersCollection.findOne({
//       email: 'accountant@gmail.com',
//     });
//     const verifyMatch = await bcrypt.compare(
//       'accountant123',
//       createdUser.password,
//     );
//     console.log(
//       '🔐 Password verification:',
//       verifyMatch ? '✅ SUCCESS' : '❌ FAILED',
//     );

//     await mongoose.disconnect();
//     console.log('✅ Done!');

//     if (verifyMatch) {
//       console.log('\n📝 You can now login with:');
//       console.log('   Email: accountant@gmail.com');
//       console.log('   Password: accountant123');
//     }
//   } catch (error) {
//     console.error('❌ Error:', error);
//     await mongoose.disconnect();
//   }
// };
