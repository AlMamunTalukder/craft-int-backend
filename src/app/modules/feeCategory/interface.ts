export type FeeCategoryName =
  | ''
  | 'Residential'
  | 'Non-Residential'
  | 'Day Care'
  | 'Non-Residential One Meal'
  | 'Day Care One Meal';

export type FeeType =
  | 'Monthly Fee'
  | 'Tuition Fee'
  | 'Meal Fee'
  | 'Seat Rent'
  | 'Day Care Fee'
  | 'One Meal'
  | 'Exam Fee'
  | 'Admission Fee';

export interface IFeeItem {
  feeType: FeeType;
  amount: number;
}

export interface IFeeCategory {
  categoryName: FeeCategoryName;
  className: string;
  feeItems: IFeeItem[];
  createdAt?: Date;
  updatedAt?: Date;
}
