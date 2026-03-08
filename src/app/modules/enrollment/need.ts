// export const createEnrollment = async (payload: any) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     // 1. Normalize Class Data
//     let classIds: any[] = [];
//     let primaryClassName = '';
//     let classNameForId = ''; // For student ID generation
//     console.log('payload this ', JSON.stringify(payload, null, 2));

//     if (Array.isArray(payload.className)) {
//       classIds = payload.className
//         .filter((cls: any) => cls && cls !== '')
//         .map((cls: any) => {
//           if (typeof cls === 'object') {
//             if (cls.className && !primaryClassName)
//               primaryClassName = cls.className;
//             if (cls.label && !primaryClassName) primaryClassName = cls.label;
//             return cls._id?.toString() || cls.value?.toString() || '';
//           }
//           const strVal = typeof cls === 'string' ? cls.trim() : '';
//           if (
//             strVal &&
//             !mongoose.Types.ObjectId.isValid(strVal) &&
//             !primaryClassName
//           )
//             primaryClassName = strVal;
//           return strVal;
//         })
//         .filter((id: any) => id !== '');
//     } else if (payload.className) {
//       const cls = payload.className;
//       if (typeof cls === 'object') {
//         if (cls.className && !primaryClassName)
//           primaryClassName = cls.className;
//         if (cls.label && !primaryClassName) primaryClassName = cls.label;
//         const id =
//           cls._id?.toString() || cls.value?.toString() || cls.id?.toString();
//         if (id) classIds.push(id);
//       } else if (typeof cls === 'string' && cls.trim()) {
//         const strVal = cls.trim();
//         if (mongoose.Types.ObjectId.isValid(strVal)) classIds.push(strVal);
//         else {
//           classIds.push(strVal);
//           if (!primaryClassName) primaryClassName = strVal;
//         }
//       }
//     }

//     const validClassIds = classIds.filter((id) =>
//       mongoose.Types.ObjectId.isValid(id),
//     );

//     // Get class name for ID generation
//     if (validClassIds.length > 0) {
//       const classDoc = await Class.findById(validClassIds[0]).session(session);
//       // Use proper field name from TClass interface
//       primaryClassName = classDoc?.className || validClassIds[0];
//       classNameForId = classDoc?.className || '';
//     }

//     // Normalize class name for ID generation
//     const normalizedClassName = classNameForId.toLowerCase();
//     console.log(
//       'Normalized class name for ID generation:',
//       normalizedClassName,
//     );

//     // Determine class code based on class name
//     let classCode = '00';
//     if (
//       normalizedClassName.includes('one') ||
//       normalizedClassName.includes('1')
//     )
//       classCode = '01';
//     else if (
//       normalizedClassName.includes('two') ||
//       normalizedClassName.includes('2')
//     )
//       classCode = '02';
//     else if (
//       normalizedClassName.includes('three') ||
//       normalizedClassName.includes('3')
//     )
//       classCode = '03';
//     else if (
//       normalizedClassName.includes('four') ||
//       normalizedClassName.includes('4')
//     )
//       classCode = '04';
//     else if (
//       normalizedClassName.includes('five') ||
//       normalizedClassName.includes('5')
//     )
//       classCode = '05';
//     else if (
//       normalizedClassName.includes('six') ||
//       normalizedClassName.includes('6')
//     )
//       classCode = '06';
//     else if (
//       normalizedClassName.includes('seven') ||
//       normalizedClassName.includes('7')
//     )
//       classCode = '07';
//     else if (
//       normalizedClassName.includes('eight') ||
//       normalizedClassName.includes('8')
//     )
//       classCode = '08';
//     else if (
//       normalizedClassName.includes('nine') ||
//       normalizedClassName.includes('9')
//     )
//       classCode = '09';
//     else if (
//       normalizedClassName.includes('ten') ||
//       normalizedClassName.includes('10')
//     )
//       classCode = '10';
//     console.log('Determined class code:', classCode);

//     if (!primaryClassName)
//       primaryClassName =
//         payload.studentDepartment === 'hifz' ? 'Hifz' : 'Class One';

