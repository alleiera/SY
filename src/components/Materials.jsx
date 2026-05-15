import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { UniversalDataGrid } from './UniversalDataGrid';
import { fetchMaterials, saveMaterial, deleteMaterial, isMaterialCodeDuplicate } from '../services/materialService';
import MaterialModal from './MaterialModal';
import ConfirmDialog from './ConfirmDialog';
import FeedbackBanner from './FeedbackBanner';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { useRibbonStore } from '../store/ribbonStore';
import { Plus, RefreshCw, Trash2, Copy, FileSpreadsheet } from 'lucide-react';

export default function Materials({ isActive, winId }) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    const { theme } = useSettings();
    const { can } = useAuth();
    const isDarkMode = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    // Yetki kontrolleri
    const canManage = can('material.manage');
    const canDelete  = can('material.delete');

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const materials = await fetchMaterials();
            setData(materials);
        } catch (error) {
            console.error('Unexpected error:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const columns = useMemo(() => [
        { field: 'select_col', headerName: '', width: 35, pinned: 'left', type: 'checkbox' },
        { field: 'type', headerName: 'Tür', width: 130, editable: true, cellEditor: 'text' },
        { field: 'code', headerName: 'Kod', width: 120, editable: true, cellEditor: 'text' },
        { field: 'name', headerName: 'Ürün Adı', width: 220, editable: true, cellEditor: 'text' },
        { field: 'quantity', headerName: 'Miktar', width: 100, editable: true, cellEditor: 'number', type: 'number' },
        { field: 'unit', headerName: 'Birim', width: 100, editable: true, cellEditor: 'text' },
        { field: 'brand', headerName: 'Marka', width: 130, editable: true, cellEditor: 'text' },
        { field: 'brandCode', headerName: 'Marka Kodu', width: 120, editable: true, cellEditor: 'text' },
        { field: 'description1', headerName: 'Açıklama 1', width: 180, editable: true, cellEditor: 'text' },
        { field: 'description2', headerName: 'Açıklama 2', width: 180, editable: true, cellEditor: 'text' },
        { field: 'description3', headerName: 'Açıklama 3', width: 180, editable: true, cellEditor: 'text' }
    ], []);

    const [gridHeight, setGridHeight] = useState(600);

    useEffect(() => {
        const handleResize = () => {
            setGridHeight(window.innerHeight - 100);
        };
        handleResize(); // Init
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const [modalState, setModalState] = useState({
        isOpen: false,
        mode: 'add', // 'add' | 'edit' | 'inspect'
        data: null
    });

    const [confirmState, setConfirmState] = useState({
        isOpen: false,
        row: null
    });
    const [feedback, setFeedback] = useState(null);

    const handleAdd = useCallback(() => {
        setModalState({ isOpen: true, mode: 'add', data: null });
    }, []);

    const handleEdit = useCallback((row) => {
        setModalState({ isOpen: true, mode: 'edit', data: row });
    }, []);

    const handleInspect = useCallback((row) => {
        setModalState({ isOpen: true, mode: 'inspect', data: row });
    }, []);

    const handleDuplicate = useCallback((row) => {
        const copyRow = { ...row };
        delete copyRow.id; // clear ID so it's treated as new
        setModalState({ isOpen: true, mode: 'add', data: copyRow });
    }, []);

    const handleExport = useCallback(() => {
        if (!data || data.length === 0) return;
        const exportCols = columns.filter(c => c.field !== 'select_col');
        const headers = exportCols.map(c => c.headerName).join(',');
        const rows = data.map(row => 
            exportCols.map(c => `"${(row[c.field] || '').toString().replace(/"/g, '""')}"`).join(',')
        );
        const csvContent = [headers, ...rows].join('\n');
        const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'malzemeler.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, [data, columns]);

    // Ribbon Registration
    const setRibbon = useRibbonStore(state => state.setRibbon);
    const removeRibbon = useRibbonStore(state => state.removeRibbon);

    useEffect(() => {
        if (!winId) return;

        setRibbon(winId, {
            tabs: [
                {
                    id: 'home',
                    label: 'Stok Yönetimi',
                    groups: [
                        {
                            id: 'actions',
                            items: [
                                { id: 'add', label: 'Yeni Malzeme', icon: Plus, onClick: handleAdd, disabled: false },
                                { id: 'refresh', label: 'Yenile', icon: RefreshCw, onClick: fetchData, disabled: false }
                            ]
                        },
                        {
                            id: 'export',
                            items: [
                                { id: 'excel', label: 'Excel\'e Aktar', icon: FileSpreadsheet, disabled: data.length === 0, onClick: handleExport }
                            ]
                        }
                    ]
                }
            ]
        });

        return () => removeRibbon(winId);
    }, [winId, handleAdd, fetchData, handleExport, data.length, setRibbon, removeRibbon]);

    const handleSave = async (formData) => {
        try {
            setLoading(true);
            setFeedback(null);

            // Mükerrer kod kontrolü servise delege edildi
            const isDuplicate = await isMaterialCodeDuplicate(
                formData.code,
                modalState.mode === 'edit' ? modalState.data.id : null
            );
            if (isDuplicate) {
                setFeedback({ type: 'error', message: `"${formData.code}" kodu zaten kayıtlı. Lütfen farklı bir malzeme kodu girin.` });
                return;
            }

            const id = modalState.mode === 'edit' ? modalState.data.id : null;
            await saveMaterial(formData, id);
            setModalState(prev => ({ ...prev, isOpen: false }));
            setFeedback({ type: 'success', message: id ? 'Malzeme güncellendi.' : 'Malzeme eklendi.' });
            fetchData();

        } catch (error) {
            console.error('Save error:', error);
            if (error.code === '42P01') {
                setFeedback({ type: 'error', message: 'Veritabanında "materials" tablosu bulunamadı. Kurulum adımlarını kontrol edin.' });
            } else {
                setFeedback({ type: 'error', message: 'Kaydetme hatası: ' + error.message });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (row) => {
        setConfirmState({ isOpen: true, row });
    };

    const executeDelete = async () => {
        const row = confirmState.row;
        setConfirmState({ isOpen: false, row: null });
        if (!row) return;
        try {
            setLoading(true);
            await deleteMaterial(row.id);
            setFeedback({ type: 'success', message: `"${row.name}" silindi.` });
            fetchData();
        } catch (error) {
            console.error('Delete error:', error);
            setFeedback({ type: 'error', message: 'Silme hatası: ' + error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-full w-full relative">
            <FeedbackBanner
                feedback={feedback}
                onClose={() => setFeedback(null)}
                isDarkMode={isDarkMode}
                className="absolute top-2 left-1/2 -translate-x-1/2 z-20"
            />
            <UniversalDataGrid
                gridId="materials-master-grid"
                isActive={isActive}
                initialData={data}
                initialColumns={columns}
                height={gridHeight}
                loading={loading}
                onAdd={canManage ? handleAdd : undefined}
                onEdit={canManage ? handleEdit : undefined}
                onInspect={handleInspect}
                onDelete={canDelete ? handleDelete : undefined}
                onDuplicate={canManage ? handleDuplicate : undefined}
                onRefresh={fetchData}
                features={{
                    enableGrouping: true,
                    enableFiltering: true,
                    enableSorting: true,
                    enableEditing: false,
                    enableSidebar: true,
                    enableExport: true,
                    enableSelection: true
                }}
            />

            {modalState.isOpen && (
                <MaterialModal
                    key={`${modalState.mode}-${modalState.data?.id || 'new'}`}
                    isOpen={modalState.isOpen}
                    onClose={() => setModalState(prev => ({ ...prev, isOpen: false }))}
                    mode={modalState.mode}
                    initialData={modalState.data}
                    onSave={handleSave}
                />
            )}

            <ConfirmDialog
                isOpen={confirmState.isOpen}
                onConfirm={executeDelete}
                onCancel={() => setConfirmState({ isOpen: false, row: null })}
                title="Malzemeyi Sil"
                message={confirmState.row ? `"${confirmState.row.name}" adlı malzemeyi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.` : ''}
                isDarkMode={isDarkMode}
            />
        </div>
    );
}
