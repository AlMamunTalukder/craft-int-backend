// import mongoose from 'mongoose';
// import { IFeeAdjustment } from './interface';

// export const buildFeeAdjustmentPayload = (
//   raw: Partial<IFeeAdjustment>,
// ): IFeeAdjustment => {
//   return {
//     student: new mongoose.Types.ObjectId(raw.student!),
//     fee: new mongoose.Types.ObjectId(raw.fee!),
//     enrollment: new mongoose.Types.ObjectId(raw.enrollment!),

//     type: raw.type!,
//     adjustmentType: raw.adjustmentType!,
//     value: raw.value!,

//     reason: raw.reason ?? '',

//     approvedBy: raw.approvedBy,

//     approvedDate: raw.approvedDate,

//     startMonth: raw.startMonth!,
//     endMonth: raw.endMonth,

//     isActive: raw.isActive ?? true,
//     isRecurring: raw.isRecurring ?? false,

//     academicYear: raw.academicYear!,

//     createdAt: new Date(),
//     updatedAt: new Date(),
//   };
// };
