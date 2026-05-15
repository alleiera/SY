import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, Package } from 'lucide-react';
import { fetchMaterialsFiltered, isMaterialCodeDuplicate, saveMaterial, deleteMaterial } from '../../services/materialService';
import MaterialModal from '../MaterialModal';
import ConfirmDialog from '../ConfirmDialog';
import { UniversalDataGrid } from '../UniversalDataGrid';
import { useSettings } from '../../context/SettingsContext';
import FeedbackBanner from '../FeedbackBanner';

interface Material {
  id: string;
  type: string;
  code: string;
  name: string;
  unit?: string;
  brand?: string;
  brandCode?: string;
  description1?: string;
  description2?: string;
  description3?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (material: Material) => void;
  allowedTypes: string[]; // material_group kodları: ["HM", "B", ...]
  title?: string;
}

const MIN_W = 600;
const MIN_H = 400;
const DEFAULT_W = 1080;
const DEFAULT_H = 680;

export function MaterialSelectorModal({ isOpen, onClose, onSelect, allowedTypes, title = 'Malzeme Seç' }: Props) {
  const { theme } = useSettings();
  const isDarkMode = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  // ─── Window state ─────────────────────────────────────────────────────────
  const [pos, setPos] = useState({ x: Math.max(0, (window.innerWidth - DEFAULT_W) / 2), y: Math.max(0, (window.innerHeight - DEFAULT_H) / 2) });
  const [size, setSize] = useState({ w: DEFAULT_W, h: DEFAULT_H });
  const draggingRef = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const resizingRef = useRef<string | null>(null);
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0, px: 0, py: 0 });

  // ─── Data state ────────────────────────────────────────────────────────────
  const [data, setData] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlightedRow, setHighlightedRow] = useState<Material | null>(null);
  const [selectedRow, setSelectedRow] = useState<Material | null>(null);

  const [modalState, setModalState] = useState<{ isOpen: boolean; mode: string; data: any }>({ isOpen: false, mode: 'add', data: null });
  const [confirmState, setConfirmState] = useState<{ isOpen: boolean; row: any }>({ isOpen: false, row: null });
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // ─── Fetch ─────────────────────────────────────────────────────────────────
  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    try {
      const mappedData = await fetchMaterialsFiltered(allowedTypes);
      setData(mappedData);
    } catch (err) {
      console.error('MaterialSelectorModal fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [allowedTypes]);

  useEffect(() => {
    if (isOpen) {
      setFeedback(null);
      fetchMaterials();
      setHighlightedRow(null);
      setSelectedRow(null);
      // Reset window position when opening
      setPos({ x: Math.max(0, (window.innerWidth - DEFAULT_W) / 2), y: Math.max(0, (window.innerHeight - DEFAULT_H) / 2) });
      setSize({ w: DEFAULT_W, h: DEFAULT_H });
    }
  }, [isOpen, fetchMaterials]);

  // ─── Keyboard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!isOpen || modalState.isOpen || confirmState.isOpen) return;
      if (e.key === 'Escape') { e.preventDefault(); onClose(); }
      if (e.key === 'Enter' && selectedRow) { e.preventDefault(); confirmSelection(selectedRow); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, selectedRow, modalState.isOpen, confirmState.isOpen]);

  // ─── Drag (title bar) ─────────────────────────────────────────────────────
  const onDragMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    draggingRef.current = true;
    dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    e.preventDefault();

    const onMove = (ev: MouseEvent) => {
      if (!draggingRef.current) return;
      setPos({
        x: Math.max(0, Math.min(window.innerWidth - size.w, ev.clientX - dragOffset.current.x)),
        y: Math.max(0, Math.min(window.innerHeight - 60, ev.clientY - dragOffset.current.y)),
      });
    };
    const onUp = () => { draggingRef.current = false; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [pos, size]);

  // ─── Resize ───────────────────────────────────────────────────────────────
  const onResizeMouseDown = useCallback((e: React.MouseEvent, direction: string) => {
    e.preventDefault();
    e.stopPropagation();
    resizingRef.current = direction;
    resizeStart.current = { x: e.clientX, y: e.clientY, w: size.w, h: size.h, px: pos.x, py: pos.y };

    const onMove = (ev: MouseEvent) => {
      if (!resizingRef.current) return;
      const dx = ev.clientX - resizeStart.current.x;
      const dy = ev.clientY - resizeStart.current.y;
      const dir = resizingRef.current;
      let newW = resizeStart.current.w;
      let newH = resizeStart.current.h;
      let newX = resizeStart.current.px;
      let newY = resizeStart.current.py;

      if (dir.includes('e')) newW = Math.max(MIN_W, resizeStart.current.w + dx);
      if (dir.includes('s')) newH = Math.max(MIN_H, resizeStart.current.h + dy);
      if (dir.includes('w')) { newW = Math.max(MIN_W, resizeStart.current.w - dx); newX = resizeStart.current.px + (resizeStart.current.w - newW); }
      if (dir.includes('n')) { newH = Math.max(MIN_H, resizeStart.current.h - dy); newY = resizeStart.current.py + (resizeStart.current.h - newH); }

      setSize({ w: newW, h: newH });
      setPos({ x: newX, y: newY });
    };
    const onUp = () => { resizingRef.current = null; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [size, pos]);

  // ─── CRUD handlers ────────────────────────────────────────────────────────
  const confirmSelection = (row: Material) => {
    onSelect(row);
    onClose();
  };

  const handleAdd = () => {
    const defaultType = allowedTypes.length === 1 ? allowedTypes[0] : undefined;
    setModalState({ isOpen: true, mode: 'add', data: defaultType ? { type: defaultType } : null });
  };

  const handleEdit = (row: any) => setModalState({ isOpen: true, mode: 'edit', data: row });
  const handleInspect = (row: any) => setModalState({ isOpen: true, mode: 'inspect', data: row });
  const handleDuplicate = (row: any) => { const copy = { ...row }; delete copy.id; setModalState({ isOpen: true, mode: 'add', data: copy }); };
  const handleDelete = (row: any) => setConfirmState({ isOpen: true, row });

  const handleSave = async (formData: any) => {
    try {
      const excludeId = modalState.mode === 'edit' ? modalState.data.id : null;
      const isDup = await isMaterialCodeDuplicate(formData.code, excludeId);
      if (isDup) {
        setFeedback({ type: 'error', message: `"${formData.code}" kodu zaten kayıtlı. Lütfen farklı bir kod kullanın.` });
        setLoading(false);
        return;
      }

      const dbData = { type: formData.type, code: formData.code, name: formData.name, unit: formData.unit, brand: formData.brand, brandCode: formData.brandCode, description1: formData.description1, description2: formData.description2, description3: formData.description3 };

      await saveMaterial(dbData, modalState.mode === 'edit' ? modalState.data.id : null);

      setModalState(prev => ({ ...prev, isOpen: false }));
      await fetchMaterials();
      setFeedback({
        type: 'success',
        message: modalState.mode === 'add' ? 'Malzeme eklendi.' : 'Malzeme güncellendi.',
      });
    } catch (err: any) {
      setFeedback({ type: 'error', message: 'Kaydetme hatası: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  const executeDelete = async () => {
    const row = confirmState.row;
    setConfirmState({ isOpen: false, row: null });
    if (!row) return;
    try {
      setLoading(true);
      await deleteMaterial(row.id);
      await fetchMaterials();
      setFeedback({ type: 'success', message: `"${row.name}" silindi.` });
    } catch (err: any) {
      setFeedback({ type: 'error', message: 'Silme hatası: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  // ─── Columns (same as Materials.jsx but without checkbox) ────────────────
  const columns = [
    { field: 'type', headerName: 'Tür', width: 80, editable: true, cellEditor: 'text' as const },
    { field: 'code', headerName: 'Kod', width: 160, editable: true, cellEditor: 'text' as const },
    { field: 'name', headerName: 'Ürün Adı', width: 240, editable: true, cellEditor: 'text' as const },
    { field: 'quantity', headerName: 'Miktar', width: 80, editable: true, cellEditor: 'number' as const, type: 'number' as const },
    { field: 'unit', headerName: 'Birim', width: 80, editable: true, cellEditor: 'text' as const },
    { field: 'brand', headerName: 'Marka', width: 130, editable: true, cellEditor: 'text' as const },
    { field: 'brandCode', headerName: 'Marka Kodu', width: 120, editable: true, cellEditor: 'text' as const },
    { field: 'description1', headerName: 'Açıklama 1', width: 200, editable: true, cellEditor: 'text' as const },
    { field: 'description2', headerName: 'Açıklama 2', width: 180, editable: true, cellEditor: 'text' as const },
    { field: 'description3', headerName: 'Açıklama 3', width: 180, editable: true, cellEditor: 'text' as const },
  ];

  if (!isOpen) return null;

  // ─── Resize handle helper ──────────────────────────────────────────────────
  const ResizeHandle = ({ dir, className }: { dir: string; className: string }) => (
    <div
      className={`absolute z-[10] ${className}`}
      onMouseDown={(e) => onResizeMouseDown(e, dir)}
    />
  );

  const gridHeight = size.h - 96; // header(42) + footer(54)

  return createPortal(
    <>
      {/* Floating Window — no backdrop, background stays interactive */}
      <div
        className={`fixed z-[200000] flex flex-col rounded-xl shadow-2xl overflow-hidden border select-none ${
          isDarkMode ? 'bg-[#181818] border-[#2a2a2a]' : 'bg-white border-gray-300'
        }`}
        style={{ left: pos.x, top: pos.y, width: size.w, height: size.h }}
      >
        {/* ── Resize handles ─────────────────────────────────────────────── */}
        <ResizeHandle dir="n"  className="top-0 left-4 right-4 h-1 cursor-n-resize" />
        <ResizeHandle dir="s"  className="bottom-0 left-4 right-4 h-1 cursor-s-resize" />
        <ResizeHandle dir="e"  className="right-0 top-4 bottom-4 w-1 cursor-e-resize" />
        <ResizeHandle dir="w"  className="left-0 top-4 bottom-4 w-1 cursor-w-resize" />
        <ResizeHandle dir="ne" className="top-0 right-0 w-3 h-3 cursor-ne-resize" />
        <ResizeHandle dir="nw" className="top-0 left-0 w-3 h-3 cursor-nw-resize" />
        <ResizeHandle dir="se" className="bottom-0 right-0 w-3 h-3 cursor-se-resize" />
        <ResizeHandle dir="sw" className="bottom-0 left-0 w-3 h-3 cursor-sw-resize" />

        {/* ── Title bar (draggable) ──────────────────────────────────────── */}
        <div
          className={`flex items-center justify-between px-4 py-2.5 border-b shrink-0 cursor-move select-none ${
            isDarkMode ? 'bg-[#141414] border-[#2a2a2a]' : 'bg-gray-100 border-gray-200'
          }`}
          onMouseDown={onDragMouseDown}
        >
          <div className="flex items-center gap-2.5 pointer-events-none">
            <Package size={15} className={isDarkMode ? 'text-blue-400' : 'text-blue-600'} />
            <span className={`font-semibold text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              MALZEMELER
            </span>
            {allowedTypes.length > 0 && (
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${isDarkMode ? 'bg-[#252525] text-gray-400' : 'bg-gray-200 text-gray-500'}`}>
                Filtre: {allowedTypes.join(', ')}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 pointer-events-auto" onMouseDown={e => e.stopPropagation()}>
            {selectedRow && (
              <button
                onClick={() => confirmSelection(selectedRow)}
                className="flex items-center gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded transition-colors"
              >
                <Check size={12} /> Seçimi Onayla
              </button>
            )}
            <button
              onClick={onClose}
              className={`p-1 rounded transition-colors ${isDarkMode ? 'text-gray-400 hover:text-white hover:bg-[#333]' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200'}`}
              title="Kapat (ESC)"
            >
              <X size={15} />
            </button>
          </div>
        </div>
        <FeedbackBanner
          feedback={feedback}
          onClose={() => setFeedback(null)}
          isDarkMode={isDarkMode}
          className="mx-4 mt-3"
        />

        {/* ── Grid (full Materials page) ─────────────────────────────────── */}
        {/* Wrapper intercepts single-row clicks to set highlighted selection */}
        <div
          className="flex-1 overflow-hidden select-text relative"
          onMouseDown={e => e.stopPropagation()}
          onClick={(e) => {
            // Walk up the DOM to find a grid row element
            let el = e.target as HTMLElement | null;
            while (el && el !== e.currentTarget) {
              // UniversalDataGrid rows have a style with top positioning
              // We detect by checking if it's a direct child row div with height attr
              if (el.tagName === 'DIV' && el.dataset?.rowId) {
                const rowId = el.dataset.rowId;
                const found = data.find(d => String(d.id) === rowId);
                if (found) { setHighlightedRow(found); }
                break;
              }
              el = el.parentElement;
            }
          }}
        >
          <UniversalDataGrid
            gridId="material-selector-grid"
            isActive={isOpen && !modalState.isOpen && !confirmState.isOpen}
            initialData={data}
            initialColumns={columns}
            height={gridHeight}
            loading={loading}
            onAdd={handleAdd}
            onEdit={handleEdit}
            onInspect={handleInspect}
            onDelete={handleDelete}
            onDuplicate={handleDuplicate}
            onRefresh={fetchMaterials}
            onRowDoubleClick={(row) => confirmSelection(row as Material)}
            onSelectionChange={(rows) => {
              // Fallback: if selection changes via keyboard/other means, track it
              if (rows.length > 0) setHighlightedRow(rows[rows.length - 1] as Material);
              else setHighlightedRow(null);
            }}
            features={{
              enableGrouping: true,
              enableFiltering: true,
              enableSorting: true,
              enableEditing: false,
              enableSidebar: true,
              enableExport: true,
              enableSelection: false,
            }}
          />
        </div>

        {/* ── Footer ────────────────────────────────────────────────────────── */}
        <div
          className={`flex items-center justify-between px-4 py-2.5 border-t shrink-0 ${
            isDarkMode ? 'bg-[#141414] border-[#2a2a2a]' : 'bg-gray-100 border-gray-200'
          }`}
        >
          <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            {highlightedRow
              ? <span className={`font-medium ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>{highlightedRow.code} — {highlightedRow.name}</span>
              : 'Tek tıklayın (vurgula) veya çift tıklayın (anında seç)'}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className={`px-3 py-1.5 text-xs rounded transition-colors ${
                isDarkMode ? 'text-gray-400 hover:text-white hover:bg-[#252525]' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
              }`}
            >
              İptal
            </button>
            <button
              onClick={() => highlightedRow && confirmSelection(highlightedRow)}
              disabled={!highlightedRow}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold rounded transition-colors"
            >
              <Check size={12} /> Seçimi Onayla
            </button>
          </div>
        </div>
      </div>

      {/* ── Sub-modals ───────────────────────────────────────────────────────── */}
      <MaterialModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState(prev => ({ ...prev, isOpen: false }))}
        mode={modalState.mode}
        initialData={modalState.data}
        onSave={handleSave}
      />
      <ConfirmDialog
        isOpen={confirmState.isOpen}
        onConfirm={executeDelete}
        onCancel={() => setConfirmState({ isOpen: false, row: null })}
        title="Malzemeyi Sil"
        message={confirmState.row ? `"${confirmState.row.name}" adlı malzemeyi silmek istediğinize emin misiniz?` : ''}
        isDarkMode={isDarkMode}
      />
    </>,
    document.body
  );
}
