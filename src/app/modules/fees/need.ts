// import { model, Schema } from 'mongoose';
// import { IFees } from './interface';

// const feeSchema = new Schema<IFees>(
//   {
//     enrollment: {
//       type: Schema.Types.ObjectId,
//       ref: 'Enrollment',
//       required: true,
//     },
//     title: { type: String, required: true },
//     feeType: {
//       type: String,
//       enum: [
//         'admission',
//         'monthly',
//         'exam',
//         'transport',
//         'library',
//         'hostel',
//         'other',
//       ],
//       required: true,
//     },
//     amount: { type: Number, required: true },
//     dueDate: { type: Date },
//     status: {
//       type: String,
//       enum: ['unpaid', 'partial', 'paid'],
//       default: 'unpaid',
//     },
//     payments: [
//       {
//         type: Schema.Types.ObjectId,
//         ref: 'Payment',
//       },
//     ],
//   },
//   { timestamps: true },
// );

// export const Fees = model<IFees>('Fees', feeSchema);
