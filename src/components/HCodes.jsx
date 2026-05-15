import React, { useState, useEffect, useCallback } from 'react';
import { UniversalDataGrid } from './UniversalDataGrid';
import { fetchHCodes, saveHCode, deleteHCode } from '../services/hCodeService';
import HCodeModal from './HCodeModal';
import { useSettings } from '../context/SettingsContext';
import ConfirmDialog from './ConfirmDialog';
import FeedbackBanner from './FeedbackBanner';
import { useAuth } from '../context/AuthContext';

export default function HCodes({ isActive }) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    const { theme } = useSettings();
    const { can } = useAuth();
    const isDarkMode = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    // Yetki kontrolleri
    const canManage = can('hcode.manage');
    const canDelete  = can('hcode.delete');

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const codes = await fetchHCodes();
            setData(codes);
        } catch (error) {
            console.error('Error fetching h_codes:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const columns = [
        { field: 'select_col', headerName: '', width: 35, pinned: 'left', type: 'checkbox' },
        { field: 'baseColor', headerName: 'Taban Renk', width: 150, editable: true, cellEditor: 'text' },
        { field: 'code', headerName: 'H Kod', width: 150, editable: true, cellEditor: 'text' },
        { field: 'description', headerName: 'Açıklama', width: 300, editable: true, cellEditor: 'text' }
    ];

    const [gridHeight, setGridHeight] = useState(600);

    useEffect(() => {
        const handleResize = () => {
            // 100px offset roughly accounts for header/padding. Adjust if needed.
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

    const handleAdd = () => {
        setModalState({ isOpen: true, mode: 'add', data: null });
    };

    const handleEdit = (row) => {
        setModalState({ isOpen: true, mode: 'edit', data: row });
    };

    const handleInspect = (row) => {
        setModalState({ isOpen: true, mode: 'inspect', data: row });
    };

    const handleSave = async (formData) => {
        try {
            setLoading(true);
            setFeedback(null);
            const id = modalState.mode === 'edit' ? modalState.data.id : null;
            await saveHCode(formData, id);
            setModalState(prev => ({ ...prev, isOpen: false }));
            setFeedback({ type: 'success', message: id ? 'H kodu güncellendi.' : 'H kodu eklendi.' });
            fetchData();
        } catch (error) {
            console.error('Save error:', error);
            setFeedback({ type: 'error', message: 'Kaydetme hatası: ' + error.message });
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
            await deleteHCode(row.id);
            setFeedback({ type: 'success', message: `"${row.code}" silindi.` });
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
                gridId="hcodes-master-grid"
                isActive={isActive}
                initialData={data}
                initialColumns={columns}
                height={gridHeight}
                loading={loading}
                onAdd={canManage ? handleAdd : undefined}
                onEdit={canManage ? handleEdit : undefined}
                onInspect={handleInspect}
                onDelete={canDelete ? handleDelete : undefined}
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

            {/* Modal */}
            {modalState.isOpen && (
                <HCodeModal
                    key={`${modalState.mode}-${modalState.data?.id || 'new'}`}
                    isOpen={modalState.isOpen}
                    onClose={() => setModalState(prev => ({ ...prev, isOpen: false }))}
                    mode={modalState.mode}
                    initialData={modalState.data}
                    onSave={handleSave}
                    isDarkMode={isDarkMode}
                />
            )}

            <ConfirmDialog
                isOpen={confirmState.isOpen}
                onConfirm={executeDelete}
                onCancel={() => setConfirmState({ isOpen: false, row: null })}
                title="Kaydı Sil"
                message={confirmState.row ? `"${confirmState.row.code}" kodlu kaydı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.` : ''}
                isDarkMode={isDarkMode}
            />
        </div>
    );
}

