import React, { useMemo } from 'react';
import { UniversalDataGrid } from './UniversalDataGrid';

export default function Surfaces({ isActive }) {
    const data = useMemo(() => [], []);

    const columns = [
        { field: 'select_col', headerName: '', width: 35, pinned: 'left', type: 'checkbox' },
        { field: 'id', headerName: 'ID', width: 70 },
        { field: 'surfaceCode', headerName: 'Yüzey Kodu', width: 150, editable: true, cellEditor: 'text' },
        { field: 'surfaceName', headerName: 'Yüzey Adı', width: 200, editable: true, cellEditor: 'text' },
        { field: 'texture', headerName: 'Doku', width: 150, editable: true, cellEditor: 'select', cellEditorParams: { options: ['Düz', 'Pürüzlü', 'Desenli'] } }
    ];

    return (
        <div className="flex h-full w-full">
            <UniversalDataGrid
                gridId="surfaces-master-grid"
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
                    enableSelection: true
                }}
            />
        </div>
    );
}
