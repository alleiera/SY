import { Column } from './types';

export const buildDefaultColumns = (initialColumns: Column[]): Column[] =>
    initialColumns.map((column) => ({ ...column, visible: column.visible !== false }));

export const loadColumnsFromStorage = (initialColumns: Column[], gridId: string): Column[] => {
    const defaultColumns = buildDefaultColumns(initialColumns);

    if (!gridId) {
        return defaultColumns;
    }

    try {
        const savedStr = localStorage.getItem(`grid_state_${gridId}`);
        if (!savedStr) {
            return defaultColumns;
        }

        const savedState = JSON.parse(savedStr);
        const oldMap = new Map(defaultColumns.map((column) => [column.field, column]));
        const merged: Column[] = [];

        savedState.forEach((savedCol: { field: string; width: number; visible: boolean }) => {
            const currentColumn = oldMap.get(savedCol.field);
            if (currentColumn) {
                merged.push({
                    ...currentColumn,
                    width: savedCol.width,
                    visible: savedCol.visible
                });
                oldMap.delete(savedCol.field);
            }
        });

        for (const [, column] of oldMap) {
            merged.push(column);
        }

        return merged;
    } catch (error) {
        console.error('Grid load error', error);
        return defaultColumns;
    }
};

export const mergeColumnsWithDefinitions = (currentColumns: Column[], initialColumns: Column[]): Column[] => {
    if (currentColumns.length === 0) {
        return buildDefaultColumns(initialColumns);
    }

    const prevMap = new Map(currentColumns.map((column) => [column.field, column]));
    const existingCount = initialColumns.filter((column) => prevMap.has(column.field)).length;

    if (existingCount < initialColumns.length / 2) {
        return buildDefaultColumns(initialColumns);
    }

    const merged: Column[] = [];

    currentColumns.forEach((column) => {
        const updatedDef = initialColumns.find((candidate) => candidate.field === column.field);
        if (updatedDef) {
            merged.push({
                ...updatedDef,
                width: column.width,
                visible: column.visible
            });
        }
    });

    initialColumns.forEach((column) => {
        if (!prevMap.has(column.field)) {
            merged.push({ ...column, visible: column.visible !== false });
        }
    });

    return merged;
};

export const saveColumnsToStorage = (columns: Column[], gridId: string) => {
    if (!gridId || columns.length === 0) {
        return;
    }

    const stateToSave = columns.map((column) => ({
        field: column.field,
        width: column.width,
        visible: column.visible
    }));

    localStorage.setItem(`grid_state_${gridId}`, JSON.stringify(stateToSave));
};

export const loadSearchableColumnsFromStorage = (initialColumns: Column[]) => {
    const storageKey = 'grid_search_cols';

    try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
            return JSON.parse(saved);
        }
    } catch (error) {
        console.error('Grid search column load error', error);
    }

    return initialColumns
        .filter((column) => column.type !== 'checkbox')
        .map((column) => column.field);
};

export const saveSearchableColumnsToStorage = (columns: string[]) => {
    localStorage.setItem('grid_search_cols', JSON.stringify(columns));
};