//     // 2. Prepare Enrollment Data
//     const enrollmentData: any = {
//       studentId: payload.studentId || '',
//       studentName: payload.studentName || '',
//       nameBangla: payload.nameBangla || '',
//       studentPhoto: payload.studentPhoto || '',
//       mobileNo: payload.mobileNo || '',
//       rollNumber: payload.rollNumber || '',
//       className: validClassIds.length > 0 ? validClassIds[0] : null,
//       section: payload.section || '',
//       session: payload.session || new Date().getFullYear().toString(),
//       batch: payload.group || '',
//       studentType: payload.studentType || payload.category || 'Residential',
//       studentDepartment: payload.studentDepartment || 'hifz',
//       fatherName: payload.fatherName || '',
//       fatherNameBangla: payload.fatherNameBangla || '',
//       fatherMobile: payload.fatherMobile || '',
//       motherName: payload.motherName || '',
//       motherNameBangla: payload.motherNameBangla || '',
//       presentAddress: payload.presentAddress || {},
//       permanentAddress: payload.permanentAddress || {},
//       guardianInfo: payload.guardianInfo || {},
//       documents: payload.documents || {},
//       termsAccepted: payload.termsAccepted || false,
//       totalAmount: payload.totalAmount || 0,
//       paidAmount: payload.paidAmount || 0,
//       dueAmount: payload.dueAmount || 0,
//       paymentMethod: payload.paymentMethod || 'cash',
//       totalDiscount: payload.totalDiscount || 0,
//       paymentStatus: payload.paymentStatus || 'pending',
//       birthDate: payload.birthDate,
//       birthRegistrationNo: payload.birthRegistrationNo,
//       bloodGroup: payload.bloodGroup,
//       nationality: payload.nationality,
//       fatherNid: payload.fatherNid,
//       fatherProfession: payload.fatherProfession,
//       fatherIncome: payload.fatherIncome,
//       motherNid: payload.motherNid,
//       motherProfession: payload.motherProfession,
//       motherIncome: payload.motherIncome,
//       roll: payload.roll || payload.rollNumber,
//       previousSchool: payload.previousSchool || {},
//       admissionType: 'admission',
//       status: 'active',
//     };

//     // 3. Handle Student
//     let studentDoc: any = null;
//     let userDoc: any = null;

//     // Try to find existing student by ID or mobile
//     if (payload.studentId && payload.studentId.trim() !== '') {
//       studentDoc = await Student.findOne({
//         studentId: payload.studentId,
//       }).session(session);
//     }
//     if (!studentDoc && payload.mobileNo) {
//       studentDoc = await Student.findOne({ mobile: payload.mobileNo }).session(
//         session,
//       );
//     }

//     // Create new student if not found
//     if (!studentDoc) {
//       // Generate student ID using the class code
//       const year = new Date().getFullYear().toString().slice(-2);
//       const random = Math.floor(1000 + Math.random() * 9000);
//       const newStudentId = `CII${year}${classCode}${random}`;
//       console.log('Generated Student ID:', newStudentId);

//       // Generate email from student name or mobile
//       const email =
//         payload.email ||
//         `${payload.studentName?.toLowerCase().replace(/\s+/g, '.')}@student.craft.edu` ||
//         `student${Date.now().toString().slice(-6)}@craft.edu`;

//       // Generate default password
//       const defaultPassword = `Craft@${Date.now().toString().slice(-6)}`;

//       // Check if user already exists with this email
//       const existingUser = await User.findOne({ email }).session(session);

//       if (!existingUser) {
//         // Create user account for student
//         const userData = {
//           email: email,
//           name: payload.studentName || 'Student',
//           password: defaultPassword,
//           needPasswordChange: true,
//           role: 'student',
//           status: 'active',
//           isDeleted: false,
//         };

//         const [newUser] = await User.create([userData], { session });
//         userDoc = newUser;

//         console.log('User created for student:', {
//           email: userDoc.email,
//           role: userDoc.role,
//           userId: userDoc._id,
//         });
//       } else {
//         userDoc = existingUser;
//         console.log('Existing user found for student:', {
//           email: userDoc.email,
//           role: userDoc.role,
//           userId: userDoc._id,
//         });
//       }

//       const studentData: any = {
//         studentId: newStudentId,
//         name: payload.studentName,
//         nameBangla: payload.nameBangla,
//         email: email,
//         mobile: payload.mobileNo,
//         className: validClassIds.map((id) => new mongoose.Types.ObjectId(id)),
//         studentDepartment: payload.studentDepartment,
//         advanceBalance: payload.advanceBalance || 0,
//         payments: [],
//         receipts: [],
//         fees: [],
//         fatherName: payload.fatherName,
//         fatherMobile: payload.fatherMobile,
//         motherName: payload.motherName,
//         motherMobile: payload.motherMobile,
//         presentAddress: payload.presentAddress,
//         permanentAddress: payload.permanentAddress,
//         guardianInfo: payload.guardianInfo,
//         user: userDoc?._id,
//         birthDate: payload.birthDate,
//         birthRegistrationNo: payload.birthRegistrationNo,
//         bloodGroup: payload.bloodGroup,
//         gender: payload.gender,
//         fatherProfession: payload.fatherProfession,
//         fatherIncome: payload.fatherIncome,
//         motherProfession: payload.motherProfession,
//         motherIncome: payload.motherIncome,
//         previousSchool: payload.previousSchool,
//         documents: payload.documents,
//       };

