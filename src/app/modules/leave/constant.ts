export const LEAVE_TYPES = [
  'casual',
  'sick',
  'annual',
  'maternity',
  'paternity',
  'unpaid',
  'other',
] as const;

export const LEAVE_TYPE_LABELS: Record<string, string> = {
  casual: 'Casual Leave',
  sick: 'Sick Leave',
  annual: 'Annual Leave',
  maternity: 'Maternity Leave',
  paternity: 'Paternity Leave',
  unpaid: 'Unpaid Leave',
  other: 'Other',
};
