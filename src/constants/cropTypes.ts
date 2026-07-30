/**
 * Crop types – only "Mandi" and "Sabzi Mandi".
 * Use everywhere for dropdowns, filters, and display.
 */
export const CROP_TYPE_MANDI = 'Mandi';
export const CROP_TYPE_SABZI_MANDI = 'Sabzi Mandi';

export const CROP_TYPES = [CROP_TYPE_MANDI, CROP_TYPE_SABZI_MANDI] as const;
export type CropType = (typeof CROP_TYPES)[number];

/** Options for filter dropdowns (includes "All Types") */
export const CROP_TYPE_OPTIONS = [
    { value: '', label: 'All Types' },
    { value: CROP_TYPE_MANDI, label: CROP_TYPE_MANDI },
    { value: CROP_TYPE_SABZI_MANDI, label: CROP_TYPE_SABZI_MANDI },
];

/** Options for add/edit crop (no "All") */
export const CROP_TYPE_SELECT_OPTIONS = [
    { value: CROP_TYPE_MANDI, label: CROP_TYPE_MANDI },
    { value: CROP_TYPE_SABZI_MANDI, label: CROP_TYPE_SABZI_MANDI },
];

/** Normalize cropType for display/filter: 0/"0" -> Mandi, 1/"1" -> Sabzi Mandi */
export function normalizeCropType(cropType: string | number | undefined): string {
    if (cropType == null || cropType === '') return '';
    const s = String(cropType).toLowerCase().trim();
    if (s === '1' || s.includes('sabzi')) return CROP_TYPE_SABZI_MANDI;
    if (s === '0' || s === 'mandi') return CROP_TYPE_MANDI;
    return String(cropType).trim();
}
