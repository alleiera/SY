import { supabase } from '../supabase';

/** İş emri tablosunun adını makine tipine göre döner */
function getTableName(machineType) {
    if (machineType === 'extruder') return 'extruder_jobs';
    if (machineType === 'pattern') return 'pattern_jobs';
    if (machineType === 'cutting') return 'cutting_jobs';
    throw new Error('Geçersiz makine tipi: ' + machineType);
}

/**
 * Yeni bir iş emri ekler
 * @param {string} machineType - 'extruder', 'pattern', 'cutting'
 * @param {object} jobData - { machine_id, product_code, product_name, surface, thickness, coil_width, quantity, notes }
 */
export async function addJob(machineType, jobData) {
    const tableName = getTableName(machineType);
    
    // Geçerli en yüksek display_order değerini bul
    const { data: highestOrderJob } = await supabase
        .from(tableName)
        .select('display_order')
        .eq('machine_id', jobData.machine_id)
        .order('display_order', { ascending: false })
        .limit(1);
        
    const nextOrder = (highestOrderJob && highestOrderJob.length > 0) ? (highestOrderJob[0].display_order + 1) : 1;
    
    const { error } = await supabase.from(tableName).insert([{
        ...jobData,
        display_order: nextOrder
    }]);
    
    if (error) throw error;
}

/**
 * İş emirlerini getirir
 * @param {string} machineType - 'extruder', 'pattern', 'cutting'
 * @param {number|null} machineId - Sadece belirli bir makinenin işleri (opsiyonel)
 */
export async function fetchJobs(machineType, machineId = null) {
    const tableName = getTableName(machineType);
    let query = supabase.from(tableName).select('*').order('display_order', { ascending: true });
    
    if (machineId) {
        query = query.eq('machine_id', machineId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    
    // camelCase'e çevirerek dön
    return data.map(item => ({
        id: item.id,
        machineId: item.machine_id,
        productCode: item.product_code,
        productName: item.product_name,
        surface: item.surface,
        thickness: item.thickness,
        coilWidth: item.coil_width,
        quantity: item.quantity,
        notes: item.notes,
        status: item.status,
        displayOrder: item.display_order,
        createdAt: item.created_at
    }));
}

/**
 * İş emrini siler
 */
export async function deleteJob(machineType, jobId) {
    const tableName = getTableName(machineType);
    const { error } = await supabase.from(tableName).delete().eq('id', jobId);
    if (error) throw error;
}
