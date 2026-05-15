import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { fetchMaterialTypes } from '../services/materialService';

function buildFormData(initialData) {
    if (initialData) {
        return {
            type: initialData.type || '',
            code: initialData.code || '',
            name: initialData.name || '',
            unit: initialData.unit || '',
            brand: initialData.brand || '',
            brandCode: initialData.brandCode || '',
            description1: initialData.description1 || '',
            description2: initialData.description2 || '',
            description3: initialData.description3 || ''
        };
    }

    return {
        type: '',
        code: '',
        name: '',
        unit: '',
        brand: '',
        brandCode: '',
        description1: '',
        description2: '',
        description3: ''
    };
}

export default function MaterialModal({ isOpen, onClose, mode, initialData, onSave }) {
    const [formData, setFormData] = useState(() => buildFormData(initialData));
    const [activeTab, setActiveTab] = useState('genel');
    const [materialTypes, setMaterialTypes] = useState([]);

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

    useEffect(() => {
        const loadMaterialTypes = async () => {
            if (isOpen) {
                const types = await fetchMaterialTypes();
                setMaterialTypes(types.map(item => ({ value: item.code, label: item.name })));
            }
        };
        loadMaterialTypes();
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => {
                const textareas = document.querySelectorAll('#material-form textarea');
                textareas.forEach(ta => {
                    ta.style.height = 'auto';
                    ta.style.height = ta.scrollHeight + 'px';
                });
            }, 10);
        }
    }, [isOpen, initialData]);

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
    const title = mode === 'add' ? 'Yeni Malzeme' : (mode === 'edit' ? 'Malzeme Düzenle' : 'Malzeme İncele');

    // Compact horizontal input
    const renderCompactInput = (label, name, placeholder = '', options = []) => (
        <div className="flex items-center mb-1.5">
            <label className="w-1/3 text-[11px] font-semibold text-gray-300 text-right pr-3 truncate" title={label}>{label}</label>
            <div className="w-2/3">
                {options.length > 0 ? (
                    <select
                        name={name}
                        value={formData[name]}
                        onChange={handleChange}
                        disabled={isReadOnly}
                        className={`w-full bg-[#252525] border border-[#3a3a3a] rounded-[3px] px-2 text-xs text-white focus:outline-none focus:border-[#137fec] focus:ring-1 focus:ring-[#137fec] transition-all h-6 shadow-inner ${isReadOnly ? 'opacity-60 cursor-not-allowed' : 'hover:border-[#4a4a4a]'}`}
                        required
                    >
                        <option value="" disabled>Seçiniz...</option>
                        {options.map((o, idx) => <option key={`${o.value}-${idx}`} value={o.value}>{o.label}</option>)}
                    </select>
                ) : (
                    <input
                        type="text"
                        name={name}
                        value={formData[name]}
                        onChange={handleChange}
                        disabled={isReadOnly}
                        className={`w-full bg-[#252525] border border-[#3a3a3a] rounded-[3px] px-1.5 text-xs text-white focus:outline-none focus:border-[#137fec] focus:ring-1 focus:ring-[#137fec] transition-all h-6 shadow-inner ${isReadOnly ? 'opacity-60 cursor-not-allowed' : 'hover:border-[#4a4a4a]'}`}
                        placeholder={placeholder}
                        required={name === 'code' || name === 'name'}
                    />
                )}
            </div>
        </div>
    );

    // Compact textarea for standard descriptions at top or inside tab
    const renderTextArea = (label, name, placeholder = '', rows = 2) => (
        <div className="flex items-start mb-1.5">
            <label className="w-[85px] shrink-0 text-[11px] font-semibold text-gray-300 text-right pr-3 pt-1.5 truncate" title={label}>{label}</label>
            <div className="w-full">
                <textarea
                    name={name}
                    value={formData[name]}
                    onChange={handleChange}
                    onInput={(e) => {
                        e.target.style.height = 'auto';
                        e.target.style.height = e.target.scrollHeight + 'px';
                    }}
                    disabled={isReadOnly}
                    rows={rows}
                    className={`w-full bg-[#252525] border border-[#3a3a3a] rounded-[3px] px-1.5 py-1 text-xs text-white focus:outline-none focus:border-[#137fec] focus:ring-1 focus:ring-[#137fec] transition-colors resize-none shadow-inner overflow-hidden ${isReadOnly ? 'opacity-60 cursor-not-allowed' : 'hover:border-[#4a4a4a]'}`}
                    placeholder={placeholder}
                    style={{ minHeight: '26px' }}
                />
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            {/* Main Modal Container */}
            <div className="bg-[#1c1c1e] border border-[#3a3a3a] w-full max-w-3xl rounded-md shadow-2xl flex flex-col max-h-[95vh] overflow-hidden">

                {/* Header (Title Bar) */}
                <div className="flex items-center justify-between px-3 py-2 border-b border-[#2a2a2a] bg-[#141415]">
                    <h2 className="text-white font-medium text-sm flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#137fec]"></div>
                        {title} {formData.code && <span className="text-gray-400 font-normal"> - {formData.code}</span>}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors bg-transparent border-none">
                        <X size={16} />
                    </button>
                </div>

                <form id="material-form" onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                    {/* Top Fixed Section (Code, Name, Desc) */}
                    <div className="p-4 bg-[#1a1a1c] border-b border-[#2a2a2a]">
                        <div className="flex gap-4">
                            {/* Left Column (Code & Name) */}
                            <div className="w-[40%]">
                                {renderCompactInput('Kodu', 'code')}
                                {renderCompactInput('Malzeme Adı (Açıklaması)', 'name')}
                            </div>
                            {/* Right Column (Descriptions) */}
                            <div className="w-[60%] flex flex-col gap-1">
                                {renderTextArea('Açıklama 1', 'description1', '', 1)}
                                {renderTextArea('Açıklama 2', 'description2', '', 1)}
                                {renderTextArea('Açıklama 3', 'description3', '', 1)}
                            </div>
                        </div>
                    </div>

                    {/* Tabs Bar */}
                    <div className="flex border-b border-[#333] bg-[#141415] px-2 pt-1 gap-1">
                        <button 
                            type="button" 
                            onClick={() => setActiveTab('genel')} 
                            className={`px-4 py-1.5 text-[11px] font-medium rounded-t-sm transition-colors border-t border-x border-transparent ${activeTab === 'genel' ? 'bg-[#252525] text-[#137fec] border-t-[#3a3a3a] border-x-[#3a3a3a] mb-[-1px]' : 'text-gray-400 hover:text-gray-200 hover:bg-[#1f1f1f]'}`}
                        >
                            Genel Bilgiler
                        </button>
                        <button 
                            type="button" 
                            onClick={() => setActiveTab('ekstra')} 
                            className={`px-4 py-1.5 text-[11px] font-medium rounded-t-sm transition-colors border-t border-x border-transparent ${activeTab === 'ekstra' ? 'bg-[#252525] text-[#137fec] border-t-[#3a3a3a] border-x-[#3a3a3a] mb-[-1px]' : 'text-gray-400 hover:text-gray-200 hover:bg-[#1f1f1f]'}`}
                        >
                            Marka & Ek Detaylar
                        </button>
                    </div>

                    {/* Tab Contents */}
                    <div className="p-4 bg-[#252525] flex-1 overflow-y-auto">
                        {activeTab === 'genel' && (
                            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                                <div className="space-y-1">
                                    {renderCompactInput('Tür', 'type', '', materialTypes)}
                                    {renderCompactInput('Birim', 'unit', '', [
                                        { value: 'Adet', label: 'Adet' },
                                        { value: 'Kg', label: 'Kg' },
                                        { value: 'Gr', label: 'Gr' },
                                        { value: 'Metre', label: 'Metre' },
                                        { value: 'Litre', label: 'Litre' },
                                        { value: 'Ton', label: 'Ton' }
                                    ])}
                                </div>
                                <div className="space-y-1">
                                    {/* Additional generic fields can go here. e.g. Tax rates, etc. */}
                                </div>
                            </div>
                        )}

                        {activeTab === 'ekstra' && (
                            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                                <div className="space-y-1">
                                    {renderCompactInput('Marka', 'brand', 'Örn: PoliX')}
                                    {renderCompactInput('Marka Kodu', 'brandCode', 'Örn: PX-01')}
                                </div>
                                <div>
                                    
                                </div>
                            </div>
                        )}
                    </div>
                </form>

                {/* Footer (Actions) */}
                <div className="flex items-center justify-end px-4 py-2 border-t border-[#1a1a1c] gap-2 bg-[#141415] rounded-b-md shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-1.5 text-xs text-gray-300 hover:text-white hover:bg-[#252525] rounded transition-colors"
                    >
                        {isReadOnly ? 'Kapat' : 'Vazgeç'}
                    </button>

                    {!isReadOnly && (
                        <button
                            type="submit"
                            form="material-form"
                            className="bg-[#137fec] hover:bg-[#248df9] text-white px-5 py-1.5 rounded text-xs font-semibold flex items-center transition-colors shadow"
                        >
                            <Save size={14} className="mr-2" />
                            Kaydet
                        </button>
                    )}
                </div>

            </div>
        </div>
    );
}
