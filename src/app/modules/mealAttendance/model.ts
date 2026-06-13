// app/modules/mealAttendance/model.ts
import { model, Schema } from 'mongoose';
import { IMealAttendance } from './interface';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const mealAttendanceSchema = new Schema<IMealAttendance>(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    // ✅ 'January' format — সার্ভিস এর query এর সাথে সবসময় match করবে
    month: {
      type: String,
      required: true,
      enum: MONTH_NAMES,
    },
    academicYear: {
      type: String,
      required: true,
    },
    breakfast: {
      type: Boolean,
      default: false,
    },
    lunch: {
      type: Boolean,
      default: false,
    },
    dinner: {
      type: Boolean,
      default: false,
    },
    totalMeals: {
      type: Number,
      default: 0,
    },
    mealRate: {
      type: Number,
      required: true,
      default: 55,
    },
    mealCost: {
      type: Number,
      default: 0,
    },
    isHoliday: {
      type: Boolean,
      default: false,
    },
    isAbsent: {
      type: Boolean,
      default: false,
    },
    remarks: {
      type: String,
    },
    isFreeMeal: { type: Boolean, default: false },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

// ✅ Indexes
mealAttendanceSchema.index(
  { student: 1, date: 1, academicYear: 1 },
  { unique: true }  // একই student একই দিনে duplicate entry হবে না
);
mealAttendanceSchema.index({ month: 1, academicYear: 1 });
mealAttendanceSchema.index({ student: 1, month: 1, academicYear: 1 }); // ✅ service query তে লাগবে

// ✅ Auto-calculate totalMeals এবং mealCost — save এর আগে
mealAttendanceSchema.pre('save', function (next) {
  this.totalMeals = [this.breakfast, this.lunch, this.dinner].filter(Boolean).length;
  this.mealCost = this.totalMeals * this.mealRate;
  next();
});

// ✅ bulkWrite (updateOne upsert) এর জন্য — pre save কাজ করে না
// তাই cron এ manually calculate করতে হবে (নিচে দেখুন)

export const MealAttendance = model<IMealAttendance>('MealAttendance', mealAttendanceSchema);