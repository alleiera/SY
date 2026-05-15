import { supabase } from '../supabase';

export const loadLatestWorkspace = async () => {
    try {
        const { data, error } = await supabase
            .from('saved_recipes')
            .select('id, nodes, edges')
            .order('updated_at', { ascending: false })
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Error loading latest workspace:', error);
        return { data: null, error };
    }
};

export const updateWorkspace = async (workspaceId, nodes, edges) => {
    try {
        const { data, error } = await supabase
            .from('saved_recipes')
            .update({ nodes, edges, updated_at: new Date().toISOString() })
            .eq('id', workspaceId)
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Error updating workspace:', error);
        return { data: null, error };
    }
};

export const createWorkspace = async (name, nodes, edges) => {
    try {
        const { data, error } = await supabase
            .from('saved_recipes')
            .insert([{ name, nodes, edges }])
            .select('id')
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Error creating workspace:', error);
        return { data: null, error };
    }
};
