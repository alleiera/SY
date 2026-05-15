import React, { useState, useEffect, useCallback } from 'react';
import { UniversalDataGrid } from './UniversalDataGrid';
import { fetchProducts, saveProduct, deleteProduct } from '../services/productService';
import ProductModal from './ProductModal';
import ConfirmDialog from './ConfirmDialog';
import FeedbackBanner from './FeedbackBanner';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';

export default function Products({ isActive }) {
    const { theme } = useSettings();
    const { can } = useAuth();
    const isDarkMode = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    // Yetki kontrolleri
    const canManage = can('product.manage'); // Ekleme ve düzenleme
    const canDelete  = can('product.delete'); // Silme

    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const products = await fetchProducts();
            setData(products);
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const columns = [
        { field: 'select_col', headerName: '', width: 35, pinned: 'left', type: 'checkbox' },
        { field: 'code', headerName: 'Kod', width: 120, editable: true, cellEditor: 'text' },
        { field: 'productName', headerName: 'Ürün Adı', width: 200, editable: true, cellEditor: 'text' },
        { field: 'surface', headerName: 'Yüzey', width: 130, editable: true, cellEditor: 'text' },
        { field: 'group', headerName: 'Grup', width: 120, editable: true, cellEditor: 'text' },
        { field: 'hCode', headerName: 'H Kodu', width: 100, editable: true, cellEditor: 'text' },
        { field: 'brand', headerName: 'Marka', width: 120, editable: true, cellEditor: 'text' },
        { field: 'brandCode', headerName: 'Marka Kodu', width: 120, editable: true, cellEditor: 'text' },
        { field: 'description1', headerName: 'Açıklama 1', width: 180, editable: true, cellEditor: 'text' },
        { field: 'description2', headerName: 'Açıklama 2', width: 180, editable: true, cellEditor: 'text' },
        { field: 'description3', headerName: 'Açıklama 3', width: 180, editable: true, cellEditor: 'text' },
        { field: 'specialCode1', headerName: 'Özel Kod 1', width: 120, editable: true, cellEditor: 'text' },
        { field: 'specialCode2', headerName: 'Özel Kod 2', width: 120, editable: true, cellEditor: 'text' },
        { field: 'specialCode3', headerName: 'Özel Kod 3', width: 120, editable: true, cellEditor: 'text' },
        { field: 'specialCode4', headerName: 'Özel Kod 4', width: 120, editable: true, cellEditor: 'text' },
        { field: 'specialCode5', headerName: 'Özel Kod 5', width: 120, editable: true, cellEditor: 'text' },
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
            await saveProduct(formData, id);
            setModalState(prev => ({ ...prev, isOpen: false }));
            setFeedback({ type: 'success', message: id ? 'Ürün güncellendi.' : 'Ürün eklendi.' });
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
            await deleteProduct(row.id);
            setFeedback({ type: 'success', message: `"${row.productName}" silindi.` });
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
                gridId="products-master-grid"
                isActive={isActive}
                initialData={data}
                initialColumns={columns}
                height={gridHeight}
                loading={loading}
                onAdd={canManage ? handleAdd : undefined}
                onEdit={canManage ? handleEdit : undefined}
                onInspect={handleInspect}
                onDelete={canDelete ? handleDelete : undefined}
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
                <ProductModal
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
                title="Ürünü Sil"
                message={confirmState.row ? `"${confirmState.row.productName}" adlı ürünü silmek istediğinize emin misiniz? Bu işlem geri alınamaz.` : ''}
                isDarkMode={isDarkMode}
            />
        </div>
    );
}

