import { supabase } from '../supabase';

/**
 * Products tablosu için veri erişim katmanı.
 * Supabase API çağrıları ve snake_case ↔ camelCase dönüşümleri
 * tek yerde toplanmıştır. Bileşenler bu servisden çağrı yapar;
 * doğrudan Supabase'e bağlanmaz.
 */

/** DB'den gelen snake_case kaydı bileşenlerin kullandığı camelCase'e çevirir */
function toCamel(item) {
    return {
        id: item.id,
        code: item.code,
        productName: item.product_name,
        surface: item.surface,
        group: item.product_group,
        hCode: item.h_code,
        brand: item.brand,
        brandCode: item.brand_code,
        description1: item.description1,
        description2: item.description2,
        description3: item.description3,
        specialCode1: item.special_code1,
        specialCode2: item.special_code2,
        specialCode3: item.special_code3,
        specialCode4: item.special_code4,
        specialCode5: item.special_code5,
    };
}

/** Bileşenden gelen camelCase formu DB'nin beklediği snake_case'e çevirir */
function toSnake(formData) {
    return {
        code: formData.code,
        product_name: formData.productName,
        surface: formData.surface,
        product_group: formData.group,
        h_code: formData.hCode,
        brand: formData.brand,
        brand_code: formData.brandCode,
        description1: formData.description1,
        description2: formData.description2,
        description3: formData.description3,
        special_code1: formData.specialCode1,
        special_code2: formData.specialCode2,
        special_code3: formData.specialCode3,
        special_code4: formData.specialCode4,
        special_code5: formData.specialCode5,
    };
}

/** Tüm ürünleri ID'ye göre artan sırada getirir */
export async function fetchProducts() {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('id', { ascending: true });
    if (error) throw error;
    return data.map(toCamel);
}

/**
 * Ürün ekler veya günceller.
 * @param {object} formData - camelCase form verisi
 * @param {number|null} id  - null → insert, number → update
 */
export async function saveProduct(formData, id = null) {
    const dbData = toSnake(formData);
    if (id === null) {
        const { error } = await supabase.from('products').insert([dbData]);
        if (error) throw error;
    } else {
        const { error } = await supabase.from('products').update(dbData).eq('id', id);
        if (error) throw error;
    }
}

/** Belirtilen ID'ye sahip ürünü siler */
export async function deleteProduct(id) {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
}
