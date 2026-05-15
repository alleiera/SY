import React, { useMemo } from 'react';
import { UniversalDataGrid } from './UniversalDataGrid';

const CompletedJobs = () => {
    const columns = useMemo(() => [
        { field: 'select_col', headerName: '', width: 35, pinned: 'left', type: 'checkbox' },
        { field: 'id', headerName: 'İş Emri No', width: 120, pinned: 'left' },
        { field: 'customer', headerName: 'Müşteri', width: 200 },
        { field: 'product', headerName: 'Ürün', width: 200 },
        { field: 'quantity', headerName: 'Üretilen', width: 100, type: 'number' },
        { field: 'completionDate', headerName: 'Bitiş Tarihi', width: 150 },
        { field: 'duration', headerName: 'Süre', width: 100 },
        { field: 'operator', headerName: 'Operatör', width: 150 },
        {
            field: 'quality',
            headerName: 'Kalite',
            width: 120,
            cellRenderer: (params) => {
                const colors = {
                    'OK': 'bg-green-500/20 text-green-400',
                    'Hurda': 'bg-red-500/20 text-red-400',
                    'Rework': 'bg-orange-500/20 text-orange-400'
                };
                const status = params.value;
                return (
                    <span className={`px-2 py-1 rounded text-xs font-bold ${colors[status] || 'bg-gray-500/20 text-gray-400'}`}>
                        {status}
                    </span>
                );
            }
        }
    ], []);

    const previewData = useMemo(() => [
        { id: 'WO-0990', customer: 'ABC A.Ş.', product: 'Profil A-10', quantity: 5000, completionDate: '2023-10-20', duration: '5sa 30dk', operator: 'Ahmet Y.', quality: 'OK' },
        { id: 'WO-0991', customer: 'XYZ Ltd.', product: 'Kapak B-20', quantity: 2000, completionDate: '2023-10-21', duration: '2sa 15dk', operator: 'Mehmet K.', quality: 'OK' },
        { id: 'WO-0992', customer: 'Klm Yapı', product: 'Boru C-30', quantity: 50, completionDate: '2023-10-22', duration: '45dk', operator: 'Ayşe S.', quality: 'Hurda' },
        { id: 'WO-0993', customer: 'Tekno A.Ş.', product: 'Dişli D-40', quantity: 500, completionDate: '2023-10-23', duration: '8sa 00dk', operator: 'Ali V.', quality: 'Rework' },
        { id: 'WO-0994', customer: 'Global İnş.', product: 'Panel P-50', quantity: 1500, completionDate: '2023-10-24', duration: '4sa 45dk', operator: 'Fatma Z.', quality: 'OK' },
    ], []);

    const previewSummary = useMemo(() => {
        const totalQuantity = previewData.reduce((sum, item) => sum + item.quantity, 0);
        const issueCount = previewData.filter((item) => item.quality !== 'OK').length;

        return {
            totalJobs: previewData.length,
            totalQuantity,
            issueCount
        };
    }, [previewData]);

    return (
        <div className="h-full w-full relative">
            <div className="h-full w-full bg-[#181818] flex flex-col">
                <div className="border-b border-white/5 bg-[#151515] px-6 py-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="max-w-3xl">
                            <div className="flex items-center gap-2">
                                <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-amber-300">
                                    Onizleme Modu
                                </span>
                                <span className="text-xs text-gray-500">Canli veri entegrasyonu bekleniyor</span>
                            </div>
                            <h2 className="mt-3 text-lg font-bold text-white">Tamamlanan is emirleri gorunumu</h2>
                            <p className="mt-1 text-sm text-gray-400">
                                Bu ekran su an ekip tanitimlari ve akis denemeleri icin hazirlanmis ornek kayitlarla calisiyor.
                                Canli veri baglantisi eklendiginde ayni tablo yapisi korunarak gercek tamamlanma kayitlari listelenecek.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                            <div className="rounded-xl border border-white/5 bg-white/5 px-4 py-3">
                                <div className="text-[11px] uppercase tracking-[0.18em] text-gray-500">Kayit</div>
                                <div className="mt-1 text-xl font-bold text-white">{previewSummary.totalJobs}</div>
                            </div>
                            <div className="rounded-xl border border-white/5 bg-white/5 px-4 py-3">
                                <div className="text-[11px] uppercase tracking-[0.18em] text-gray-500">Toplam Uretim</div>
                                <div className="mt-1 text-xl font-bold text-white">{previewSummary.totalQuantity.toLocaleString('tr-TR')}</div>
                            </div>
                            <div className="rounded-xl border border-white/5 bg-white/5 px-4 py-3">
                                <div className="text-[11px] uppercase tracking-[0.18em] text-gray-500">Kalite Notu</div>
                                <div className="mt-1 text-xl font-bold text-white">{previewSummary.issueCount}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="min-h-0 flex-1">
                <UniversalDataGrid
                    gridId="completed-jobs-master-grid"
                    initialData={previewData}
                    initialColumns={columns}
                    features={{
                        enableGrouping: true,
                        enableFiltering: true,
                        enableSorting: true,
                        enablePagination: true,
                        enableSidebar: true,
                        enableExport: true,
                        enableSelection: true
                    }}
                />
                </div>
            </div>
        </div>
    );
};

export default CompletedJobs;
