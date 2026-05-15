import { supabase } from '../../supabase';
import { NodeAttribute, NodeTypeConfig } from './store';

export const fetchNodeTypeReferenceData = async (): Promise<NodeTypeConfig[]> => {
    const [nodeTypesRes, attributesRes] = await Promise.all([
        supabase.from('node_types').select('*').order('created_at', { ascending: true }),
        supabase.from('node_attributes').select('*').order('display_order', { ascending: true })
    ]);

    if (nodeTypesRes.error) throw nodeTypesRes.error;
    if (attributesRes.error) throw attributesRes.error;

    return (nodeTypesRes.data || []).map((nodeType) => ({
        ...nodeType,
        attributes: (attributesRes.data || []).filter((attr) => attr.node_type_id === nodeType.id)
    }));
};

export const saveNodeTypeReference = async (typeConfig: Partial<NodeTypeConfig>) => {
    const isNew = !typeConfig.id || typeConfig.id === 'new';
    const payload = {
        code_key: typeConfig.code_key,
        label: typeConfig.label,
        description: typeConfig.description || '',
        color_classes: typeConfig.color_classes || 'bg-slate-50 border-slate-400 text-slate-900',
        icon_name: typeConfig.icon_name || 'Box',
        icon_color_classes: typeConfig.icon_color_classes || 'text-slate-600',
        port_in: typeConfig.port_in ?? true,
        port_out: typeConfig.port_out ?? true,
        has_consumption: typeConfig.has_consumption ?? false,
        has_code_templates: typeConfig.has_code_templates ?? false,
        dynamic_ports_table: typeConfig.dynamic_ports_table || null,
        material_type_filters: typeConfig.material_type_filters || [],
        product_group: typeConfig.product_group || null
    };

    if (isNew) {
        const { error } = await supabase.from('node_types').insert([payload]);
        if (error) throw error;
        return;
    }

    const { error } = await supabase.from('node_types').update(payload).eq('id', typeConfig.id);
    if (error) throw error;
};

export const deleteNodeTypeReference = async (id: string) => {
    const { error } = await supabase.from('node_types').delete().eq('id', id);
    if (error) throw error;
};

export const saveNodeAttributeReference = async (attr: Partial<NodeAttribute>) => {
    const isNew = !attr.id || attr.id.startsWith('new-');
    const payload = {
        node_type_id: attr.node_type_id,
        field_key: attr.field_key,
        label: attr.label,
        field_type: attr.field_type || 'text',
        options: attr.options || null,
        is_required: attr.is_required || false,
        display_order: attr.display_order || 0
    };

    if (isNew) {
        const { error } = await supabase.from('node_attributes').insert([payload]);
        if (error) throw error;
        return;
    }

    const { error } = await supabase.from('node_attributes').update(payload).eq('id', attr.id);
    if (error) throw error;
};

export const deleteNodeAttributeReference = async (id: string) => {
    const { error } = await supabase.from('node_attributes').delete().eq('id', id);
    if (error) throw error;
};
