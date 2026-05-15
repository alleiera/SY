import React from 'react';
import { ChevronDown, ChevronRight, Layers } from 'lucide-react';
import { Column } from '../types';
import { formatNumberTR } from '../utils';
import { CellEditor } from './Editors'; // make sure to import appropriately

// --- GRID CELL (MEMOIZED) ---
export const GridCell = React.memo(({
    rowId,
    columnIndex,
    actualIndex,
    col,
    cellValue,
    style,
    isSelected,
    isFocused,
    isEditing,
    startKey,
    isDarkMode,
    cellBgClass,
    textClass,
    paddingClass,
    handleMouseDown,
    handleMouseEnter,
    handleCellDoubleClick,
    handleCellUpdate,
    cancelEditing,
    features,
    selectedRowIds,
    handleRowSelect
}: any) => {
    let displayVal: React.ReactNode = String(cellValue ?? '');

    if (col.cellRenderer && !isEditing) {
        displayVal = col.cellRenderer({ value: cellValue, colDef: col });
    } else if (col.type === 'number' && !isEditing) {
        displayVal = formatNumberTR(cellValue);
    } else if (col.type === 'checkbox' && features?.enableSelection) {
        displayVal = (
            <div className="flex items-center justify-center w-full h-full" onMouseDown={e => e.stopPropagation()}>
                <input
                    type="checkbox"
                    className="w-3.5 h-3.5 cursor-pointer accent-blue-600"
                    checked={selectedRowIds?.has(rowId)}
                    onChange={() => handleRowSelect(rowId)}
                />
            </div>
        );
    }

    return (
        <div
            className={`${paddingClass} flex items-center border-r ${isDarkMode ? 'border-[#2a2a2a]' : 'border-gray-100'} overflow-hidden whitespace-nowrap transition-colors select-none flex-shrink-0 relative ${cellBgClass} ${textClass}`}
            style={style}
            onContextMenu={(e) => e.stopPropagation()}
            onMouseDown={(e) => {
                e.stopPropagation();
                handleMouseDown(actualIndex, columnIndex, e);
            }}
            onMouseEnter={() => handleMouseEnter(actualIndex, columnIndex)}
            onDoubleClick={() => handleCellDoubleClick(actualIndex, columnIndex)}
        >
            {isEditing ? (
                <CellEditor
                    initialValue={cellValue}
                    col={col}
                    onSave={handleCellUpdate}
                    onCancel={cancelEditing}
                    startKey={startKey}
                    isDarkMode={isDarkMode}
                />
            ) : (
                displayVal
            )}
            {!isEditing && isFocused && (
                <div className="absolute inset-0 border-2 border-gray-400 pointer-events-none z-50" style={{ boxShadow: '0 0 0 1px rgba(255, 255, 255, 0.1)' }} />
            )}
        </div>
    );
});