//       const [newStudent] = await Student.create([studentData], { session });
//       studentDoc = newStudent;
//       enrollmentData.studentId = newStudentId;
//       enrollmentData.student = studentDoc._id;

//       console.log('Generated Student ID:', newStudentId);
//     } else {
//       // If student exists, check if they have a user account
//       if (!studentDoc.user) {
//         // Create user for existing student
//         const email =
//           payload.email ||
//           `${studentDoc.name?.toLowerCase().replace(/\s+/g, '.')}@student.craft.edu` ||
//           `student${Date.now().toString().slice(-6)}@craft.edu`;

//         const defaultPassword = `Craft@${Date.now().toString().slice(-6)}`;

//         const existingUser = await User.findOne({ email }).session(session);

//         if (!existingUser) {
//           const userData = {
//             email: email,
//             name: studentDoc.name || 'Student',
//             password: defaultPassword,
//             needPasswordChange: true,
//             role: 'student',
//             status: 'active',
//             isDeleted: false,
//           };

//           const [newUser] = await User.create([userData], { session });
//           userDoc = newUser;

//           // Update student with user reference
//           studentDoc.user = userDoc._id;
//           await studentDoc.save({ session });
//         } else {
//           userDoc = existingUser;
//           // Update student with existing user reference
//           studentDoc.user = userDoc._id;
//           await studentDoc.save({ session });
//         }
//       } else {
//         userDoc = await User.findById(studentDoc.user).session(session);
//       }

//       enrollmentData.student = studentDoc._id;
//     }

//     // 4. Create Enrollment
//     const [newEnrollment] = await Enrollment.create([enrollmentData], {
//       session,
//     });

//     // 5. Process Fees
//     const feeDocs: mongoose.Types.ObjectId[] = [];
//     const paidFeeIds: mongoose.Types.ObjectId[] = [];
//     let totalTransactionAmount = 0;
//     const MONTHS = [
//       'January',
//       'February',
//       'March',
//       'April',
//       'May',
//       'June',
//       'July',
//       'August',
//       'September',
//       'October',
//       'November',
//       'December',
//     ];

//     // Track total paid amount from payload
//     const totalPaidAmount = Number(payload.paidAmount) || 0;
//     let remainingPayment = totalPaidAmount;

//     // Check if fees array exists and has items
//     if (
//       !payload.fees ||
//       !Array.isArray(payload.fees) ||
//       payload.fees.length === 0
//     ) {
//       throw new Error('No fee categories were provided');
//     }

//     console.log(
//       'Processing fees from payload:',
//       JSON.stringify(payload.fees, null, 2),
//     );

//     // First, calculate total fee amount to determine payment distribution
//     const allFeeItems: any[] = [];

//     // Collect all fee items from all fee categories
//     for (const feeCategory of payload.fees) {
//       if (
//         feeCategory.feeItems &&
//         Array.isArray(feeCategory.feeItems) &&
//         feeCategory.feeItems.length > 0
//       ) {
//         console.log(
//           `Processing fee category: ${feeCategory.category || 'Unknown'}, items:`,
//           feeCategory.feeItems.length,
//         );

//         for (const feeItem of feeCategory.feeItems) {
//           // Get fee type string
//           const feeTypeStr =
//             typeof feeItem.feeType === 'string'
//               ? feeItem.feeType
//               : feeItem.feeType?.value || feeItem.feeType?.label || '';

//           if (!feeTypeStr) {
//             console.log('Skipping fee item with no fee type');
//             continue;
//           }

//           const className =
//             feeCategory.className && feeCategory.className.length > 0
//               ? feeCategory.className[0]?.label ||
//                 feeCategory.className[0] ||
//                 primaryClassName
//               : primaryClassName;

//           console.log(
//             `Processing fee item: ${feeTypeStr}, isMonthly: ${feeItem.isMonthly}, amount: ${feeItem.amount}`,
//           );

//           // Check if this is a monthly fee
//           if (feeItem.isMonthly) {
//             const amount = Number(feeItem.amount) || 0;
//             const discountRangeStart = feeItem.discountRangeStart || '';
//             const discountRangeEnd = feeItem.discountRangeEnd || '';
//             const discountRangeAmount =
//               Number(feeItem.discountRangeAmount) || 0;
//             const flatDiscount = Number(feeItem.discount) || 0;

//             const startIndex = MONTHS.indexOf(discountRangeStart);
//             const endIndex = MONTHS.indexOf(discountRangeEnd);

//             // Check if we have a valid range
//             const hasValidRange =
//               discountRangeStart &&
//               discountRangeEnd &&
//               startIndex !== -1 &&
//               endIndex !== -1;

//             for (let i = 0; i < 12; i++) {
//               const month = MONTHS[i];
//               const monthLabel = `Monthly Fee - ${month}`;

//               let itemDiscount = flatDiscount;

