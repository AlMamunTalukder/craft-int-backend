export type TAssetCategory =
  | 'electronics'
  | 'furniture'
  | 'books'
  | 'stationery'
  | 'appliance'
  | 'vehicle'
  | 'infrastructure'
  | 'other';

export type TAssetCondition =
  | 'new'
  | 'good'
  | 'fair'
  | 'poor'
  | 'damaged'
  | 'disposed';

export interface IAsset {
  name: string;
  category: TAssetCategory;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  purchaseDate?: Date;
  vendor?: string;
  location?: string;
  condition: TAssetCondition;
  warrantyTill?: Date;
  note?: string;
}
