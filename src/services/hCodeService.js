import { supabase } from '../supabase';

/**
 * H Kodları (h_codes tablosu) için veri erişim katmanı.
 */

function toCamel(item) {
    return {
        id: item.id,
        baseColor: item.base_color,
        code: item.code,
        description: item.description,
    };
}

function toSnake(formData) {
    return {
        base_color: formData.baseColor,
        code: formData.code,
        description: formData.description,
    };
}

/** Tüm H kodlarını ID'ye göre artan sırada getirir */
export async function fetchHCodes() {
    const { data, error } = await supabase
        .from('h_codes')
        .select('*')
        .order('id', { ascending: true });
    if (error) throw error;
    return data.map(toCamel);
}

/**
 * H kodu ekler veya günceller.
 * @param {object} formData - camelCase form verisi
 * @param {number|null} id  - null → insert, number → update
 */
export async function saveHCode(formData, id = null) {
    const dbData = toSnake(formData);
    if (id === null) {
        const { error } = await supabase.from('h_codes').insert([dbData]);
        if (error) throw error;
    } else {
        const { error } = await supabase.from('h_codes').update(dbData).eq('id', id);
        if (error) throw error;
    }
}

/** Belirtilen ID'ye sahip H kodunu siler */
export async function deleteHCode(id) {
    const { error } = await supabase.from('h_codes').delete().eq('id', id);
    if (error) throw error;
}
