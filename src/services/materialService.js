import { supabase } from '../supabase';

/**
 * Materials tablosu için veri erişim katmanı.
 * snake_case ↔ camelCase dönüşümleri ve kod mükerreriyet kontrolü burada.
 */

function toCamel(item) {
    return {
        id: item.id,
        type: item.type,
        code: item.code,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        description1: item.description1,
        description2: item.description2,
        description3: item.description3,
        brand: item.brand,
        brandCode: item.brand_code,
    };
}

function toSnake(formData) {
    return {
        type: formData.type,
        code: formData.code?.trim(),
        name: formData.name,
        unit: formData.unit,
        brand: formData.brand,
        brand_code: formData.brandCode,
        description1: formData.description1,
        description2: formData.description2,
        description3: formData.description3,
    };
}

/** Tüm malzemeleri ID'ye göre artan sırada getirir */
export async function fetchMaterials() {
    const { data, error } = await supabase
        .from('materials')
        .select('*')
        .order('id', { ascending: true });

    if (error) {
        if (error.code === '42P01') return [];
        throw error;
    }
    return data.map(toCamel);
}

/** Filtreli malzemeleri getirir */
export async function fetchMaterialsFiltered(allowedTypes = []) {
    let query = supabase.from('materials').select('*').order('code', { ascending: true });

    if (allowedTypes.length > 0) {
        const { data: typeRows } = await supabase
            .from('material_types')
            .select('code')
            .in('material_group', allowedTypes);
        const codes = [...new Set((typeRows || []).map(t => t.code))];
        
        if (codes.length > 0) {
            query = query.in('type', codes);
        } else {
            return [];
        }
    }

    const { data: rows, error } = await query;
    if (error) throw error;
    return rows.map(toCamel);
}

/** Malzeme türlerini getirir */
export async function fetchMaterialTypes() {
    const { data, error } = await supabase
        .from('material_types')
        .select('name, code, material_group')
        .order('name', { ascending: true });
        
    if (error) {
        if (error.code === '42P01') return [];
        throw error;
    }
    return data;
}

/**
 * Malzeme kodunun başka bir kayıtta kullanılıp kullanılmadığını kontrol eder.
 * @param {string} code - Kontrol edilecek kod
 * @param {number|null} excludeId - Güncelleme modunda mevcut kaydın ID'si
 * @returns {boolean} true → kod zaten kayıtlı
 */
export async function isMaterialCodeDuplicate(code, excludeId = null) {
    let query = supabase.from('materials').select('id').eq('code', code.trim());
    if (excludeId !== null) query = query.neq('id', excludeId);
    const { data, error } = await query.limit(1);
    if (error) throw error;
    return data && data.length > 0;
}

/**
 * Malzeme ekler veya günceller.
 * @param {object} formData - camelCase form verisi
 * @param {number|null} id  - null → insert, number → update
 */
export async function saveMaterial(formData, id = null) {
    const dbData = toSnake(formData);
    if (id === null) {
        const { error } = await supabase.from('materials').insert([dbData]);
        if (error) throw error;
    } else {
        const { error } = await supabase.from('materials').update(dbData).eq('id', id);
        if (error) throw error;
    }
}

/** Belirtilen ID'ye sahip malzemeyi siler */
export async function deleteMaterial(id) {
    const { error } = await supabase.from('materials').delete().eq('id', id);
    if (error) throw error;
}
