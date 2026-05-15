import React, { useMemo } from 'react';
import { UniversalDataGrid } from './UniversalDataGrid';

export default function ChartColors({ isActive }) {
    const data = useMemo(() => [], []);

    const columns = [
        { field: 'select_col', headerName: '', width: 35, pinned: 'left', type: 'checkbox' },
        { field: 'id', headerName: 'ID', width: 70 },
        { field: 'colorCode', headerName: 'Renk Kodu', width: 150, editable: true, cellEditor: 'text' },
        { field: 'colorName', headerName: 'Renk Adı', width: 200, editable: true, cellEditor: 'text' },
        { field: 'hex', headerName: 'Hex Kodu', width: 150, editable: true, cellEditor: 'text' }
    ];

    return (
        <div className="flex h-full w-full">
            <UniversalDataGrid
                gridId="chart-colors-master-grid"
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
