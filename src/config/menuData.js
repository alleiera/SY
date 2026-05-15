import {
    Sliders, Package, Briefcase, Database, Settings, Factory
} from 'lucide-react';

/**
 * Uygulama sol kenar menüsünün yapısını tanımlar.
 * Her öğenin alt menüsü (subItems) varsa açılabilir menü olarak gösterilir.
 * `type` alanı hangi ekranın açılacağını belirler (App.jsx window renderer ile eşleşmeli).
 */
export const MENU_DATA = [
    {
        id: 'control-panel',
        Icon: Sliders,
        label: 'Kontrol Paneli',
        cat: 'Genel',
        subItems: [
            { label: 'Ürünler', id: 'cp-products', type: 'products' },
            { label: 'Ölçüler', id: 'cp-dimensions', type: 'dimensions' },
            { label: 'H Kodları', id: 'cp-h-codes', type: 'h-codes' },
            { label: 'Kartela Renkleri', id: 'cp-chart-colors', type: 'chart-colors' },
            { label: 'Yüzeyler', id: 'cp-surfaces', type: 'surfaces' },
            { label: 'Kod Şablon Sistemi', id: 'cp-code-templates', type: 'code-templates' },
            { label: 'Reçete Sistemi', id: 'cp-recipe-system', type: 'recipe-system' }
        ]
    },
    {
        id: 'stock',
        Icon: Package,
        label: 'Stok Yönetimi',
        cat: 'Genel',
        subItems: [
            { label: 'Malzemeler', id: 'stock-materials', type: 'materials' },
            { label: 'Malzeme Fişleri', id: 'stock-receipts', type: 'receipts' }
        ]
    },
    {
        id: 'proj',
        Icon: Briefcase,
        label: 'Projeler',
        cat: 'Yönetim',
        subItems: [
            { label: 'Aktif Görevler', id: 'proj-active' },
            { label: 'Arşiv', id: 'proj-archive' }
        ]
    },
    {
        id: 'db',
        Icon: Database,
        label: 'Veritabanı',
        cat: 'Sistem'
    },
    {
        id: 'config',
        Icon: Settings,
        label: 'Ayarlar',
        cat: 'Sistem',
        subItems: [
            { label: 'Genel Ayarlar', id: 'cfg-general', type: 'settings' },
            { label: 'Makine Yönetimi', id: 'cfg-machines', type: 'machine-mgmt' }
        ]
    },
    {
        id: 'production',
        Icon: Factory,
        label: 'Üretim',
        cat: 'Operasyon',
        subItems: [
            { label: 'Ekstruder', id: 'prod-extruder', type: 'production-monitor', machineType: 'extruder' },
            { label: 'Desen', id: 'prod-pattern', type: 'production-monitor', machineType: 'pattern' },
            { label: 'Kesim', id: 'prod-cutting', type: 'production-monitor', machineType: 'cutting' },
            { label: 'Üretim Programı', id: 'prod-schedule', type: 'prod-schedule' },
            { label: 'Biten İşler', id: 'prod-completed', type: 'prod-completed' }
        ]
    }
];
