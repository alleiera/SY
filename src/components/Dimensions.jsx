import React, { useState, useEffect, useCallback } from 'react';
import { UniversalDataGrid } from './UniversalDataGrid';
import { useSettings } from '../context/SettingsContext';
import { fetchDimensions, saveDimension, deleteDimension } from '../services/dimensionService';
import DimensionModal from './DimensionModal';
import ConfirmDialog from './ConfirmDialog';
import FeedbackBanner from './FeedbackBanner';
import { useAuth } from '../context/AuthContext';

export default function Dimensions({ isActive }) {
    const { theme } = useSettings();
    const { can } = useAuth();
    const isDarkMode = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    // Yetki kontrolleri
    const canManage = can('dimension.manage');
    const canDelete  = can('dimension.delete');

    const [activeTab, setActiveTab] = useState('tab1');
    const [gridHeight, setGridHeight] = useState(600);

    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    const [modalState, setModalState] = useState({
        isOpen: false,
        mode: 'add',
        data: null
    });

    const [confirmState, setConfirmState] = useState({
        isOpen: false,
        row: null
    });
    const [feedback, setFeedback] = useState(null);


    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const records = await fetchDimensions(activeTab);
            setData(records);
        } catch (error) {
            console.error('Error fetching dimensions:', error);
        } finally {
            setLoading(false);
        }
    }, [activeTab]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        const handleResize = () => setGridHeight(window.innerHeight - 130);
        handleResize(); // Init periodically
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const columns = [
        { field: 'select_col', headerName: '', width: 35, pinned: 'left', type: 'checkbox' },
        { field: 'olcu', headerName: activeTab === 'tab4' ? 'Yüzey Adı' : (activeTab === 'tab5' ? 'Malzeme Türü' : 'Ölçü'), width: 150, editable: false },
        ...((activeTab !== 'tab4' && activeTab !== 'tab5') ? [{ field: 'olcuBirimi', headerName: 'Ölçü Birimi', width: 100, editable: false }] : []),
        { field: 'olcuKodu', headerName: activeTab === 'tab4' ? 'Yüzey Kodu' : (activeTab === 'tab5' ? 'Tür Kısaltması' : 'Ölçü Kodu'), width: 120, editable: false },
        ...(activeTab === 'tab5' ? [{ field: 'malzemeGrubu', headerName: 'Malzeme Grubu', width: 140, editable: false }] : []),
        { field: 'aciklama1', headerName: 'Açıklama 1', width: 200, editable: false },
        { field: 'aciklama2', headerName: 'Açıklama 2', width: 200, editable: false },
        { field: 'aciklama3', headerName: 'Açıklama 3', width: 200, editable: false }
    ];

    const handleAdd = () => setModalState({ isOpen: true, mode: 'add', data: null });
    const handleEdit = (row) => setModalState({ isOpen: true, mode: 'edit', data: row });
    const handleInspect = (row) => setModalState({ isOpen: true, mode: 'inspect', data: row });
    
    const handleDuplicate = (row) => {
        const copyRow = { ...row };
        delete copyRow.id; // clear ID so it's treated as new
        setModalState({ isOpen: true, mode: 'add', data: copyRow });
    };

    const handleSave = async (formData) => {
        try {
            setLoading(true);
            setFeedback(null);
            const id = modalState.mode === 'edit' ? modalState.data.id : null;
            await saveDimension(formData, activeTab, id);
            setModalState(prev => ({ ...prev, isOpen: false }));
            setFeedback({ type: 'success', message: id ? 'Kayıt güncellendi.' : 'Kayıt eklendi.' });
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
            await deleteDimension(row.id, activeTab);
            setFeedback({ type: 'success', message: 'Kayıt silindi.' });
            fetchData();
        } catch (error) {
            console.error('Delete error:', error);
            setFeedback({ type: 'error', message: 'Silme hatası: ' + error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full w-full relative">
            <FeedbackBanner
                feedback={feedback}
                onClose={() => setFeedback(null)}
                isDarkMode={isDarkMode}
                className="absolute top-2 left-1/2 -translate-x-1/2 z-20"
            />
            {/* TABS HEADER */}
            <div className={`flex border-b px-2 pt-2 gap-1 z-10 ${isDarkMode ? 'border-[#2a2a2a] bg-[#181818]' : 'border-gray-300 bg-gray-100'}`}>
                {[
                    { id: 'tab1', label: 'PVC Genişlik' },
                    { id: 'tab2', label: 'Bobin Genişlik' },
                    { id: 'tab3', label: 'Kalınlık' },
                    { id: 'tab4', label: 'Yüzeyler' },
                    { id: 'tab5', label: 'Malzeme Türleri' }
                ].map((tab) => {
                    const isActiveTab = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2 text-xs font-bold rounded-t-md transition-colors border-t border-x ${
                                isActiveTab 
                                    ? (isDarkMode ? 'bg-[#1f1f1f] text-blue-400 border-[#2a2a2a] border-b-transparent' : 'bg-white text-blue-600 border-gray-300 border-b-transparent') 
                                    : (isDarkMode ? 'bg-transparent text-gray-500 border-transparent hover:bg-white/5' : 'bg-transparent text-gray-500 border-transparent hover:bg-black/5')
                            } relative`}
                            style={{ marginBottom: isActiveTab ? '-1px' : '0' }}
                        >
                            {tab.label}
                        </button>
                    )
                })}
            </div>
            
            {/* TAB CONTENT (GRID) */}
            <div className={`flex-1 w-full relative ${isDarkMode ? 'bg-[#1f1f1f]' : 'bg-white'}`}>
                 <UniversalDataGrid
                    gridId={`dimensions-grid-${activeTab}`}
                    key={activeTab} // Using key to force remount of grid so active editing/sorting states reset when tab changes
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
                        enableEditing: false, // In-grid edit disabled because modal is used
                        enableSidebar: true,
                        enableExport: true,
                        enableSelection: true
                    }}
                />
            </div>

            {modalState.isOpen && (
                <DimensionModal
                    key={`${activeTab}-${modalState.mode}-${modalState.data?.id || 'new'}`}
                    isOpen={modalState.isOpen}
                    onClose={() => setModalState(prev => ({ ...prev, isOpen: false }))}
                    mode={modalState.mode}
                    activeTab={activeTab}
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
                message={`Bu kaydı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
                isDarkMode={isDarkMode}
            />
        </div>
    );
}
