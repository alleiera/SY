import { create } from 'zustand';
import {
    createCodeTemplate,
    deleteCodeTemplate,
    fetchCodeTemplateData,
    saveCategoryMappings,
    updateCodeTemplate,
} from '../services/codeTemplateService';

export type TemplateSegment = {
    key: string;
    nextSep: string;
    customValue: string;
};

export type CodeTemplate = {
    id: string;
    name: string;
    type: 'SKU' | 'DESC';
    segments: TemplateSegment[];
};

export type CategoryMapping = {
    sku: string;
    desc: string;
};

export type CodeStoreState = {
    templates: CodeTemplate[];
    categoryMapping: Record<string, CategoryMapping>;
    loading: boolean;
    feedback: { type: 'success' | 'error'; message: string } | null;
    initializeStore: () => Promise<void>;
    setTemplates: (templates: CodeTemplate[]) => void;
    addTemplate: (template: CodeTemplate) => Promise<void>;
    updateTemplate: (template: CodeTemplate) => Promise<void>;
    deleteTemplate: (id: string) => Promise<void>;
    setCategoryMapping: (mapping: Record<string, CategoryMapping>) => Promise<void>;
    clearFeedback: () => void;
};

export const useCodeStore = create<CodeStoreState>((set) => ({
    templates: [],
    categoryMapping: {
        raw: { sku: '', desc: '' },
        semi: { sku: '', desc: '' },
        final: { sku: '', desc: '' }
    },
    loading: false,
    feedback: null,
    clearFeedback: () => set({ feedback: null }),

    initializeStore: async () => {
        set({ loading: true, feedback: null });
        try {
            const { templates, categoryMapping } = await fetchCodeTemplateData();
            set({ templates, categoryMapping });
        } catch (error) {
            console.error('Error initializing code store:', error);
            set({ feedback: { type: 'error', message: 'Sablon verileri yuklenirken bir hata olustu.' } });
        } finally {
            set({ loading: false });
        }
    },

    setTemplates: (templates) => set({ templates }),
    
    addTemplate: async (template) => {
        try {
            await createCodeTemplate(template);
            set((state) => ({
                templates: [...state.templates, template],
                feedback: { type: 'success', message: `"${template.name}" sablonu kaydedildi.` }
            }));
        } catch (error) {
            console.error('Error adding template:', error);
            set({ feedback: { type: 'error', message: 'Yeni sablon kaydedilemedi.' } });
        }
    },
    
    updateTemplate: async (template) => {
        try {
            await updateCodeTemplate(template);
            set((state) => ({
                templates: state.templates.map(t => t.id === template.id ? template : t),
                feedback: { type: 'success', message: `"${template.name}" sablonu guncellendi.` }
            }));
        } catch (error) {
            console.error('Error updating template:', error);
            set({ feedback: { type: 'error', message: 'Sablon guncellenemedi.' } });
        }
    },
    
    deleteTemplate: async (id) => {
        try {
            await deleteCodeTemplate(id);
            set((state) => ({
                templates: state.templates.filter(t => t.id !== id),
                feedback: { type: 'success', message: 'Sablon silindi.' }
            }));
        } catch (error) {
            console.error('Error deleting template:', error);
            set({ feedback: { type: 'error', message: 'Sablon silinemedi.' } });
        }
    },
    
    setCategoryMapping: async (mapping) => {
        try {
            await saveCategoryMappings(mapping);
            set({
                categoryMapping: mapping,
                feedback: { type: 'success', message: 'Kategori baglantilari guncellendi.' }
            });
        } catch (error) {
            console.error('Error updating mapping:', error);
            set({ feedback: { type: 'error', message: 'Kategori baglantilari kaydedilemedi.' } });
        }
    }
}));

export const generatePreviewFromTemplate = (template?: CodeTemplate, data: Record<string, any> = {}) => {
    if (!template) return "";
    return template.segments.reduce((acc, seg, idx) => {
        let val = seg.key === 'staticText' ? (seg.customValue || "") : (data[seg.key] || "");
        
        if (template.type === 'SKU' && seg.key !== 'staticText') {
            // Ölçü değerleri için formatlama kuralları
            if (seg.key === 'thickness' && val) val = val.toString().replace('.', ',');
            if (seg.key === 'width' && val) {
                val = val.toString().padStart(3, '0');
            }
            // Kod değerleri (thicknessCode, pvcWidthCode vb.) olduğu gibi bırakılır
        }
        
        const sep = idx < template.segments.length - 1 ? seg.nextSep : '';
        return acc + val + sep;
    }, "");
};
