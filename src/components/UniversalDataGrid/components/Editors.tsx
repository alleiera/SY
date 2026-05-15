import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calculator } from 'lucide-react';
import { Column } from '../types';
import { formatNumberTR, parseNumberTR, formatForEditing } from '../utils';
import { useSmartPosition } from '../hooks/useSmartPosition';

const evaluateBasicExpression = (expression: string) => {
    const normalized = expression.replace(/\./g, '').replace(/,/g, '.').replace(/\s+/g, '');
    if (!/^[\d+\-*/().]+$/.test(normalized)) return null;

    try {
        const result = Function(`"use strict"; return (${normalized});`)();
        return Number.isFinite(result) ? Number(result) : null;
    } catch {
        return null;
    }
};

export const CalculatorEditor = ({ initialValue, onSave, onCancel, anchorRect, isDarkMode }: { initialValue: string, onSave: (val: any) => void, onCancel: () => void, anchorRect: DOMRect | null, isDarkMode: boolean }) => {
    const [expression, setExpression] = useState(initialValue);
    const [previewResult, setPreviewResult] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const positionStyle = useSmartPosition(anchorRect, 260, 110);
    const calculate = (expr: string) => {
        const result = evaluateBasicExpression(expr);
        return result === null ? "Hata" : formatNumberTR(result);
    };
    useLayoutEffect(() => { if (inputRef.current) inputRef.current.focus(); }, []);
    useEffect(() => { const res = calculate(expression); setPreviewResult(res !== "Hata" ? String(res) : null); }, [expression]);
    const handleKeyDown = (e: React.KeyboardEvent) => { e.stopPropagation(); if (e.key === 'Enter') { const res = calculate(expression); if (res !== "Hata") onSave(parseNumberTR(res as string)); else onCancel(); } else if (e.key === 'Escape') { onCancel(); } };
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => { const val = e.target.value; if (!val.endsWith('.')) setExpression(val); }
    if (!anchorRect) return null;
    const themeClass = isDarkMode ? "bg-[#1f1f1f] border-gray-600 text-gray-100" : "bg-white border-blue-500 text-gray-900";
    const inputClass = isDarkMode ? "bg-[#2a2a2a] border-gray-600 text-white focus:border-gray-400" : "bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-100";
    const footerClass = isDarkMode ? "border-gray-700 text-gray-400" : "border-gray-100 text-gray-400";
    return createPortal(<><div className="fixed inset-0 z-[99998]" onClick={() => { const res = calculate(expression); if (res !== "Hata") onSave(parseNumberTR(res as string)); else onCancel(); }} /><div className={`fixed shadow-2xl border z-[99999] flex flex-col p-2 rounded-lg ${themeClass}`} style={positionStyle} onClick={e => e.stopPropagation()}><div className="flex items-center text-xs text-blue-500 font-bold mb-2 px-1"><Calculator size={14} className="mr-1.5" /> HESAP MAKİNESİ</div><input ref={inputRef} type="text" className={`w-full p-2 text-lg border rounded outline-none font-mono tracking-wider ${inputClass}`} value={expression} onChange={handleChange} onKeyDown={handleKeyDown} placeholder="Örn: 15,5*2" /><div className="mt-2 text-right w-full overflow-hidden"><div className="text-xs text-gray-500 mb-1">Sonuç</div><div className="text-xl font-bold overflow-x-auto whitespace-nowrap scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent px-1 pb-1" style={{ maxWidth: '100%' }}>{previewResult ?? '-'}</div></div><div className={`mt-auto pt-2 border-t text-[10px] flex justify-between ${footerClass}`}><span>Enter: Kaydet</span><span>Esc: İptal</span></div></div></>, document.body);
};

export const LargeTextEditor = ({ initialValue, col, onSave, onCancel, anchorRect, isDarkMode }: { initialValue: any, col: Column, onSave: (val: any) => void, onCancel: () => void, anchorRect: DOMRect | null, isDarkMode: boolean }) => {
    const [value, setValue] = useState(initialValue);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const maxLength = col.cellEditorParams?.maxLength || 200;
    const positionStyle = useSmartPosition(anchorRect, 250, 180);
    useLayoutEffect(() => { if (textareaRef.current) { textareaRef.current.focus(); textareaRef.current.setSelectionRange(textareaRef.current.value.length, textareaRef.current.value.length); } }, []);
    const handleKeyDown = (e: React.KeyboardEvent) => { e.stopPropagation(); if (e.key === 'Enter') { if (e.ctrlKey || e.metaKey) { onSave(value); } } else if (e.key === 'Escape') { onCancel(); } };
    if (!anchorRect) return null;
    const themeClass = isDarkMode ? "bg-[#1f1f1f] border-gray-600 text-gray-100" : "bg-white border-gray-400 text-gray-900";
    const areaClass = isDarkMode ? "bg-[#1f1f1f] text-gray-100 placeholder-gray-500" : "bg-white text-gray-900 placeholder-gray-400";
    const footerClass = isDarkMode ? "bg-[#1f1f1f] border-[#2a2a2a] text-gray-400" : "bg-gray-100 border-gray-200 text-gray-500";
    return createPortal(<><div className="fixed inset-0 z-[99998]" onClick={() => onSave(value)} /><div className={`fixed shadow-2xl border z-[99999] flex flex-col p-1 rounded-sm ${themeClass}`} style={positionStyle} onClick={e => e.stopPropagation()}><div className="flex-1 relative"><textarea ref={textareaRef} className={`w-full h-full p-2 text-sm border-none outline-none resize-none font-sans leading-relaxed ${areaClass}`} value={value} onChange={e => setValue(e.target.value)} onKeyDown={handleKeyDown} maxLength={maxLength} /></div><div className={`h-6 border-t flex items-center justify-between px-2 text-[10px] select-none ${footerClass}`}><span>Ctrl+Enter: Kaydet</span><span>{value ? value.length : 0}/{maxLength}</span></div></div></>, document.body);
};

