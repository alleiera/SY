import { supabase } from '../supabase';

export async function fetchUserSettings(userId) {
    const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

    if (error) throw error;
    return data;
}

export async function saveUserSettings(userId, settings) {
    const { error } = await supabase.from('user_settings').upsert({
        user_id: userId,
        theme: settings.theme,
        row_height: settings.rowHeight,
        zebra_striping: settings.zebraStriping,
        show_grid_lines: settings.showGridLines,
        font_size: settings.fontSize,
        reduce_motion: settings.reduceMotion,
        updated_at: new Date(),
    });

    if (error) throw error;
}