//               // Apply range discount if this month is within the range
//               if (hasValidRange) {
//                 const minIdx = Math.min(startIndex, endIndex);
//                 const maxIdx = Math.max(startIndex, endIndex);

//                 if (i >= minIdx && i <= maxIdx) {
//                   itemDiscount = discountRangeAmount;
//                 }
//               }

//               allFeeItems.push({
//                 feeType: monthLabel,
//                 amount: amount,
//                 discount: itemDiscount,
//                 month: month,
//                 isMonthly: true,
//                 className: className,
//                 // Store range data for reference
//                 discountRangeStart: hasValidRange ? discountRangeStart : '',
//                 discountRangeEnd: hasValidRange ? discountRangeEnd : '',
//                 discountRangeAmount: hasValidRange ? discountRangeAmount : 0,
//               });
//             }
//           } else {
//             // Non-monthly fee
//             const amount = Number(feeItem.amount) || 0;
//             const discount = Number(feeItem.discount) || 0;

//             allFeeItems.push({
//               feeType: feeTypeStr,
//               amount: amount,
//               discount: discount,
//               month: 'Admission',
//               isMonthly: false,
//               className: className,
//               discountRangeStart: '',
//               discountRangeEnd: '',
//               discountRangeAmount: 0,
//             });
//           }
//         }
//       } else {
//         console.log(`Fee category has no feeItems:`, feeCategory);
//       }
//     }

//     // Check if any fee items were collected
//     if (allFeeItems.length === 0) {
//       console.error('No fee items were collected from payload');
//       throw new Error('No fee items were created - no items found in payload');
//     }

//     console.log(`Collected ${allFeeItems.length} fee items`);

//     // Sort fee items: Admission fee first, then monthly fees in order
//     allFeeItems.sort((a, b) => {
//       if (a.month === 'Admission') return -1;
//       if (b.month === 'Admission') return 1;
//       return MONTHS.indexOf(a.month) - MONTHS.indexOf(b.month);
//     });

//     // Create fee documents with proper paid amount distribution
//     for (const item of allFeeItems) {
//       const netAmount = item.amount - item.discount;

//       // Determine paid amount for this fee item
//       let paidForThisItem = 0;
//       if (remainingPayment > 0) {
//         paidForThisItem = Math.min(remainingPayment, netAmount);
//         remainingPayment -= paidForThisItem;
//       }

//       const dueAmount = Math.max(0, netAmount - paidForThisItem);

//       const feeData = {
//         enrollment: newEnrollment._id,
//         student: studentDoc._id,
//         studentId: enrollmentData.studentId,
//         feeType: item.feeType,
//         amount: item.amount,
//         discount: item.discount,
//         paidAmount: paidForThisItem,
//         dueAmount: dueAmount,
//         className: item.className,
//         month: item.month,
//         academicYear: payload.session || new Date().getFullYear().toString(),
//         paymentMethod: payload.paymentMethod || 'cash',
//         status:
//           paidForThisItem >= netAmount
//             ? 'paid'
//             : paidForThisItem > 0
//               ? 'partial'
//               : 'unpaid',
//         // Store range data for monthly fees
//         ...(item.isMonthly && {
//           discountRangeStart: item.discountRangeStart || '',
//           discountRangeEnd: item.discountRangeEnd || '',
//           discountRangeAmount: item.discountRangeAmount || 0,
//         }),
//       };

//       console.log(
//         `Creating fee: ${item.feeType}, amount: ${item.amount}, discount: ${item.discount}, paid: ${paidForThisItem}`,
//       );

//       const [createdFee] = await Fees.create([feeData], { session });
//       feeDocs.push(createdFee._id);

//       if (paidForThisItem > 0) {
//         totalTransactionAmount += paidForThisItem;
//         paidFeeIds.push(createdFee._id);
//       }
//     }

//     // IMPORTANT: Check if any fees were created
//     if (feeDocs.length === 0) {
//       throw new Error('No fee items were created - fee creation failed');
//     }

//     console.log(`Created ${feeDocs.length} fee documents`);

//     // Update enrollment with fees
//     newEnrollment.fees = feeDocs;
//     await newEnrollment.save({ session });

//     // Update student with fees
//     studentDoc.fees = [...(studentDoc.fees || []), ...feeDocs];
//     await studentDoc.save({ session });

//     // 6. Create Payment & Receipt (if any payment was made)
//     let createdPayment: any = null;
//     let createdReceipt: any = null;

//     if (totalTransactionAmount > 0 && paidFeeIds.length > 0) {
//       // Generate unique receipt number
//       const timestamp = Date.now();
//       const random = Math.floor(Math.random() * 10000);
//       const receiptNo = `RCP-${timestamp}-${random}`;
//       const transactionId = `TXN-${timestamp}`;

