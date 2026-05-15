import { supabase } from '../supabase';

/**
 * MachineManagement (production_machines tablosu) için veri erişim katmanı.
 * Tüm Supabase çağrıları, hata yönetimi ve sıralama mantığı burada toplanmıştır.
 */

/** Tüm makineleri display_order'a göre çeker */
export async function fetchMachines() {
    const { data, error } = await supabase
        .from('production_machines')
        .select('*')
        .order('display_order', { ascending: true });
    if (error) throw error;
    return data || [];
}

/** Belirli bir makine tipindeki kayıtları display_order'a göre çeker */
export async function fetchMachinesByType(type) {
    const { data, error } = await supabase
        .from('production_machines')
        .select('*')
        .eq('type', type)
        .order('display_order', { ascending: true });
    if (error) throw error;
    return data || [];
}

/**
 * Belirtilen tipe yeni makine ekler.
 * @param {object} form        - { name, location }
 * @param {string} type        - 'extruder' | 'pattern' | 'cutting'
 * @param {number} currentCount - O tipteki mevcut makine sayısı (sıralama için)
 */
export async function addMachine(form, type, currentCount) {
    const { error } = await supabase.from('production_machines').insert([{
        name: form.name,
        type,
        location: form.location,
        product_groups: form.product_groups || [],
        display_order: currentCount + 1,
    }]);
    if (error) throw error;
}

/** Makinenin name, type ve location alanlarını günceller */
export async function updateMachine(id, form) {
    const { error } = await supabase
        .from('production_machines')
        .update({ 
            name: form.name, 
            type: form.type, 
            location: form.location,
            product_groups: form.product_groups || []
        })
        .eq('id', id);
    if (error) throw error;
}

/** Belirtilen ID'li makineyi siler */
export async function deleteMachine(id) {
    const { error } = await supabase
        .from('production_machines')
        .delete()
        .eq('id', id);
    if (error) throw error;
}

/**
 * İki makinenin display_order değerlerini takas eder.
 * Supabase'in native transaction desteği olmadığı için her iki update
 * Promise.all ile eş zamanlı gönderilir. Herhangi biri başarısız olursa
 * çağıran taraf fetchMachines() ile DB'den geri yükler.
 *
 * @param {{ id: number, display_order: number }} cur
 * @param {{ id: number, display_order: number }} neighbor
 */
export async function swapMachineOrder(cur, neighbor) {
    const [res1, res2] = await Promise.all([
        supabase.from('production_machines')
            .update({ display_order: neighbor.display_order })
            .eq('id', cur.id),
        supabase.from('production_machines')
            .update({ display_order: cur.display_order })
            .eq('id', neighbor.id),
    ]);
    if (res1.error) throw res1.error;
    if (res2.error) throw res2.error;
}
