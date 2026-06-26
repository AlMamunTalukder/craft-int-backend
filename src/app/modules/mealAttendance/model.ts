<<<<<<< HEAD
import { model, Schema } from 'mongoose';
import { IMealAttendance } from './interface';
import { DEFAULT_BREAKFAST_RATE, DEFAULT_LUNCH_RATE, DEFAULT_DINNER_RATE } from './constants';

const mealAttendanceSchema = new Schema<IMealAttendance>(
  {
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

    personType: {
      type: String,
      enum: ['student', 'teacher', 'staff'],
      required: true,
      default: 'student',
    },

    date: {
      type: Date,
      required: true,
    },
    month: {
      type: String,
      required: true,
    },
    academicYear: {
      type: String,
      required: true,
    },

    breakfast: { type: Boolean, default: false },
    lunch: { type: Boolean, default: false },
    dinner: { type: Boolean, default: false },

    totalMeals: { type: Number, default: 0 },
    breakfastRate: { type: Number, default: DEFAULT_BREAKFAST_RATE },
    lunchRate: { type: Number, default: DEFAULT_LUNCH_RATE },
    dinnerRate: { type: Number, default: DEFAULT_DINNER_RATE },

    mealCost: { type: Number, default: 0 },
    grossCost: { type: Number, default: 0 },
    freeMealCostSaved: { type: Number, default: 0 },

    isFreeMeal: { type: Boolean, default: false },
    isHoliday: { type: Boolean, default: false },
    isAbsent: { type: Boolean, default: false },

    remarks: { type: String },

    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

// ─── Indexes ───
mealAttendanceSchema.index(
  { student: 1, date: 1, academicYear: 1 },
  // { unique: true, sparse: true },
);
mealAttendanceSchema.index(
  { teacher: 1, date: 1, academicYear: 1 },
  // { unique: true, sparse: true },
);
mealAttendanceSchema.index(
  { staff: 1, date: 1, academicYear: 1 },
  // { unique: true, sparse: true },
);
mealAttendanceSchema.index({ month: 1, academicYear: 1 });
mealAttendanceSchema.index({ personType: 1, month: 1, academicYear: 1 });

// NOTE: No pre('save') hook here.
// All cost calculations (totalMeals, mealCost, grossCost, freeMealCostSaved)
// are done explicitly in the service layer via calculateMealStats().
// bulkWrite() does NOT trigger pre('save'), so the hook was never running anyway.

=======
import { model, Schema } from 'mongoose';
import { IMealAttendance } from './interface';
import { DEFAULT_BREAKFAST_RATE, DEFAULT_LUNCH_RATE, DEFAULT_DINNER_RATE } from './constants';

const mealAttendanceSchema = new Schema<IMealAttendance>(
  {
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


    personType: {
      type: String,
      enum: ['student', 'teacher', 'staff'],
      required: true,
      default: 'student',
    },

    date: {
      type: Date,
      required: true,
    },
    month: {
      type: String,
      required: true,

    },
    academicYear: {
      type: String,
      required: true,
    },

    breakfast: { type: Boolean, default: false },
    lunch: { type: Boolean, default: false },
    dinner: { type: Boolean, default: false },


    totalMeals: { type: Number, default: 0 },
    breakfastRate: { type: Number, default: DEFAULT_BREAKFAST_RATE },
    lunchRate: { type: Number, default: DEFAULT_LUNCH_RATE },
    dinnerRate: { type: Number, default: DEFAULT_DINNER_RATE },

    mealCost: { type: Number, default: 0 },

    grossCost: { type: Number, default: 0 },

    freeMealCostSaved: { type: Number, default: 0 },

    isFreeMeal: { type: Boolean, default: false },
    isHoliday: { type: Boolean, default: false },
    isAbsent: { type: Boolean, default: false },

    remarks: { type: String },

    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

// ─── Indexes ───

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
mealAttendanceSchema.pre('save', function (next) {
  this.totalMeals = [this.breakfast, this.lunch, this.dinner].filter(Boolean).length;

  const rawCost =
    (this.breakfast ? this.breakfastRate : 0) +
    (this.lunch ? this.lunchRate : 0) +
    (this.dinner ? this.dinnerRate : 0);

  this.grossCost = rawCost;

  this.mealCost = this.isFreeMeal ? 0 : rawCost;

  this.freeMealCostSaved = this.isFreeMeal ? rawCost : 0;

  next();
});

>>>>>>> 84d34149f1ac58cdcfb6e9387a96f9a45d43ab7a
export const MealAttendance = model<IMealAttendance>('MealAttendance', mealAttendanceSchema);