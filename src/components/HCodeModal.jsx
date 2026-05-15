import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';

function buildFormData(initialData, mode) {
    if (initialData && (mode === 'edit' || mode === 'inspect')) {
        return {
            baseColor: initialData.baseColor || '',
            code: initialData.code || '',
            description: initialData.description || ''
        };
    }

    return {
        baseColor: '',
        code: '',
        description: ''
    };
}

export default function HCodeModal({ isOpen, onClose, mode, initialData, onSave, isDarkMode }) {
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
    const title = mode === 'add' ? 'Yeni H Kodu Ekle' : (mode === 'edit' ? 'H Kodu Düzenle' : 'H Kodu İncele');

    return (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className={`w-full max-w-md rounded-lg shadow-2xl flex flex-col max-h-[90vh] ${isDarkMode ? 'bg-[#181818] border-[#2a2a2a] border' : 'bg-white border-gray-200 border'}`}>

                {/* Header */}
                <div className={`flex items-center justify-between px-4 py-3 border-b ${isDarkMode ? 'border-[#2a2a2a]' : 'border-gray-200'}`}>
                    <h2 className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{title}</h2>
                    <button onClick={onClose} className={`transition-colors ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'}`}>
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4 overflow-y-auto">

                    <div>
                        <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Taban Renk</label>
                        <input
                            type="text"
                            name="baseColor"
                            value={formData.baseColor}
                            onChange={handleChange}
                            disabled={isReadOnly}
                            className={`w-full border rounded px-3 py-2 focus:outline-none focus:border-blue-500 transition-colors ${isDarkMode ? 'bg-[#252525] border-[#333] text-white' : 'bg-white border-gray-300 text-gray-900'} ${isReadOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
                            placeholder="Örn: Agt Sedef Beyaz"
                            required
                        />
                    </div>

                    <div>
                        <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>H Kod</label>
                        <input
                            type="text"
                            name="code"
                            value={formData.code}
                            onChange={handleChange}
                            disabled={isReadOnly}
                            className={`w-full border rounded px-3 py-2 focus:outline-none focus:border-blue-500 transition-colors ${isDarkMode ? 'bg-[#252525] border-[#333] text-white' : 'bg-white border-gray-300 text-gray-900'} ${isReadOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
                            placeholder="Örn: H34"
                            required
                        />
                    </div>

                    <div>
                        <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Açıklama</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            disabled={isReadOnly}
                            rows={3}
                            className={`w-full border rounded px-3 py-2 focus:outline-none focus:border-blue-500 transition-colors resize-none ${isDarkMode ? 'bg-[#252525] border-[#333] text-white' : 'bg-white border-gray-300 text-gray-900'} ${isReadOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
                            placeholder="Açıklama giriniz..."
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
