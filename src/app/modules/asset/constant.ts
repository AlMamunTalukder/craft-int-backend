export const ASSET_CATEGORIES = [
  'electronics',
  'furniture',
  'books',
  'stationery',
  'appliance',
  'vehicle',
  'infrastructure',
  'other',
] as const;

export const ASSET_CONDITIONS = [
  'new',
  'good',
  'fair',
  'poor',
  'damaged',
  'disposed',
] as const;

export const ASSET_CATEGORY_LABELS: Record<string, string> = {
  electronics: 'Electronics',
  furniture: 'Furniture',
  books: 'Books',
  stationery: 'Stationery',
  appliance: 'Appliance',
  vehicle: 'Vehicle',
  infrastructure: 'Infrastructure',
  other: 'Other',
};
