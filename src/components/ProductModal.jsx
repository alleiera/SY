import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';

function buildFormData(initialData, mode) {
    if (initialData && (mode === 'edit' || mode === 'inspect')) {
        return {
            code: initialData.code || '',
            productName: initialData.productName || '',
            surface: initialData.surface || '',
            group: initialData.group || '',
            hCode: initialData.hCode || '',
            brand: initialData.brand || '',
            brandCode: initialData.brandCode || '',
            description1: initialData.description1 || '',
            description2: initialData.description2 || '',
            description3: initialData.description3 || '',
            specialCode1: initialData.specialCode1 || '',
            specialCode2: initialData.specialCode2 || '',
            specialCode3: initialData.specialCode3 || '',
            specialCode4: initialData.specialCode4 || '',
            specialCode5: initialData.specialCode5 || ''
        };
    }

    return {
        code: '',
        productName: '',
        surface: '',
        group: '',
        hCode: '',
        brand: '',
        brandCode: '',
        description1: '',
        description2: '',
        description3: '',
        specialCode1: '',
        specialCode2: '',
        specialCode3: '',
        specialCode4: '',
        specialCode5: ''
    };
}

export default function ProductModal({ isOpen, onClose, mode, initialData, onSave }) {
    const [formData, setFormData] = useState(() => buildFormData(initialData, mode));

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isOpen) return;
            if (e.key === 'Escape') {
                onClose();
            } else if (e.key === 'Enter' && mode !== 'inspect') {
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
    const title = mode === 'add' ? 'Yeni Ürün Ekle' : (mode === 'edit' ? 'Ürün Düzenle' : 'Ürün İncele');

    const renderInput = (label, name, placeholder = '', isTextArea = false) => (
        <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">{label}</label>
            {isTextArea ? (
                <textarea
                    name={name}
                    value={formData[name]}
                    onChange={handleChange}
                    disabled={isReadOnly}
                    rows={2}
                    className={`w-full bg-[#252525] border border-[#333] rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors resize-none ${isReadOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
                    placeholder={placeholder}
                />
            ) : (
                <input
                    type="text"
                    name={name}
                    value={formData[name]}
                    onChange={handleChange}
                    disabled={isReadOnly}
                    className={`w-full bg-[#252525] border border-[#333] rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors ${isReadOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
                    placeholder={placeholder}
                    required={name === 'code' || name === 'productName'}
                />
            )}
        </div>
    );

    return (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-[#181818] border border-[#2a2a2a] w-full max-w-4xl rounded-lg shadow-2xl flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2a2a]">
                    <h2 className="text-white font-bold text-lg">{title}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <form id="product-form" onSubmit={handleSubmit} className="p-4 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-4">
                            <h3 className="text-[#137fec] font-semibold mb-2 border-b border-[#333] pb-1 text-sm">Temel Bilgiler</h3>
                            {renderInput('Kod', 'code', 'Örn: PRD-001')}
                            {renderInput('Ürün Adı', 'productName', 'Örn: Profil X')}
                            {renderInput('Yüzey', 'surface', 'Örn: Mat')}
                            {renderInput('Grup', 'group', 'Örn: Ahşap')}
                            {renderInput('H Kodu', 'hCode', 'Örn: H123')}
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-[#137fec] font-semibold mb-2 border-b border-[#333] pb-1 text-sm">Marka & Açıklamalar</h3>
                            {renderInput('Marka', 'brand', 'Örn: AGT')}
                            {renderInput('Marka Kodu', 'brandCode', 'Örn: AGT-01')}
                            {renderInput('Açıklama 1', 'description1', '', true)}
                            {renderInput('Açıklama 2', 'description2', '', true)}
                            {renderInput('Açıklama 3', 'description3', '', true)}
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-[#137fec] font-semibold mb-2 border-b border-[#333] pb-1 text-sm">Özel Kodlar</h3>
                            {renderInput('Özel Kod 1', 'specialCode1')}
                            {renderInput('Özel Kod 2', 'specialCode2')}
                            {renderInput('Özel Kod 3', 'specialCode3')}
                            {renderInput('Özel Kod 4', 'specialCode4')}
                            {renderInput('Özel Kod 5', 'specialCode5')}
                        </div>
                    </div>
                </form>

                {/* Footer */}
                <div className="flex items-center justify-end px-4 py-3 border-t border-[#2a2a2a] gap-2 bg-[#1f1f1f] rounded-b-lg shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-[#252525] rounded transition-colors"
                    >
                        {isReadOnly ? 'Kapat' : 'İptal'}
                    </button>

                    {!isReadOnly && (
                        <button
                            type="submit"
                            form="product-form"
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium flex items-center transition-colors shadow-lg"
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
