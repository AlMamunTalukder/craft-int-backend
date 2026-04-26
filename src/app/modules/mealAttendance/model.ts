import { model, Schema } from 'mongoose';
import { IMealAttendance } from './interface';

const mealAttendanceSchema = new Schema<IMealAttendance>(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },
    date: {
      type: Date,
      required: true
    },
    month: {
      type: String,
      required: true
    },
    academicYear: {
      type: String,
      required: true
    },
    breakfast: {
      type: Boolean,
      default: false
    },
    lunch: {
      type: Boolean,
      default: false
    },
    dinner: {
      type: Boolean,
      default: false
    },
    totalMeals: {
      type: Number,
      default: 0
    },
    mealRate: {
      type: Number,
      required: true,
      default: 55
    },
    mealCost: {
      type: Number,
      default: 0
    },
    isHoliday: {
      type: Boolean,
      default: false
    },
    isAbsent: {
      type: Boolean,
      default: false
    },
    remarks: {
      type: String
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
  },
  { timestamps: true }
);


mealAttendanceSchema.index(
  { student: 1, date: 1, academicYear: 1 },
  { unique: true }
);
mealAttendanceSchema.index({ month: 1, academicYear: 1 });
mealAttendanceSchema.index({ student: 1, month: 1 });

mealAttendanceSchema.pre('save', function (next) {
  this.totalMeals = [this.breakfast, this.lunch, this.dinner].filter(Boolean).length;
  this.mealCost = this.totalMeals * this.mealRate;
  next();
});

export const MealAttendance = model<IMealAttendance>('MealAttendance', mealAttendanceSchema);