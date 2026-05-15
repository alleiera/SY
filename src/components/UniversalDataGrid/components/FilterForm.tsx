import React, { useState } from 'react';
import { Column, ColumnFilterState, FilterType } from '../types';

export const FilterForm = React.memo(({ col, currentFilter, onApply, onClear, isDarkMode }: { col: Column, currentFilter: ColumnFilterState | undefined, onApply: (state: ColumnFilterState) => void, onClear: () => void, isDarkMode: boolean }) => {
    const [localState, setLocalState] = useState<ColumnFilterState>(currentFilter || { condition1: { type: 'contains', value: '' }, condition2: { type: 'contains', value: '' }, operator: 'AND', isActive: false });
    const filterOptions: { val: FilterType, label: string }[] = [{ val: 'contains', label: 'İçerir' }, { val: 'notContains', label: 'İçermez' }, { val: 'equals', label: 'Eşittir' }, { val: 'notEquals', label: 'Eşit Değildir' }, { val: 'startsWith', label: 'İle Başlar' }, { val: 'endsWith', label: 'İle Biter' }];
    const bgClass = isDarkMode ? "bg-[#181818] border-[#2a2a2a] text-gray-200" : "bg-gray-50 border-gray-200 text-gray-900";
    const inputClass = isDarkMode ? "bg-[#2a2a2a] border-gray-600 text-white focus:border-gray-400" : "bg-white border-gray-300 focus:border-blue-500";
    return (
        <div className={`p-3 space-y-3 border-t border-b ${bgClass}`}>
            <div className="space-y-1"><span className="text-xs font-semibold opacity-70">Koşul 1:</span><select className={`w-full border p-1.5 text-sm outline-none rounded ${inputClass}`} value={localState.condition1.type} onChange={(e) => setLocalState(p => ({ ...p, condition1: { ...p.condition1, type: e.target.value as FilterType } }))}>{filterOptions.map((opt, idx) => <option key={`${opt.val}-${idx}`} value={opt.val}>{opt.label}</option>)}</select><input className={`w-full border p-1.5 text-sm outline-none rounded ${inputClass}`} placeholder="Değer..." value={localState.condition1.value} onChange={(e) => setLocalState(p => ({ ...p, condition1: { ...p.condition1, value: e.target.value } }))} /></div>
            <div className="flex space-x-4 text-sm">
                <label className="flex items-center"><input type="radio" checked={localState.operator === 'AND'} onChange={() => setLocalState(p => ({ ...p, operator: 'AND' }))} className="mr-1 accent-blue-600" /> VE</label>
                <label className="flex items-center"><input type="radio" checked={localState.operator === 'OR'} onChange={() => setLocalState(p => ({ ...p, operator: 'OR' }))} className="mr-1 accent-blue-600" /> VEYA</label>
            </div>
            <div className="space-y-1"><span className="text-xs font-semibold opacity-70">Koşul 2:</span><select className={`w-full border p-1.5 text-sm outline-none rounded ${inputClass}`} value={localState.condition2.type} onChange={(e) => setLocalState(p => ({ ...p, condition2: { ...p.condition2, type: e.target.value as FilterType } }))}>{filterOptions.map((opt, idx) => <option key={`${opt.val}-${idx}`} value={opt.val}>{opt.label}</option>)}</select><input className={`w-full border p-1.5 text-sm outline-none rounded ${inputClass}`} placeholder="Değer..." value={localState.condition2.value} onChange={(e) => setLocalState(p => ({ ...p, condition2: { ...p.condition2, value: e.target.value } }))} /></div>
            <div className="pt-2 flex justify-between">
                <button onClick={onClear} className={`px-3 py-1 border rounded text-xs ${isDarkMode ? 'border-gray-600 hover:bg-gray-700 text-red-400' : 'border-gray-300 hover:bg-gray-100 text-red-600'}`}>Temizle</button>
                <button onClick={() => onApply({ ...localState, isActive: !!localState.condition1.value || !!localState.condition2.value })} className="px-4 py-1 border border-blue-600 bg-blue-600 text-white rounded text-xs hover:bg-blue-700">Uygula</button>
            </div>
        </div>
    );
});
