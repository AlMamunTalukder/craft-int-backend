export const CERTIFICATE_TYPES = [
  'testimonial',
  'character',
  'transfer',
  'hifz',
  'other',
] as const;

export const CERTIFICATE_TYPE_LABELS: Record<string, string> = {
  testimonial: 'Testimonial Certificate',
  character: 'Character Certificate',
  transfer: 'Transfer Certificate',
  hifz: 'Hifz Completion Certificate',
  other: 'Other Certificate',
};
