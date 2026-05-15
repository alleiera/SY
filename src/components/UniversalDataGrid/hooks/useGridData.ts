import { useState, useMemo, useCallback } from 'react';
import { ColumnFilterState, GridFeatures } from '../types';
import { filterAndSortData, buildGroupedData } from '../dataProcessing';

export function useGridData({
    data,
    features,
    globalSearchText,
    searchableColumns,
    expandedGroups,
    setExpandedGroups
}: {
    data: any[],
    features: GridFeatures,
    globalSearchText: string,
    searchableColumns: string[],
    expandedGroups: Set<string>,
    setExpandedGroups: React.Dispatch<React.SetStateAction<Set<string>>>
}) {
    const [groupBy, setGroupBy] = useState<string[]>([]);
    const [filters, setFilters] = useState<Record<string, ColumnFilterState>>({});
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

    const filteredData = useMemo(() => {
        return filterAndSortData({
            data,
            filters,
            enableFiltering: features.enableFiltering ?? false,
            sortConfig,
            enableSorting: features.enableSorting ?? false,
            globalSearchText,
            searchableColumns
        });
    }, [data, filters, sortConfig, features.enableFiltering, features.enableSorting, globalSearchText, searchableColumns]);

    const processedData = useMemo(() => buildGroupedData({
        data: filteredData,
        groupBy,
        expandedGroups,
        enableGrouping: features.enableGrouping ?? false
    }), [filteredData, groupBy, expandedGroups, features.enableGrouping]);

    const toggleGroup = useCallback((groupId: string) => { 
        const newExpanded = new Set(expandedGroups); 
        if (newExpanded.has(groupId)) newExpanded.delete(groupId); 
        else newExpanded.add(groupId); 
        setExpandedGroups(newExpanded); 
    }, [expandedGroups, setExpandedGroups]);

    const handleAddGroupBy = useCallback((field: string, onAdd?: () => void) => { 
        if (features.enableGrouping && !groupBy.includes(field)) { 
            setGroupBy(prev => [...prev, field]); 
            setExpandedGroups(new Set()); 
        } 
        if (onAdd) onAdd();
    }, [features.enableGrouping, groupBy, setExpandedGroups]);

    const handleRemoveGroupBy = useCallback((field: string) => { 
        setGroupBy(prev => prev.filter(f => f !== field)); 
        setExpandedGroups(new Set()); 
    }, [setExpandedGroups]);

    const handleHeaderDoubleClick = useCallback((colField: string) => { 
        if (!features.enableSorting) return; 
        let direction: 'asc' | 'desc' | null = 'asc'; 
        if (sortConfig && sortConfig.key === colField) { 
            if (sortConfig.direction === 'asc') direction = 'desc'; 
            else direction = null; 
        } 
        setSortConfig(direction ? { key: colField, direction } : null); 
    }, [features.enableSorting, sortConfig]);

    return {
        groupBy, setGroupBy,
        filters, setFilters, 
        sortConfig, setSortConfig,
        filteredData, processedData,
        toggleGroup, handleAddGroupBy, handleRemoveGroupBy, handleHeaderDoubleClick
    };
}
