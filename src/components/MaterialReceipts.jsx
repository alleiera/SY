import React, { useMemo } from 'react';
import { UniversalDataGrid } from './UniversalDataGrid';

export default function MaterialReceipts({ isActive }) {
    const data = useMemo(() => [], []);

    const columns = [
        { field: 'select_col', headerName: '', width: 35, pinned: 'left', type: 'checkbox' },
        { field: 'drag_col', headerName: '', width: 30, pinned: 'left', type: 'drag' },
        { field: 'id', headerName: 'ID', width: 70, pinned: 'left' },
        { field: 'receiptNo', headerName: 'Fiş No', width: 140, editable: true, cellEditor: 'text' },
        { field: 'date', headerName: 'Tarih', width: 120, editable: true, cellEditor: 'date' },
        { field: 'materialCode', headerName: 'Malzeme Kodu', width: 140, editable: true, cellEditor: 'text' },
        { field: 'materialName', headerName: 'Malzeme Adı', width: 180, editable: true, cellEditor: 'text' },
        { field: 'type', headerName: 'Tip', width: 100, editable: true, cellEditor: 'select', cellEditorParams: { options: ['Giriş', 'Çıkış'] } },
        { field: 'quantity', headerName: 'Miktar', width: 120, editable: true, cellEditor: 'number', type: 'number' },
        { field: 'supplier', headerName: 'Tedarikçi', width: 150, editable: true, cellEditor: 'text' },
        { field: 'warehouse', headerName: 'Depo', width: 130, editable: true, cellEditor: 'text' },
        { field: 'notes', headerName: 'Notlar', width: 250, editable: true, cellEditor: 'largeText', cellEditorParams: { maxLength: 500 } },
    ];

    return (
        <div className="flex h-full w-full">
            <UniversalDataGrid
                gridId="material-receipts-master-grid"
                isActive={isActive}
                initialData={data}
                initialColumns={columns}
                height={600}
                features={{
                    enableGrouping: true,
                    enableFiltering: true,
                    enableSorting: true,
                    enableEditing: false,
                    enableSidebar: true,
                    enableExport: true,
                    enableSelection: true,
                    enableRowDrag: true
                }}
            />
        </div>
    );
}