//       // Create Payment
//       const paymentData = {
//         student: studentDoc._id,
//         enrollment: newEnrollment._id,
//         fees: paidFeeIds,
//         totalAmount: totalTransactionAmount,
//         paymentMethod: payload.paymentMethod || 'cash',
//         receiptNo: receiptNo,
//         transactionId: transactionId,
//         status: 'completed',
//         collectedBy: payload.collectedBy || 'Admin',
//         paymentDate: new Date(),
//       };

//       const [payment] = await Payment.create([paymentData], { session });
//       createdPayment = payment;

//       // Get detailed fees for receipt
//       const detailedReceiptFees = await Fees.find({
//         _id: { $in: paidFeeIds },
//       })
//         .session(session)
//         .lean();

//       const receiptFeesStructure = detailedReceiptFees.map((f: any) => {
//         const netAmount = Math.max(0, f.amount - (f.discount || 0));

//         // Extract month for receipt
//         let month = 'Admission';
//         if (f.feeType && f.feeType.includes('Monthly Fee - ')) {
//           const parts = f.feeType.split(' - ');
//           if (parts.length > 1) month = parts[1];
//         } else if (f.month) {
//           month = f.month;
//         }

//         return {
//           feeType: f.feeType,
//           month: month,
//           originalAmount: f.amount,
//           discount: f.discount || 0,
//           waiver: 0,
//           netAmount: netAmount,
//           paidAmount: f.paidAmount,
//         };
//       });

//       const totalReceiptDiscount = receiptFeesStructure.reduce(
//         (sum, item) => sum + (item.discount || 0),
//         0,
//       );

//       // Create Receipt
//       const receiptData = {
//         receiptNo: receiptNo,
//         student: studentDoc._id,
//         studentName: payload.studentName,
//         studentId: enrollmentData.studentId,
//         className: primaryClassName,
//         paymentId: createdPayment._id,
//         totalAmount: totalTransactionAmount,
//         paymentMethod: payload.paymentMethod || 'cash',
//         paymentDate: new Date(),
//         collectedBy: payload.collectedBy || 'Admin',
//         transactionId: transactionId,
//         fees: receiptFeesStructure,
//         summary: {
//           totalItems: receiptFeesStructure.length,
//           subtotal: receiptFeesStructure.reduce(
//             (sum, item) => sum + item.originalAmount,
//             0,
//           ),
//           totalDiscount: totalReceiptDiscount,
//           totalWaiver: 0,
//           totalNetAmount: receiptFeesStructure.reduce(
//             (sum, item) => sum + item.netAmount,
//             0,
//           ),
//           amountPaid: totalTransactionAmount,
//         },
//         status: 'active',
//       };

//       const [receipt] = await Receipt.create([receiptData], { session });
//       createdReceipt = receipt;

//       // Update student document with payment and receipt references
//       studentDoc.payments = [
//         ...(studentDoc.payments || []),
//         createdPayment._id,
//       ];
//       studentDoc.receipts = [
//         ...(studentDoc.receipts || []),
//         createdReceipt._id,
//       ];
//       await studentDoc.save({ session });

//       // Update enrollment with payment reference
//       newEnrollment.payment = createdPayment._id;
//       await newEnrollment.save({ session });
//     }

//     await session.commitTransaction();
//     session.endSession();

//     // Populate all relations for the response
//     const populatedEnrollment = (await Enrollment.findById(newEnrollment._id)
//       .populate({
//         path: 'student',
//         populate: [
//           { path: 'payments' },
//           { path: 'receipts' },
//           { path: 'fees' },
//           { path: 'user' },
//         ],
//       })
//       .populate('className')
//       .populate('fees')
//       .lean()) as any;

//     // Get the fully populated student with all relations
//     const populatedStudent = (await Student.findById(studentDoc._id)
//       .populate('payments')
//       .populate('receipts')
//       .populate('fees')
//       .populate('user')
//       .lean()) as any;

//     // Get the populated payment and receipt
//     let populatedPayment = null;
//     let populatedReceipt = null;

//     if (createdPayment) {
//       populatedPayment = (await Payment.findById(createdPayment._id)
//         .populate('fees')
//         .lean()) as any;
//     }

//     if (createdReceipt) {
//       populatedReceipt = (await Receipt.findById(createdReceipt._id)
//         .populate('student')
//         .lean()) as any;
//     }

//     return {
//       success: true,
//       message: 'Enrollment created successfully',
//       data: {
//         ...populatedEnrollment,
//         student: populatedStudent,
//         payment: populatedPayment,
//         receipt: populatedReceipt,
//         userCredentials: userDoc
//           ? {
//               email: userDoc.email,
//               role: userDoc.role,
//             }
//           : null,
//       },
//     };
//   } catch (error: any) {
//     if (session.inTransaction()) {
//       await session.abortTransaction();
//     }
//     session.endSession();

