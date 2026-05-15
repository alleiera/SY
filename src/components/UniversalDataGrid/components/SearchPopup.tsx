import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, Settings2, Check } from 'lucide-react';
import { Column } from '../types';

export const SearchPopup = ({
    isOpen,
    onClose,
    columns,
    searchableColumns,
    setSearchableColumns,
    searchText,
    setSearchText,
    isDarkMode
}: {
    isOpen: boolean;
    onClose: () => void;
    columns: Column[];
    searchableColumns: string[];
    setSearchableColumns: (cols: string[]) => void;
    searchText: string;
    setSearchText: (text: string) => void;
    isDarkMode: boolean;
}) => {
    const [showColumnSelector, setShowColumnSelector] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    // Handle debounced search correctly - internal state for fast typing, debounced to parent
    const [localQuery, setLocalQuery] = useState(searchText);

    useEffect(() => {
        setLocalQuery(searchText);
    }, [searchText]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchText(localQuery);
        }, 300); // 300ms debounce
        return () => clearTimeout(timer);
    }, [localQuery, setSearchText]);

    if (!isOpen) return null;

    const toggleColumn = (field: string) => {
        if (searchableColumns.includes(field)) {
            setSearchableColumns(searchableColumns.filter(c => c !== field));
        } else {
            setSearchableColumns([...searchableColumns, field]);
        }
    };

    const toggleAllColumns = () => {
        if (searchableColumns.length === columns.filter(c => c.type !== 'checkbox').length) {
            setSearchableColumns([]);
        } else {
            setSearchableColumns(columns.filter(c => c.type !== 'checkbox').map(c => c.field));
        }
    };

    const bgClass = isDarkMode ? "bg-[#1f1f1f] border-gray-600 text-gray-100" : "bg-white border-gray-300 text-gray-900";
    const inputClass = isDarkMode ? "bg-[#2a2a2a] border-gray-600 text-white focus:border-blue-500" : "bg-white border-gray-300 focus:border-blue-500";
    const dropdownClass = isDarkMode ? "bg-[#2a2a2a] border-gray-600" : "bg-white border-gray-300";

    return createPortal(
        <div className="fixed inset-0 z-[300000] flex items-start justify-center pt-20 font-sans pointer-events-none">
            <div
                className={`relative w-[500px] shadow-2xl rounded-lg border p-4 flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-100 pointer-events-auto ${bgClass}`}
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between border-b border-gray-600/30 pb-2">
                    <h3 className="font-bold flex items-center gap-2"><Search size={18} className="text-blue-500" /> Ara & Filtrele</h3>
                    <button onClick={onClose}><X size={18} className="opacity-50 hover:opacity-100" /></button>
                </div>

                <div className="flex gap-2">
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Tabloda ara..."
                        className={`flex-1 p-2 rounded border outline-none ${inputClass}`}
                        value={localQuery}
                        onChange={(e) => setLocalQuery(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                onClose();
                            }
                            if (e.key === 'Escape') {
                                onClose();
                            }
                        }}
                    />
                    <div className="relative">
                        <button
                            className={`p-2 border rounded flex items-center justify-between gap-2 min-w-[140px] ${inputClass}`}
                            onClick={() => setShowColumnSelector(!showColumnSelector)}
                        >
                            <span className="text-xs truncate max-w-[100px]">
                                {searchableColumns.length === 0 ? "Sütun Seç" :
                                    searchableColumns.length === columns.filter(c => c.type !== 'checkbox').length ? "Tüm Sütunlar" :
                                        `${searchableColumns.length} Sütun Seçili`}
                            </span>
                            <Settings2 size={14} className="opacity-70" />
                        </button>

                        {showColumnSelector && (
                            <div className={`absolute top-full right-0 mt-1 w-48 max-h-60 overflow-y-auto border rounded shadow-xl bg-white z-50 ${dropdownClass}`}>
                                <div
                                    className={`flex items-center px-3 py-1.5 cursor-pointer border-b ${isDarkMode ? 'border-gray-700 hover:bg-[#3a3a3a]' : 'border-gray-100 hover:bg-gray-50'}`}
                                    onClick={toggleAllColumns}
                                >
                                    <div className={`w-3.5 h-3.5 border rounded mr-2 flex items-center justify-center ${searchableColumns.length === columns.filter(c => c.type !== 'checkbox').length ? 'bg-blue-600 border-blue-600' : 'border-gray-400'}`}>
                                        {searchableColumns.length === columns.filter(c => c.type !== 'checkbox').length && <Check size={10} className="text-white" />}
                                    </div>
                                    <span className="text-xs font-bold">Tümünü Seç</span>
                                </div>
                                {columns.filter(c => c.type !== 'checkbox').map((col, idx, arr) => {
                                    const isChecked = searchableColumns.includes(col.field);
                                    return (
                                        <div
                                            key={col.field}
                                            className={`flex items-center px-3 py-1.5 cursor-pointer ${idx !== arr.length - 1 ? 'border-b' : ''} ${isDarkMode ? 'border-gray-700 hover:bg-[#3a3a3a]' : 'border-gray-100 hover:bg-gray-50'}`}
                                            onClick={() => toggleColumn(col.field)}
                                        >
                                            <div className={`w-3.5 h-3.5 border rounded mr-2 flex items-center justify-center ${isChecked ? 'bg-blue-600 border-blue-600' : 'border-gray-400'}`}>
                                                {isChecked && <Check size={10} className="text-white" />}
                                            </div>
                                            <span className="text-xs truncate">{col.headerName}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>

                <div className="text-xs opacity-50 flex justify-between">
                    <span>{localQuery ? "Sonuçlar filtreleniyor..." : "Arama yapmak için yazmaya başlayın."}</span>
                    <span>ESC: Kapat</span>
                </div>
            </div>
        </div>,
        document.body
    );
};
