import { supabase } from '../supabase';
import type { CategoryMapping, CodeTemplate } from '../store/codeStore';

const DEFAULT_CATEGORY_MAPPING: Record<string, CategoryMapping> = {
  raw: { sku: '', desc: '' },
  semi: { sku: '', desc: '' },
  final: { sku: '', desc: '' },
};

export async function fetchCodeTemplateData() {
  const [templateResponse, mappingResponse] = await Promise.all([
    supabase.from('code_templates').select('*').order('created_at', { ascending: true }),
    supabase.from('category_mappings').select('*'),
  ]);

  if (templateResponse.error) throw templateResponse.error;
  if (mappingResponse.error) throw mappingResponse.error;

  const templates: CodeTemplate[] = (templateResponse.data || []).map((template) => ({
    id: template.id,
    name: template.name,
    type: template.type as CodeTemplate['type'],
    segments: template.segments,
  }));

  const categoryMapping: Record<string, CategoryMapping> = { ...DEFAULT_CATEGORY_MAPPING };
  (mappingResponse.data || []).forEach((mapping) => {
    if (mapping.category_id && categoryMapping[mapping.category_id]) {
      categoryMapping[mapping.category_id] = {
        sku: mapping.sku_template_id || '',
        desc: mapping.desc_template_id || '',
      };
    }
  });

  return { templates, categoryMapping };
}

export async function createCodeTemplate(template: CodeTemplate) {
  const { error } = await supabase.from('code_templates').insert([{
    id: template.id,
    name: template.name,
    type: template.type,
    segments: template.segments,
  }]);

  if (error) throw error;
}

export async function updateCodeTemplate(template: CodeTemplate) {
  const { error } = await supabase
    .from('code_templates')
    .update({
      name: template.name,
      type: template.type,
      segments: template.segments,
    })
    .eq('id', template.id);

  if (error) throw error;
}

export async function deleteCodeTemplate(id: string) {
  const { error } = await supabase.from('code_templates').delete().eq('id', id);
  if (error) throw error;
}

export async function saveCategoryMappings(mapping: Record<string, CategoryMapping>) {
  const updates = Object.keys(mapping).map((categoryId) => ({
    category_id: categoryId,
    sku_template_id: mapping[categoryId].sku || null,
    desc_template_id: mapping[categoryId].desc || null,
  }));

  const { error } = await supabase
    .from('category_mappings')
    .upsert(updates, { onConflict: 'category_id' });

  if (error) throw error;
}