//     console.error('Enrollment creation error:', error);

//     // Return proper error response
//     return {
//       success: false,
//       message: error.message || 'Internal Server Error',
//       error: error,
//       data: null,
//     };
//   }
// };

// // ═════════════════════════════════════════════════════════════════════════════
// // UPDATE ENROLLMENT
// // ═════════════════════════════════════════════════════════════════════════════
// export const updateEnrollment = async (id: string, payload: any) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     console.log('=== updateEnrollment START ===', id);
//     console.log('payload.fees      :', JSON.stringify(payload.fees));
//     console.log('payload.paidAmount:', payload.paidAmount);

//     const enrollment = await Enrollment.findById(id).session(session);
//     if (!enrollment) throw new Error('Enrollment not found');

//     // ── 1. Update scalar fields ───────────────────────────────────────────────
//     const skipKeys = new Set([
//       'fees',
//       'totalAmount',
//       'paidAmount',
//       'dueAmount',
//       'totalDiscount',
//       'paymentStatus',
//     ]);
//     for (const key of Object.keys(payload)) {
//       if (!skipKeys.has(key) && payload[key] !== undefined) {
//         (enrollment as any)[key] = payload[key];
//       }
//     }
//     await enrollment.save({ session });

//     // ── 2. Re-process fees ────────────────────────────────────────────────────
//     if (Array.isArray(payload.fees) && payload.fees.length > 0) {
//       // Delete old fee docs + linked payments / receipts
//       const oldFees = await Fees.find({ enrollment: enrollment._id }).session(
//         session,
//       );
//       const oldFeeIds = oldFees.map((f: any) => f._id);

//       if (oldFeeIds.length > 0) {
//         const oldPayments = await Payment.find({
//           fees: { $in: oldFeeIds },
//         }).session(session);
//         const oldPaymentIds = oldPayments.map((p: any) => p._id);

//         if (oldPaymentIds.length > 0) {
//           await Receipt.deleteMany({
//             paymentId: { $in: oldPaymentIds },
//           }).session(session);
//           await Payment.deleteMany({ _id: { $in: oldPaymentIds } }).session(
//             session,
//           );
//         }

//         // Remove references from student
//         const studentCleanup = await Student.findById(
//           enrollment.student,
//         ).session(session);
//         if (studentCleanup) {
//           const oldFeeStrs = oldFeeIds.map(String);
//           const oldPayStrs = oldPaymentIds.map(String);
//           studentCleanup.fees = (studentCleanup.fees || []).filter(
//             (fid: any) => !oldFeeStrs.includes(String(fid)),
//           );
//           studentCleanup.payments = (studentCleanup.payments || []).filter(
//             (pid: any) => !oldPayStrs.includes(String(pid)),
//           );
//           await studentCleanup.save({ session });
//         }

//         await Fees.deleteMany({ enrollment: enrollment._id }).session(session);
//         console.log('Deleted', oldFeeIds.length, 'old fee docs');
//       }

//       // Resolve class name
//       let primaryClassName = '';
//       const rawClassId = Array.isArray(enrollment.className)
//         ? enrollment.className[0]
//         : enrollment.className;

//       if (rawClassId) {
//         try {
//           const classDoc = await Class.findById(rawClassId).session(session);
//           primaryClassName = classDoc?.className || String(rawClassId);
//         } catch {
//           primaryClassName = String(rawClassId);
//         }
//       }
//       console.log('Update primaryClassName:', primaryClassName);

//       const MONTHS = [
//         'January',
//         'February',
//         'March',
//         'April',
//         'May',
//         'June',
//         'July',
//         'August',
//         'September',
//         'October',
//         'November',
//         'December',
//       ];

//       // Build fee items list with proper range discount handling
//       const allFeeItems: any[] = [];
//       const totalPaidAmount = Number(payload.paidAmount) || 0;
//       let remainingPayment = totalPaidAmount;

//       for (const feeCategory of payload.fees) {
//         if (
//           feeCategory.feeItems &&
//           Array.isArray(feeCategory.feeItems) &&
//           feeCategory.feeItems.length > 0
//         ) {
//           for (const feeItem of feeCategory.feeItems) {
//             const feeTypeStr =
//               typeof feeItem.feeType === 'string'
//                 ? feeItem.feeType
//                 : feeItem.feeType?.value || feeItem.feeType?.label || '';

//             if (!feeTypeStr) continue;

//             const className =
//               feeCategory.className && feeCategory.className.length > 0
//                 ? feeCategory.className[0]?.label ||
//                   feeCategory.className[0] ||
//                   primaryClassName
//                 : primaryClassName;

