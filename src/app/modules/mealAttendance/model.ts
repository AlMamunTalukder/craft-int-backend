
import { model, Schema } from 'mongoose';
import { IMealAttendance } from './interface';
import { DEFAULT_BREAKFAST_RATE, DEFAULT_LUNCH_RATE, DEFAULT_DINNER_RATE } from './constants';

const mealAttendanceSchema = new Schema<IMealAttendance>(
  {
    // ─── Person refs (only one populated depending on personType) ───
    student: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      default: null,
    },
    teacher: {
      type: Schema.Types.ObjectId,
      ref: 'Teacher',
      default: null,
    },
    staff: {
      type: Schema.Types.ObjectId,
      ref: 'Staff',
      default: null,
    },

    // ─── Discriminator ───
    personType: {
      type: String,
      enum: ['student', 'teacher', 'staff'],
      required: true,
      default: 'student',
    },

    // ─── Date / period ───
    date: {
      type: Date,
      required: true,
    },
    month: {
      type: String,
      required: true,
      // 'YYYY-MM' format e.g. '2025-06'
    },
    academicYear: {
      type: String,
      required: true,
    },

    // ─── Meal flags ───
    breakfast: { type: Boolean, default: false },
    lunch: { type: Boolean, default: false },
    dinner: { type: Boolean, default: false },

    // ─── Computed ───
    totalMeals: { type: Number, default: 0 },

    // ─── Per-meal rates (custom or default) ───
    breakfastRate: { type: Number, default: DEFAULT_BREAKFAST_RATE },
    lunchRate: { type: Number, default: DEFAULT_LUNCH_RATE },
    dinnerRate: { type: Number, default: DEFAULT_DINNER_RATE },

    mealCost: { type: Number, default: 0 },

    // ─── Status flags ───
    isFreeMeal: { type: Boolean, default: false },
    isHoliday: { type: Boolean, default: false },
    isAbsent: { type: Boolean, default: false },

    remarks: { type: String },

    // ─── Audit ───
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

// ─── Indexes ───
// Unique per person per date per academicYear (one record each)
mealAttendanceSchema.index(
  { student: 1, date: 1, academicYear: 1 },
  { unique: true, sparse: true },
);
mealAttendanceSchema.index(
  { teacher: 1, date: 1, academicYear: 1 },
  { unique: true, sparse: true },
);
mealAttendanceSchema.index(
  { staff: 1, date: 1, academicYear: 1 },
  { unique: true, sparse: true },
);

mealAttendanceSchema.index({ month: 1, academicYear: 1 });
mealAttendanceSchema.index({ personType: 1, month: 1, academicYear: 1 });

// ─── Pre-save: auto-calculate totals using per-meal rates ───
mealAttendanceSchema.pre('save', function (next) {
  this.totalMeals = [this.breakfast, this.lunch, this.dinner].filter(Boolean).length;

  const rawCost =
    (this.breakfast ? this.breakfastRate : 0) +
    (this.lunch ? this.lunchRate : 0) +
    (this.dinner ? this.dinnerRate : 0);

  this.mealCost = this.isFreeMeal ? 0 : rawCost;
  next();
});

export const MealAttendance = model<IMealAttendance>('MealAttendance', mealAttendanceSchema);