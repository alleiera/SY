export const formatNumberTR = (val: any): string => {
    if (val === null || val === undefined || val === '') return '';
    if (typeof val === 'string' && val.includes(',')) return val;
    const num = Number(val);
    if (isNaN(num)) return String(val);
    return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 20 }).format(num);
};

export const parseNumberTR = (val: string): number | null => {
    if (!val) return null;
    const cleanVal = String(val).replace(/\./g, '').replace(',', '.');
    const floatVal = parseFloat(cleanVal);
    return isNaN(floatVal) ? null : floatVal;
};

export const formatForEditing = (val: any): string => {
    if (val === null || val === undefined || val === '') return '';
    return String(val).replace('.', ',');
};
