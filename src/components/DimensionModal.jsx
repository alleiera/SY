import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';

function buildFormData(initialData) {
    if (initialData) {
        return {
            measuredValue: initialData.olcu || '',
            materialGroup: initialData.malzemeGrubu || '',
            unit: initialData.olcuBirimi || '',
            code: initialData.olcuKodu || '',
            description1: initialData.aciklama1 || '',
            description2: initialData.aciklama2 || '',
            description3: initialData.aciklama3 || ''
        };
    }

    return {
        measuredValue: '',
        materialGroup: '',
        unit: '',
        code: '',
        description1: '',
        description2: '',
        description3: ''
    };
}

export default function DimensionModal({ isOpen, onClose, mode, activeTab, initialData, onSave, isDarkMode }) {
    const [formData, setFormData] = useState(() => buildFormData(initialData));

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isOpen) return;
            if (e.key === 'Escape') {
                onClose();
            } else if (e.key === 'Enter' && mode !== 'inspect') {
                // Prevent Enter from submitting if focused on textarea (allow newlines)
                if (e.target.tagName !== 'TEXTAREA') {
                    e.preventDefault();
                    if (e && e.preventDefault) e.preventDefault();
                    onSave(formData);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, mode, formData, onClose, onSave]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        if (e && e.preventDefault) e.preventDefault();
        onSave(formData);
    };

    const isReadOnly = mode === 'inspect';
    const isSurface = activeTab === 'tab4';
    const isMaterialType = activeTab === 'tab5';
    const isNameBased = isSurface || isMaterialType;
    
    const entityName = isSurface ? 'Yüzey' : (isMaterialType ? 'Malzeme Türü' : 'Ölçü');
    
    const displayTitle = mode === 'add' 
        ? `Yeni ${entityName} Ekle` 
        : (mode === 'edit' ? `${entityName} Düzenle` : `${entityName} İncele`);

    return (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className={`w-full max-w-lg rounded-lg shadow-2xl flex flex-col max-h-[90vh] ${isDarkMode ? 'bg-[#181818] border-[#2a2a2a] border' : 'bg-white border-gray-200 border'}`}>

                {/* Header */}
                <div className={`flex items-center justify-between px-4 py-3 border-b ${isDarkMode ? 'border-[#2a2a2a]' : 'border-gray-200'}`}>
                    <h2 className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{displayTitle}</h2>
                    <button onClick={onClose} className={`transition-colors ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'}`}>
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4 overflow-y-auto custom-scrollbar">

                    <div className="grid grid-cols-2 gap-4">
                        <div className={isSurface ? "col-span-2" : ""}>
                            <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{isSurface ? 'Yüzey Adı' : (isMaterialType ? 'Malzeme Türü' : 'Ölçü')}</label>
                            <input
                                type="text"
                                name="measuredValue"
                                value={formData.measuredValue}
                                onChange={handleChange}
                                disabled={isReadOnly}
                                className={`w-full border rounded px-3 py-2 focus:outline-none focus:border-blue-500 transition-colors ${isDarkMode ? 'bg-[#252525] border-[#333] text-white' : 'bg-white border-gray-300 text-gray-900'} ${isReadOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
                                placeholder={isSurface ? "Örn: MAT" : (isMaterialType ? "Örn: PVC" : "Örn: 22")}
                                required
                            />
                        </div>
                        {isMaterialType && (
                            <div>
                                <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Malzeme Grubu</label>
                                <input
                                    type="text"
                                    name="materialGroup"
                                    value={formData.materialGroup}
                                    onChange={handleChange}
                                    disabled={isReadOnly}
                                    className={`w-full border rounded px-3 py-2 focus:outline-none focus:border-blue-500 transition-colors ${isDarkMode ? 'bg-[#252525] border-[#333] text-white' : 'bg-white border-gray-300 text-gray-900'} ${isReadOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
                                    placeholder="Örn: Hammadde"
                                />
                            </div>
                        )}
                        {!isNameBased && (
                            <div>
                                <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Ölçü Birimi</label>
                                <select
                                    name="unit"
                                    value={formData.unit}
                                    onChange={handleChange}
                                    disabled={isReadOnly}
                                    className={`w-full border rounded px-3 py-2 focus:outline-none focus:border-blue-500 transition-colors ${isDarkMode ? 'bg-[#252525] border-[#333] text-white' : 'bg-white border-gray-300 text-gray-900'} ${isReadOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
                                >
                                    <option value="">Seçiniz...</option>
                                    <option value="mm">mm</option>
                                    <option value="cm">cm</option>
                                    <option value="m">m</option>
                                    <option value="m2">m2</option>
                                    <option value="inch">inch</option>
                                    <option value="gr">gr</option>
                                    <option value="kg">kg</option>
                                    <option value="adet">adet</option>
                                    <option value="mtul">mtul</option>
                                </select>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{isSurface ? 'Yüzey Kodu' : (isMaterialType ? 'Tür Kısaltması' : 'Ölçü Kodu')}</label>
                        <input
                            type="text"
                            name="code"
                            value={formData.code}
                            onChange={handleChange}
                            disabled={isReadOnly}
                            className={`w-full border rounded px-3 py-2 focus:outline-none focus:border-blue-500 transition-colors ${isDarkMode ? 'bg-[#252525] border-[#333] text-white' : 'bg-white border-gray-300 text-gray-900'} ${isReadOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
                            placeholder={isSurface ? "Örn: MT" : (isMaterialType ? "Örn: HM" : "Örn: PVC-22")}
                        />
                    </div>

                    <div>
                        <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Açıklama 1</label>
                        <textarea
                            name="description1"
                            value={formData.description1}
                            onChange={handleChange}
                            disabled={isReadOnly}
                            rows={2}
                            className={`w-full border rounded px-3 py-2 focus:outline-none focus:border-blue-500 transition-colors resize-none ${isDarkMode ? 'bg-[#252525] border-[#333] text-white' : 'bg-white border-gray-300 text-gray-900'} ${isReadOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
                        />
                    </div>

                    <div>
                        <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Açıklama 2</label>
                        <textarea
                            name="description2"
                            value={formData.description2}
                            onChange={handleChange}
                            disabled={isReadOnly}
                            rows={2}
                            className={`w-full border rounded px-3 py-2 focus:outline-none focus:border-blue-500 transition-colors resize-none ${isDarkMode ? 'bg-[#252525] border-[#333] text-white' : 'bg-white border-gray-300 text-gray-900'} ${isReadOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
                        />
                    </div>

                    <div>
                        <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Açıklama 3</label>
                        <textarea
                            name="description3"
                            value={formData.description3}
                            onChange={handleChange}
                            disabled={isReadOnly}
                            rows={2}
                            className={`w-full border rounded px-3 py-2 focus:outline-none focus:border-blue-500 transition-colors resize-none ${isDarkMode ? 'bg-[#252525] border-[#333] text-white' : 'bg-white border-gray-300 text-gray-900'} ${isReadOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
                        />
                    </div>

                </form>

                {/* Footer */}
                <div className={`flex items-center justify-end px-4 py-3 border-t gap-2 rounded-b-lg ${isDarkMode ? 'border-[#2a2a2a] bg-[#1f1f1f]' : 'border-gray-200 bg-gray-50'}`}>
                    <button
                        onClick={onClose}
                        className={`px-4 py-2 text-sm rounded transition-colors ${isDarkMode ? 'text-gray-400 hover:text-white hover:bg-[#252525]' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'}`}
                    >
                        {isReadOnly ? 'Kapat' : 'İptal'}
                    </button>

                    {!isReadOnly && (
                        <button
                            onClick={handleSubmit}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium flex items-center transition-colors shadow-sm"
                        >
                            <Save size={16} className="mr-2" />
                            Kaydet
                        </button>
                    )}
                </div>

            </div>
        </div>
    );
}
