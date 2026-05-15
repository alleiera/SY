export interface GridFeatures {
    enableGrouping?: boolean;
    enableFiltering?: boolean;
    enableSorting?: boolean;
    enableEditing?: boolean;
    enableSidebar?: boolean;
    enableExport?: boolean;
    enableSelection?: boolean;
    enablePagination?: boolean;
    enableDarkModeToggle?: boolean;
}

export type CellEditorType = 'text' | 'textarea' | 'number' | 'date' | 'select' | 'largeText';

export interface Column {
    field: string;
    headerName: string;
    width: number;
    minWidth?: number;
    pinned?: 'left' | 'right' | null;
    type?: 'text' | 'number' | 'checkbox';
    visible?: boolean;
    editable?: boolean;
    cellEditor?: CellEditorType;
    cellRenderer?: (params: any) => React.ReactNode;
    cellEditorParams?: {
        options?: string[];
        min?: number;
        max?: number;
        maxLength?: number;
        rows?: number;
        cols?: number;
    };
}

export type FilterType = 'contains' | 'notContains' | 'equals' | 'notEquals' | 'startsWith' | 'endsWith';
export type Operator = 'AND' | 'OR';
export interface FilterCondition { type: FilterType; value: string; }
export interface ColumnFilterState { condition1: FilterCondition; condition2: FilterCondition; operator: Operator; isActive: boolean; }

export interface GroupRowData {
    isGroup: true;
    id: string;
    field: string;
    value: any;
    count: number;
    expanded: boolean;
    level: number;
    parentKey?: string;
}
export type GridRowData = any | GroupRowData;

export interface ContextMenuState {
    visible: boolean;
    x: number;
    y: number;
    rowIndex: number;
    colIndex: number;
    cellValue: any;
}

export interface UniversalDataGridProps {
    onDuplicate?: (row: any) => void;
}
