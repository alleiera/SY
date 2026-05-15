import { supabase } from '../supabase';

/**
 * Dimensions ekranı için veri erişim katmanı.
 * Bu ekran 5 farklı tabloyu yönetir (pvc_widths, coil_widths,
 * thicknesses, surfaces, material_types). Tablo adı tab ID'sinden türetilir.
 */

/** Tab ID → Supabase tablo adı eşlemesi */
const TAB_TABLE_MAP = {
    tab1: 'pvc_widths',
    tab2: 'coil_widths',
    tab3: 'thicknesses',
    tab4: 'surfaces',
    tab5: 'material_types',
};

/** Verilen tab ID için tablo adını döner */
export function getTableName(tabId) {
    return TAB_TABLE_MAP[tabId] || 'pvc_widths';
}

/**
 * Belirli bir tab'ın kayıtlarını getirir ve bileşen için normalize eder.
 * @param {string} tabId - 'tab1' | 'tab2' | 'tab3' | 'tab4' | 'tab5'
 */
export async function fetchDimensions(tabId) {
    const tableName = getTableName(tabId);
    const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .order('id', { ascending: true });
    if (error) throw error;

    return data.map(item => ({
        id: item.id,
        olcu: (tabId === 'tab4' || tabId === 'tab5') ? item.name : item.measured_value,
        malzemeGrubu: item.material_group || '',
        olcuBirimi: item.unit || '',
        olcuKodu: item.code,
        aciklama1: item.description_1,
        aciklama2: item.description_2,
        aciklama3: item.description_3,
    }));
}

/**
 * Kayıt ekler veya günceller.
 * @param {object} formData - Modal'dan gelen form verisi
 * @param {string} tabId    - Aktif tab ID'si
 * @param {number|null} id  - null → insert, number → update
 */
export async function saveDimension(formData, tabId, id = null) {
    const tableName = getTableName(tabId);

    const dbData = {
        code: formData.code,
        description_1: formData.description1,
        description_2: formData.description2,
        description_3: formData.description3,
    };

    if (tabId === 'tab4' || tabId === 'tab5') {
        dbData.name = formData.measuredValue;
        if (tabId === 'tab5') {
            dbData.material_group = formData.materialGroup;
        }
    } else {
        dbData.measured_value = formData.measuredValue;
        dbData.unit = formData.unit;
    }

    if (id === null) {
        const { error } = await supabase.from(tableName).insert([dbData]);
        if (error) throw error;
    } else {
        const { error } = await supabase.from(tableName).update(dbData).eq('id', id);
        if (error) throw error;
    }
}

/**
 * Belirtilen tab'ın tablosundan bir kaydı siler.
 * @param {number} id    - Silinecek kaydın ID'si
 * @param {string} tabId - Aktif tab ID'si
 */
export async function deleteDimension(id, tabId) {
    const tableName = getTableName(tabId);
    const { error } = await supabase.from(tableName).delete().eq('id', id);
    if (error) throw error;
}
