import { ColumnFilterState, FilterCondition, GridRowData } from './types';

export const checkCondition = (cellValue: any, condition: FilterCondition): boolean => {
    if (!condition.value) {
        return true;
    }

    const val = String(cellValue).toLocaleLowerCase('tr-TR');
    const search = condition.value.toLocaleLowerCase('tr-TR');

    switch (condition.type) {
        case 'contains':
            return val.includes(search);
        case 'notContains':
            return !val.includes(search);
        case 'equals':
            return val === search;
        case 'notEquals':
            return val !== search;
        case 'startsWith':
            return val.startsWith(search);
        case 'endsWith':
            return val.endsWith(search);
        default:
            return true;
    }
};

export const filterAndSortData = ({
    data,
    filters,
    enableFiltering,
    sortConfig,
    enableSorting,
    globalSearchText,
    searchableColumns
}: {
    data: any[];
    filters: Record<string, ColumnFilterState>;
    enableFiltering: boolean;
    sortConfig: { key: string; direction: 'asc' | 'desc' } | null;
    enableSorting: boolean;
    globalSearchText: string;
    searchableColumns: string[];
}) => {
    let result = [...data];

    if (enableFiltering) {
        Object.keys(filters).forEach((key) => {
            const filter = filters[key];
            if (filter && filter.isActive) {
                result = result.filter((row) => {
                    const cellValue = row[key];
                    const pass1 = checkCondition(cellValue, filter.condition1);
                    const pass2 = filter.condition2.value ? checkCondition(cellValue, filter.condition2) : true;

                    return filter.operator === 'AND'
                        ? (filter.condition2.value ? pass1 && pass2 : pass1)
                        : (filter.condition2.value ? pass1 || pass2 : pass1);
                });
            }
        });
    }

    if (globalSearchText && searchableColumns.length > 0) {
        const lowerQuery = globalSearchText.toLocaleLowerCase('tr-TR');
        result = result.filter((row) =>
            searchableColumns.some((colField) =>
                String(row[colField] ?? '').toLocaleLowerCase('tr-TR').includes(lowerQuery)
            )
        );
    }

    if (enableSorting && sortConfig) {
        result.sort((a, b) => {
            const valA = String(a[sortConfig.key] ?? '');
            const valB = String(b[sortConfig.key] ?? '');
            const comparison = valA.localeCompare(valB, 'tr-TR', { numeric: true, sensitivity: 'base' });
            return sortConfig.direction === 'asc' ? comparison : -comparison;
        });
    }

    return result;
};

export const buildGroupedData = ({
    data,
    groupBy,
    expandedGroups,
    enableGrouping
}: {
    data: any[];
    groupBy: string[];
    expandedGroups: Set<string>;
    enableGrouping: boolean;
}): GridRowData[] => {
    if (!enableGrouping || groupBy.length === 0) {
        return data;
    }

    const buildTree = (currentData: any[], level: number, parentKey = 'root'): GridRowData[] => {
        if (level >= groupBy.length) {
            return currentData;
        }

        const currentGroupField = groupBy[level];
        const groups = new Map<string, any[]>();

        currentData.forEach((row) => {
            const value = row[currentGroupField];
            const key = typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value);
            if (!groups.has(key)) {
                groups.set(key, []);
            }
            groups.get(key)?.push(row);
        });

        let result: GridRowData[] = [];

        Array.from(groups.keys()).sort().forEach((key) => {
            const groupRows = groups.get(key) || [];
            const groupValue = groupRows[0][currentGroupField];
            const uniqueKey = `${parentKey}-${level}-${key}`;
            const isExpanded = expandedGroups.has(uniqueKey);

            result.push({
                isGroup: true,
                id: uniqueKey,
                field: currentGroupField,
                value: groupValue,
                count: groupRows.length,
                expanded: isExpanded,
                level,
                parentKey
            });

            if (isExpanded) {
                result = result.concat(buildTree(groupRows, level + 1, uniqueKey));
            }
        });

        return result;
    };

    return buildTree(data, 0);
};