//             if (feeItem.isMonthly) {
//               const amount = Number(feeItem.amount) || 0;
//               const discountRangeStart = feeItem.discountRangeStart || '';
//               const discountRangeEnd = feeItem.discountRangeEnd || '';
//               const discountRangeAmount =
//                 Number(feeItem.discountRangeAmount) || 0;
//               const flatDiscount = Number(feeItem.discount) || 0;

//               const startIndex = MONTHS.indexOf(discountRangeStart);
//               const endIndex = MONTHS.indexOf(discountRangeEnd);

//               const hasValidRange =
//                 discountRangeStart &&
//                 discountRangeEnd &&
//                 startIndex !== -1 &&
//                 endIndex !== -1;

//               for (let i = 0; i < 12; i++) {
//                 const month = MONTHS[i];
//                 const monthLabel = `Monthly Fee - ${month}`;

//                 let itemDiscount = flatDiscount;

//                 if (hasValidRange) {
//                   const minIdx = Math.min(startIndex, endIndex);
//                   const maxIdx = Math.max(startIndex, endIndex);

//                   if (i >= minIdx && i <= maxIdx) {
//                     itemDiscount = discountRangeAmount;
//                   }
//                 }

//                 allFeeItems.push({
//                   feeType: monthLabel,
//                   amount: amount,
//                   discount: itemDiscount,
//                   month: month,
//                   isMonthly: true,
//                   className: className,
//                   discountRangeStart: hasValidRange ? discountRangeStart : '',
//                   discountRangeEnd: hasValidRange ? discountRangeEnd : '',
//                   discountRangeAmount: hasValidRange ? discountRangeAmount : 0,
//                 });
//               }
//             } else {
//               const amount = Number(feeItem.amount) || 0;
//               const discount = Number(feeItem.discount) || 0;

//               allFeeItems.push({
//                 feeType: feeTypeStr,
//                 amount: amount,
//                 discount: discount,
//                 month: 'Admission',
//                 isMonthly: false,
//                 className: className,
//                 discountRangeStart: '',
//                 discountRangeEnd: '',
//                 discountRangeAmount: 0,
//               });
//             }
//           }
//         }
//       }

//       if (allFeeItems.length === 0) {
//         throw new Error(
//           'No fee items to update. Ensure fee categories are configured.',
//         );
//       }

//       // Sort fee items
//       allFeeItems.sort((a, b) => {
//         if (a.month === 'Admission') return -1;
//         if (b.month === 'Admission') return 1;
//         return MONTHS.indexOf(a.month) - MONTHS.indexOf(b.month);
//       });

//       console.log('Fee items to create:', allFeeItems.length);

//       // Create fee documents with payment distribution
//       const feeDocs: mongoose.Types.ObjectId[] = [];
//       const paidFeeIds: mongoose.Types.ObjectId[] = [];
//       let totalTransactionAmount = 0;
//       let calcTotalAmount = 0;
//       let calcTotalDiscount = 0;
//       let calcPaidAmount = 0;
//       let calcDueAmount = 0;

//       for (const item of allFeeItems) {
//         const netAmount = item.amount - item.discount;
//         calcTotalAmount += item.amount;
//         calcTotalDiscount += item.discount;

//         let paidForThisItem = 0;
//         if (remainingPayment > 0) {
//           paidForThisItem = Math.min(remainingPayment, netAmount);
//           remainingPayment -= paidForThisItem;
//         }

//         const dueAmount = Math.max(0, netAmount - paidForThisItem);
//         calcPaidAmount += paidForThisItem;
//         calcDueAmount += dueAmount;

//         const status =
//           dueAmount <= 0 ? 'paid' : paidForThisItem > 0 ? 'partial' : 'unpaid';

//         const feeData = {
//           enrollment: enrollment._id,
//           student: enrollment.student,
//           studentId: (enrollment as any).studentId || '',
//           feeType: item.feeType,
//           amount: item.amount,
//           discount: item.discount,
//           paidAmount: paidForThisItem,
//           dueAmount: dueAmount,
//           className: item.className,
//           month: item.month,
//           academicYear: payload.session || new Date().getFullYear().toString(),
//           paymentMethod: payload.paymentMethod || 'cash',
//           status: status,
//           ...(item.isMonthly && {
//             discountRangeStart: item.discountRangeStart || '',
//             discountRangeEnd: item.discountRangeEnd || '',
//             discountRangeAmount: item.discountRangeAmount || 0,
//           }),
//         };

//         const [createdFee] = await Fees.create([feeData], { session });
//         feeDocs.push(createdFee._id);

//         if (paidForThisItem > 0) {
//           totalTransactionAmount += paidForThisItem;
//           paidFeeIds.push(createdFee._id);
//         }
//       }

//       if (feeDocs.length === 0) {
//         throw new Error('No fee items were created - fee creation failed');
//       }