// --- GRID ROW (MEMOIZED) ---
export const GridRow = React.memo(({
    row,
    actualIndex,
    columns,
    activeRowHeight,
    totalColumnWidth,
    isDarkMode,
    globalZebra,
    getColumnStyles,
    isCellSelected,
    selectionStart,
    editingCell,
    features,
    selectedRowIds,
    handleMouseDown,
    handleMouseEnter,
    handleCellDoubleClick,
    handleCellUpdate,
    cancelEditing,
    handleRowSelect
}: any) => {
    const isRowChecked = selectedRowIds?.has(row.id);
    const isRowFocused = selectionStart && selectionStart.row === actualIndex;

    let rowBgClass = "";
    if (isRowChecked) {
        rowBgClass = isDarkMode ? "bg-[#252525]" : "bg-blue-50";
    } else if (isRowFocused) {
        rowBgClass = isDarkMode ? "bg-[#2a2a2a]" : "bg-blue-50";
    } else {
        const isEven = globalZebra !== false && actualIndex % 2 === 0;
        const useZebra = globalZebra !== false;

        if (isDarkMode) {
            if (!useZebra) {
                rowBgClass = "bg-[#181818] group-hover:bg-[#252525]";
            } else {
                rowBgClass = isEven ? "bg-[#181818] group-hover:bg-[#252525]" : "bg-[#1e1e1e] group-hover:bg-[#252525]";
            }
        } else {
            if (!useZebra) {
                rowBgClass = "bg-white group-hover:bg-gray-100";
            } else {
                rowBgClass = isEven ? "bg-white group-hover:bg-gray-100" : "bg-gray-50 group-hover:bg-gray-200";
            }
        }
    }

    return (
        <div
            className={`group flex absolute border-b ${isDarkMode ? 'border-[#2a2a2a]' : 'border-gray-100'} ${rowBgClass}`}
            data-row-id={String(row.id)}
            style={{
                height: activeRowHeight,
                top: actualIndex * activeRowHeight,
                minWidth: '100%',
                width: totalColumnWidth
            }}
        >
            {columns.map((col: Column, index: number) => {
                const style = getColumnStyles(col, index, false);
                const isSelected = isCellSelected(actualIndex, index);
                const isFocusedCell = selectionStart?.row === actualIndex && selectionStart?.col === index;
                const isEditing = editingCell && editingCell.id === row.id && editingCell.field === col.field;
                const isSpecialCol = col.type === 'checkbox';
                const paddingClass = isSpecialCol ? 'p-0' : 'px-3';

                let cellBgClass = "";
                if (isSelected) {
                    cellBgClass = isDarkMode ? "bg-[#2a2a2a]" : "bg-blue-50";
                } else if (col.pinned) {
                    cellBgClass = rowBgClass;
                }

                const textClass = isDarkMode ? "text-gray-300" : "text-gray-700";

                return (
                    <GridCell
                        key={`${actualIndex}-${col.field}`}
                        rowId={row.id}
                        columnIndex={index}
                        actualIndex={actualIndex}
                        col={col}
                        cellValue={row[col.field]}
                        style={style}
                        isSelected={isSelected}
                        isFocused={isFocusedCell}
                        isEditing={isEditing}
                        startKey={editingCell?.startKey}
                        isDarkMode={isDarkMode}
                        cellBgClass={cellBgClass}
                        textClass={textClass}
                        paddingClass={paddingClass}
                        handleMouseDown={handleMouseDown}
                        handleMouseEnter={handleMouseEnter}
                        handleCellDoubleClick={handleCellDoubleClick}
                        handleCellUpdate={handleCellUpdate}
                        cancelEditing={cancelEditing}
                        features={features}
                        selectedRowIds={selectedRowIds}
                        handleRowSelect={handleRowSelect}
                    />
                );
            })}
        </div>
    );
});

// --- GROUP ROW (MEMOIZED) ---
export const GroupRow = React.memo(({
    row,
    actualIndex,
    activeRowHeight,
    totalColumnWidth,
    isDarkMode,
    columns,
    toggleGroup
}: any) => {
    const colDef = columns.find((c: Column) => c.field === row.field);
    
    let displayValue: React.ReactNode = row.value;
    if (colDef && colDef.cellRenderer) {
        displayValue = colDef.cellRenderer({ value: row.value, colDef });
    } else if (Array.isArray(row.value)) {
        displayValue = row.value.map((v: any) => typeof v === 'object' ? (v.name || JSON.stringify(v)) : String(v)).join(', ');
    } else if (typeof row.value === 'object' && row.value !== null) {
        displayValue = row.value.name || JSON.stringify(row.value);
    }

    return (
        <div
            className={`group flex absolute border-b cursor-pointer font-medium select-none z-10 ${isDarkMode ? 'border-[#2a2a2a] bg-[#1f1f1f] hover:bg-[#252525] text-gray-200' : 'border-gray-200 bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
            style={{
                height: activeRowHeight,
                top: actualIndex * activeRowHeight,
                minWidth: '100%',
                width: totalColumnWidth
            }}
            onClick={() => toggleGroup(row.id)}
            onContextMenu={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
        >
            <div className={`flex items-center justify-center border-r sticky left-0 z-[25] ${isDarkMode ? 'border-[#2a2a2a] bg-[#1f1f1f]' : 'border-gray-200 bg-gray-100'}`} style={{ width: 65, minWidth: 65 }}></div>
            <div className="flex items-center px-2 flex-1 overflow-hidden whitespace-nowrap" style={{ paddingLeft: `${row.level * 24 + 8}px` }}>
                <div className={`mr-2 flex-shrink-0 p-1 rounded transition-colors ${isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-300'}`}>
                    {row.expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                </div>
                <span className="font-bold flex-shrink-0 mr-1">{colDef?.headerName || row.field}:</span>
                <div className={`flex items-center gap-1 overflow-hidden ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {displayValue}
                </div>
                <span className={`ml-2 flex-shrink-0 text-xs px-1.5 rounded-full ${isDarkMode ? 'text-gray-400 bg-[#181818]' : 'text-gray-500 bg-gray-200'}`}>({row.count})</span>
            </div>
        </div>
    );
});