export const CellEditor = React.memo(({ initialValue, col, onSave, onCancel, startKey, isDarkMode }: { initialValue: any, col: Column, onSave: (val: any) => void, onCancel: () => void, startKey?: string, isDarkMode: boolean }) => {
    const anchorRef = useRef<HTMLDivElement>(null);
    const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
    const [showCalculator, setShowCalculator] = useState(false);
    const [calcInitialValue, setCalcInitialValue] = useState("");

    const getInitialValue = () => {
        if (col.cellEditor === 'number') {
            if (startKey && ['+', '-', '*', '/'].includes(startKey)) { return String(formatNumberTR(initialValue)).replace(/\./g, '') + startKey; }
            if (startKey) return startKey;
            return formatForEditing(initialValue);
        }
        if (startKey && col.cellEditor !== 'date' && col.cellEditor !== 'select') return startKey;
        if (col.cellEditor === 'date' && initialValue) { const parts = String(initialValue).split('.'); if (parts.length === 3) { return `${parts[2]}-${parts[1]}-${parts[0]}`; } }
        return initialValue ?? '';
    };

    const [value, setValue] = useState(getInitialValue());
    const inputRef = useRef<any>(null);

    useLayoutEffect(() => {
        if (anchorRef.current) {
            const parent = anchorRef.current.parentElement;
            if (parent) setAnchorRect(parent.getBoundingClientRect());
        }

        if (col.cellEditor === 'number' && startKey && ['+', '-', '*', '/'].includes(startKey)) {
            let cleanInit = String(formatNumberTR(initialValue)).replace(/\./g, '');
            setCalcInitialValue(cleanInit + startKey);
            setShowCalculator(true);
        }
    }, [initialValue, col.cellEditor, startKey]);

    useLayoutEffect(() => { if (inputRef.current && !showCalculator && col.cellEditor !== 'largeText') { inputRef.current.focus(); } }, [showCalculator, col.cellEditor]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        e.stopPropagation();
        if (col.cellEditor === 'number') { if (e.key === '.') { e.preventDefault(); return; } if (['+', '-', '*', '/'].includes(e.key)) { e.preventDefault(); let cleanVal = String(value).replace(/\./g, ''); setCalcInitialValue(cleanVal + e.key); setShowCalculator(true); return; } }
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSave(); } else if (e.key === 'Escape') { onCancel(); }
    };

    const handleSave = () => { let finalVal = value; if (col.cellEditor === 'number') { finalVal = parseNumberTR(String(value)); } else if (col.cellEditor === 'date' && value) { const parts = String(value).split('-'); if (parts.length === 3) finalVal = `${parts[2]}.${parts[1]}.${parts[0]}`; } onSave(finalVal); }
    const handleBlur = () => { if (showCalculator) return; handleSave(); }
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => { let val = e.target.value; if (col.cellEditor === 'number') { val = val.replace(/\./g, ''); } setValue(val); }

    if (col.cellEditor === 'largeText') return <><div ref={anchorRef} className="hidden" />{anchorRect && <LargeTextEditor initialValue={startKey ? startKey : initialValue} col={col} onSave={onSave} onCancel={onCancel} anchorRect={anchorRect} isDarkMode={isDarkMode} />}</>;
    if (showCalculator) return <><div ref={anchorRef} className="hidden" />{anchorRect && <CalculatorEditor initialValue={calcInitialValue} onSave={onSave} onCancel={onCancel} anchorRect={anchorRect} isDarkMode={isDarkMode} />}</>;

    const commonStyle = `w-full h-full px-1 border-2 outline-none absolute inset-0 z-50 shadow-md ${isDarkMode ? 'bg-[#181818] text-white border-gray-400' : 'bg-white text-gray-900 border-blue-500'}`;

    if (col.cellEditor === 'select') return <select ref={inputRef} value={value} onChange={e => setValue(e.target.value)} onKeyDown={handleKeyDown} onBlur={handleBlur} className={commonStyle}>{col.cellEditorParams?.options?.map((opt: string, idx: number) => <option key={`${opt}-${idx}`} value={opt}>{opt}</option>)}</select>;
    if (col.cellEditor === 'date') return <input type="date" ref={inputRef} value={value} onChange={e => setValue(e.target.value)} onKeyDown={handleKeyDown} onBlur={handleBlur} className={commonStyle} />;

    return (
        <>
            <div ref={anchorRef} className="hidden" />
            <input type="text" ref={inputRef} value={value} onChange={handleChange} onKeyDown={handleKeyDown} onBlur={handleBlur} className={`${commonStyle} ${col.cellEditor === 'number' ? 'text-right' : ''}`} {...(col.cellEditorParams || {})} />
        </>
    );
});
