import { Staff } from './staff.model';

const findLastStaffNo = async () => {
  const lastStaffNo = await Staff.findOne(
    {},
    {
      staffId: 1,
    },
  )
    .sort({ createdAt: -1 })
    .lean();

  return lastStaffNo?.staffId ? lastStaffNo.staffId : undefined;
};

export const generateStaffId = async () => {
  const currentId = (await findLastStaffNo()) || '0000';
  const incrementId = (Number(currentId) + 1).toString().padStart(4, '0');
  return `${incrementId}`;
};

export const getStaffPopulations = (options: {
  withMeals?: boolean;
  withAll?: boolean;
  limit?: number;
  selectFields?: {
    mealAttendances?: string;
  };
} = {}) => {
  const populations = [];

  // If withAll is true, enable all populations
  const shouldPopulateMeals = options.withAll || options.withMeals;

  // Optional populations based on options
  if (shouldPopulateMeals) {
    populations.push({
      path: 'mealAttendances',
      select: options.selectFields?.mealAttendances || 'date mealType status breakfast lunch dinner totalMeals mealCost month academicYear',
      options: {
        sort: { date: -1 },
        limit: options.limit || 30
      }
    });
  }

  return populations;
};