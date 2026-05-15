import React, { useState, useMemo } from 'react';
import { UniversalDataGrid } from './UniversalDataGrid/index';
import { Column } from './UniversalDataGrid/types';
import { Sun, Moon } from 'lucide-react';

export { UniversalDataGrid };

const App = () => {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [showGroupPanel, setShowGroupPanel] = useState(false);

    const data = useMemo(() => Array.from({ length: 5000 }, (_, i) => ({
        id: i + 1,
        name: ['Ahmet Yılmaz', 'Ayşe Demir', 'Mehmet Kaya', 'Zeynep Çelik', 'Can Yıldız'][i % 5],
        status: ['Onaylandı', 'Bekliyor', 'Reddedildi', 'Taslak'][i % 4],
        role: ['Yönetici', 'Geliştirici', 'Tasarımcı', 'Analist'][i % 4],
        city: ['İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya'][i % 5],
        year: [2022, 2023, 2024][i % 3],
        salary: 20000 + (i * 10),
        description: "Bu, uzun metin düzenleme testi için örnek bir paragraf verisidir.",
        joinDate: new Date(2020, 0, 1 + (i % 1000)).toLocaleDateString('tr-TR')
    })), []);

    const cols: Column[] = [
        { field: 'select_col', headerName: '', width: 35, type: 'checkbox' },
        { field: 'id', headerName: 'ID', width: 80 },
        { field: 'name', headerName: 'Ad Soyad', width: 160, editable: true, cellEditor: 'text' },
        { field: 'role', headerName: 'Pozisyon', width: 140, editable: true, cellEditor: 'select', cellEditorParams: { options: ['Yönetici', 'Geliştirici', 'Tasarımcı', 'Analist'] } },
        { field: 'city', headerName: 'Şehir', width: 120, editable: true, cellEditor: 'text' },
        { field: 'year', headerName: 'Yıl', width: 100, editable: true, cellEditor: 'number', type: 'number' },
        { field: 'salary', headerName: 'Maaş', width: 120, editable: true, cellEditor: 'number', type: 'number' },
        { field: 'joinDate', headerName: 'Katılım Tarihi', width: 130, editable: true, cellEditor: 'date' },
        { field: 'description', headerName: 'Açıklama', width: 250, editable: true, cellEditor: 'largeText', cellEditorParams: { maxLength: 500 } },
        { field: 'status', headerName: 'Durum', width: 120, editable: true, cellEditor: 'select', cellEditorParams: { options: ['Onaylandı', 'Bekliyor', 'Reddedildi', 'Taslak'] } },
    ];

    return (
        <div className={`h-screen flex flex-col items-center justify-center p-8 transition-colors ${isDarkMode ? 'bg-[#121212]' : 'bg-gray-100'}`}>
            <div className={`w-full max-w-7xl h-[650px] shadow-2xl flex flex-col transition-colors ${isDarkMode ? 'bg-[#181818] shadow-black/50' : 'bg-white'}`}>
                <div className={`p-4 border-b flex justify-between items-center ${isDarkMode ? 'border-[#2a2a2a]' : 'border-gray-200'}`}>
                    <div>
                        <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Universal Enterprise Grid</h2>
                        <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            <b>Modüler Yapı:</b> Bu bileşen artık "features" prop'u ile tamamen özelleştirilebilir.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsDarkMode(!isDarkMode)}
                            className={`p-2 rounded-full transition-colors ${isDarkMode ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                        >
                            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                    </div>
                </div>
                <div className="flex-1 overflow-hidden p-4">
                    <UniversalDataGrid
                        initialData={data}
                        initialColumns={cols}
                        height={500}
                        theme={isDarkMode ? 'dark' : 'light'}
                    />
                </div>
            </div>
        </div>
    );
};
export default App;