//       // Update enrollment totals
//       enrollment.fees = feeDocs;
//       enrollment.totalAmount = calcTotalAmount;
//       enrollment.paidAmount = calcPaidAmount;
//       enrollment.dueAmount = calcDueAmount;
//       enrollment.totalDiscount = calcTotalDiscount;
//       enrollment.paymentStatus =
//         calcDueAmount <= 0
//           ? 'paid'
//           : calcPaidAmount > 0
//             ? 'partial'
//             : 'pending';
//       await enrollment.save({ session });

//       // Link fees to student
//       const studentDoc = await Student.findById(enrollment.student).session(
//         session,
//       );
//       if (studentDoc) {
//         const existing = (studentDoc.fees || []).map(String);
//         const newIds = feeDocs.map(String);
//         const merged = Array.from(new Set([...existing, ...newIds]));
//         studentDoc.fees = merged.map((sid) => new mongoose.Types.ObjectId(sid));
//         await studentDoc.save({ session });
//       }

//       // Payment + receipt if money paid
//       if (totalTransactionAmount > 0 && paidFeeIds.length > 0) {
//         const timestamp = Date.now();
//         const random = Math.floor(Math.random() * 10000);
//         const receiptNo = `RCP-${timestamp}-${random}`;
//         const transactionId = `TXN-${timestamp}`;

//         const [payment] = await Payment.create(
//           [
//             {
//               student: enrollment.student,
//               enrollment: enrollment._id,
//               fees: paidFeeIds,
//               totalAmount: totalTransactionAmount,
//               paymentMethod: payload.paymentMethod || 'cash',
//               receiptNo,
//               transactionId,
//               status: 'completed',
//               collectedBy: payload.collectedBy || 'Admin',
//               paymentDate: new Date(),
//             },
//           ],
//           { session },
//         );

//         const detailedFees = await Fees.find({ _id: { $in: paidFeeIds } })
//           .session(session)
//           .lean();

//         const receiptFees = detailedFees.map((f: any) => {
//           const netAmount = Math.max(0, f.amount - (f.discount || 0));
//           let month = f.month || 'Admission';
//           if (f.feeType && f.feeType.includes(' - ')) {
//             const parts = f.feeType.split(' - ');
//             const last = parts[parts.length - 1];
//             if (MONTHS.includes(last)) month = last;
//           }
//           return {
//             feeType: f.feeType,
//             month,
//             originalAmount: f.amount,
//             discount: f.discount || 0,
//             waiver: 0,
//             netAmount,
//             paidAmount: f.paidAmount,
//           };
//         });

//         const totalDiscount = receiptFees.reduce((s, i) => s + i.discount, 0);
//         const subtotal = receiptFees.reduce((s, i) => s + i.originalAmount, 0);
//         const totalNet = receiptFees.reduce((s, i) => s + i.netAmount, 0);

//         const [receipt] = await Receipt.create(
//           [
//             {
//               receiptNo,
//               student: enrollment.student,
//               studentName: (enrollment as any).studentName || '',
//               studentId: (enrollment as any).studentId || '',
//               className: primaryClassName,
//               paymentId: payment._id,
//               totalAmount: totalTransactionAmount,
//               paymentMethod: payload.paymentMethod || 'cash',
//               paymentDate: new Date(),
//               collectedBy: payload.collectedBy || 'Admin',
//               transactionId,
//               fees: receiptFees,
//               summary: {
//                 totalItems: receiptFees.length,
//                 subtotal,
//                 totalDiscount,
//                 totalWaiver: 0,
//                 totalNetAmount: totalNet,
//                 amountPaid: totalTransactionAmount,
//               },
//               status: 'active',
//             },
//           ],
//           { session },
//         );

//         if (studentDoc) {
//           studentDoc.payments = [...(studentDoc.payments || []), payment._id];
//           studentDoc.receipts = [...(studentDoc.receipts || []), receipt._id];
//           await studentDoc.save({ session });
//         }

//         enrollment.payment = payment._id;
//         await enrollment.save({ session });
//       }
//     }

//     await session.commitTransaction();
//     session.endSession();
//     console.log('=== updateEnrollment SUCCESS ===');

//     const updatedEnrollment = await Enrollment.findById(id)
//       .populate({
//         path: 'student',
//         populate: [
//           { path: 'payments' },
//           { path: 'receipts' },
//           { path: 'fees' },
//         ],
//       })
//       .populate('className')
//       .populate('fees')
//       .lean();

//     return {
//       success: true,
//       message: 'Enrollment updated successfully',
//       data: updatedEnrollment,
//     };
//   } catch (error: any) {
//     if (session.inTransaction()) await session.abortTransaction();
//     session.endSession();
//     console.error('=== updateEnrollment ERROR ===');
//     console.error('Message :', error.message);
//     console.error('Stack   :', error.stack);
//     return {
//       success: false,
//       message: error.message || 'Internal Server Error',
//       error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
//     };
//   }
// };
