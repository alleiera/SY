import React, { useMemo } from 'react';
import { UniversalDataGrid } from './UniversalDataGrid';

const ProductionSchedule = () => {
    const columns = useMemo(() => [
        { field: 'select_col', headerName: '', width: 35, pinned: 'left', type: 'checkbox' },
        { field: 'id', headerName: 'İş Emri No', width: 120, pinned: 'left' },
        { field: 'customer', headerName: 'Müşteri', width: 200 },
        { field: 'product', headerName: 'Ürün', width: 200 },
        { field: 'quantity', headerName: 'Miktar', width: 100, type: 'number' },
        { field: 'startDate', headerName: 'Başlangıç', width: 150 },
        { field: 'dueDate', headerName: 'Teslim Tarihi', width: 150 },
        {
            field: 'status',
            headerName: 'Durum',
            width: 130,
            cellRenderer: (params) => {
                const colors = {
                    'Planlandı': 'bg-blue-500/20 text-blue-400',
                    'Üretimde': 'bg-green-500/20 text-green-400',
                    'Beklemede': 'bg-yellow-500/20 text-yellow-400',
                    'Gecikmiş': 'bg-red-500/20 text-red-400'
                };
                const status = params.value;
                return (
                    <span className={`px-2 py-1 rounded text-xs font-bold ${colors[status] || 'bg-gray-500/20 text-gray-400'}`}>
                        {status}
                    </span>
                );
            }
        },
        { field: 'machine', headerName: 'Makine', width: 150 }
    ], []);

    const previewData = useMemo(() => [
        { id: 'WO-1001', customer: 'ABC A.Ş.', product: 'Profil A-10', quantity: 5000, startDate: '2023-10-25', dueDate: '2023-10-30', status: 'Üretimde', machine: 'Torna A1' },
        { id: 'WO-1002', customer: 'XYZ Ltd.', product: 'Kapak B-20', quantity: 2000, startDate: '2023-10-26', dueDate: '2023-11-01', status: 'Planlandı', machine: 'CNC M1' },
        { id: 'WO-1003', customer: 'Klm Yapı', product: 'Boru C-30', quantity: 10000, startDate: '2023-10-20', dueDate: '2023-10-28', status: 'Gecikmiş', machine: 'Ekstruder E2' },
        { id: 'WO-1004', customer: 'Tekno A.Ş.', product: 'Dişli D-40', quantity: 500, startDate: '2023-10-27', dueDate: '2023-11-05', status: 'Beklemede', machine: 'Freze F1' },
        { id: 'WO-1005', customer: 'Global İnş.', product: 'Panel P-50', quantity: 1500, startDate: '2023-10-28', dueDate: '2023-11-02', status: 'Planlandı', machine: 'Pres P3' },
    ], []);

    const previewSummary = useMemo(() => {
        const inProgressCount = previewData.filter((item) => item.status === 'Üretimde').length;
        const delayedCount = previewData.filter((item) => item.status === 'Gecikmiş').length;
        const totalQuantity = previewData.reduce((sum, item) => sum + item.quantity, 0);

        return {
            totalOrders: previewData.length,
            inProgressCount,
            delayedCount,
            totalQuantity
        };
    }, [previewData]);

    return (
        <div className="h-full w-full relative">
            <div className="h-full w-full bg-[#181818] flex flex-col">
                <div className="border-b border-white/5 bg-[#151515] px-6 py-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="max-w-3xl">
                            <div className="flex items-center gap-2">
                                <span className="rounded-full bg-sky-500/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-sky-300">
                                    Planlama Onizlemesi
                                </span>
                                <span className="text-xs text-gray-500">Canli cizelgeleme verisi henuz baglanmadi</span>
                            </div>
                            <h2 className="mt-3 text-lg font-bold text-white">Uretim planlama gorunumu</h2>
                            <p className="mt-1 text-sm text-gray-400">
                                Bu alan planlama ekraninin duzenini ve filtreleme akislarini test etmek icin ornek uretim emirleriyle calisir.
                                Canli entegrasyon sonrasinda ayni gride gercek termin, makine ve durum bilgileri akacaktir.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                            <div className="rounded-xl border border-white/5 bg-white/5 px-4 py-3">
                                <div className="text-[11px] uppercase tracking-[0.18em] text-gray-500">Is Emri</div>
                                <div className="mt-1 text-xl font-bold text-white">{previewSummary.totalOrders}</div>
                            </div>
                            <div className="rounded-xl border border-white/5 bg-white/5 px-4 py-3">
                                <div className="text-[11px] uppercase tracking-[0.18em] text-gray-500">Uretimde</div>
                                <div className="mt-1 text-xl font-bold text-white">{previewSummary.inProgressCount}</div>
                            </div>
                            <div className="rounded-xl border border-white/5 bg-white/5 px-4 py-3">
                                <div className="text-[11px] uppercase tracking-[0.18em] text-gray-500">Geciken</div>
                                <div className="mt-1 text-xl font-bold text-white">{previewSummary.delayedCount}</div>
                            </div>
                            <div className="rounded-xl border border-white/5 bg-white/5 px-4 py-3">
                                <div className="text-[11px] uppercase tracking-[0.18em] text-gray-500">Toplam Miktar</div>
                                <div className="mt-1 text-xl font-bold text-white">{previewSummary.totalQuantity.toLocaleString('tr-TR')}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="min-h-0 flex-1">
                <UniversalDataGrid
                    gridId="production-schedule-master-grid"
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

export default ProductionSchedule;
