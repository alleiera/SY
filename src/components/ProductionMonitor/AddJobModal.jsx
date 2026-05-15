import React, { useState, useEffect } from 'react';
import { X, Save, Box, Layers, Maximize2, MoveHorizontal, FileText, Hash } from 'lucide-react';
import { fetchProducts } from '../../services/productService';
import { fetchDimensions } from '../../services/dimensionService';

export default function AddJobModal({ isOpen, onClose, onSave, machine, isDark }) {
    const [loading, setLoading] = useState(true);
    const [products, setProducts] = useState([]);
    const [surfaces, setSurfaces] = useState([]);
    const [thicknesses, setThicknesses] = useState([]);
    const [coilWidths, setCoilWidths] = useState([]);

    const [form, setForm] = useState({
        product: '',
        surface: '',
        thickness: '',
        coilWidth: '',
        quantity: '',
        notes: ''
    });

    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!isOpen) return;

        const loadData = async () => {
            setLoading(true);
            try {
                const [allProducts, surfaceData, thicknessData, coilWidthData] = await Promise.all([
                    fetchProducts(),
                    fetchDimensions('tab4'), // surfaces
                    fetchDimensions('tab3'), // thicknesses
                    fetchDimensions('tab2')  // coil_widths
                ]);

                // Filter products based on machine's product_groups
                const allowedGroups = machine?.product_groups || [];
                let filteredProducts = allProducts;
                if (allowedGroups.length > 0) {
                    filteredProducts = allProducts.filter(p => allowedGroups.includes(p.group));
                }

                setProducts(filteredProducts);
                setSurfaces(surfaceData);
                setThicknesses(thicknessData);
                setCoilWidths(coilWidthData);

                // Formu sıfırla
                setForm({
                    product: '',
                    surface: '',
                    thickness: '',
                    coilWidth: '',
                    quantity: '',
                    notes: ''
                });
            } catch (err) {
                console.error("Veri yüklenirken hata oluştu:", err);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [isOpen, machine]);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (!form.product || !form.quantity) return;
        
        setIsSaving(true);
        try {
            const selectedProduct = products.find(p => p.id.toString() === form.product);
            await onSave({
                machine_id: machine.id,
                product_code: selectedProduct?.code || '',
                product_name: selectedProduct?.productName || '',
                surface: form.surface,
                thickness: form.thickness,
                coil_width: form.coilWidth,
                quantity: parseFloat(form.quantity),
                notes: form.notes
            });
            onClose();
        } catch (err) {
            console.error("İş kaydedilirken hata:", err);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className={`rounded-2xl border w-full max-w-2xl shadow-2xl flex flex-col overflow-hidden ${isDark ? 'bg-[#1c1c1c] border-white/10' : 'bg-white border-gray-200'}`}>
                {/* Header */}
                <div className={`flex items-center justify-between p-5 border-b ${isDark ? 'bg-[#252525] border-[#333]' : 'bg-gray-50 border-gray-200'}`}>
                    <div>
                        <h2 className={`text-lg font-black tracking-tight flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            Yeni İş Emri Ekle
                        </h2>
                        <p className={`text-[11px] mt-1 font-mono uppercase tracking-widest ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {machine?.name} ({machine?.location || 'Konumsuz'})
                        </p>
                    </div>
                    <button onClick={onClose} className={`p-2 rounded-xl transition-all ${isDark ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-gray-200 text-gray-500 hover:text-gray-900'}`}>
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className={`p-6 flex-1 overflow-y-auto custom-scrollbar ${isDark ? 'bg-[#181818]' : 'bg-white'}`}>
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="w-8 h-8 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin" />
                            <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Seçenekler yükleniyor...</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            
                            {/* Ürün Seçimi */}
                            <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#222] border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                                <label className={`block text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                    <Box size={14} /> Üretilecek Ürün / Reçete
                                </label>
                                <select
                                    value={form.product}
                                    onChange={e => setForm({ ...form, product: e.target.value })}
                                    className={`w-full border rounded-lg px-4 py-3 text-sm outline-none transition-all appearance-none ${isDark ? 'bg-[#111] border-white/10 text-white focus:border-blue-500/50' : 'bg-white border-gray-200 text-gray-900 focus:border-blue-400'}`}
                                >
                                    <option value="">-- Ürün Seçiniz --</option>
                                    {products.map(p => (
                                        <option key={p.id} value={p.id}>[{p.code}] {p.productName} {p.group ? `(${p.group})` : ''}</option>
                                    ))}
                                </select>
                                {products.length === 0 && (
                                    <p className="text-[11px] mt-2 text-amber-500">Bu makineye tanımlı ürün grubunda hiç ürün bulunamadı. Lütfen "Ürünler" sayfasından ürün ekleyin veya makinenin ürün gruplarını kontrol edin.</p>
                                )}
                            </div>

                            {/* Ölçüler Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                        <Layers size={12} /> Yüzey Seçeneği
                                    </label>
                                    <select
                                        value={form.surface}
                                        onChange={e => setForm({ ...form, surface: e.target.value })}
                                        className={`w-full border rounded-lg px-3 py-2.5 text-sm outline-none transition-all appearance-none ${isDark ? 'bg-[#1c1c1c] border-white/10 text-white focus:border-blue-500/50' : 'bg-white border-gray-200 text-gray-900 focus:border-blue-400'}`}
                                    >
                                        <option value="">-- Seçiniz --</option>
                                        {surfaces.map(s => (
                                            <option key={s.id} value={s.olcu}>{s.olcu}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                        <Maximize2 size={12} /> Kalınlık
                                    </label>
                                    <select
                                        value={form.thickness}
                                        onChange={e => setForm({ ...form, thickness: e.target.value })}
                                        className={`w-full border rounded-lg px-3 py-2.5 text-sm outline-none transition-all appearance-none ${isDark ? 'bg-[#1c1c1c] border-white/10 text-white focus:border-blue-500/50' : 'bg-white border-gray-200 text-gray-900 focus:border-blue-400'}`}
                                    >
                                        <option value="">-- Seçiniz --</option>
                                        {thicknesses.map(t => (
                                            <option key={t.id} value={t.olcu}>{t.olcu} {t.olcuBirimi}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                        <MoveHorizontal size={12} /> Bobin Genişliği
                                    </label>
                                    <select
                                        value={form.coilWidth}
                                        onChange={e => setForm({ ...form, coilWidth: e.target.value })}
                                        className={`w-full border rounded-lg px-3 py-2.5 text-sm outline-none transition-all appearance-none ${isDark ? 'bg-[#1c1c1c] border-white/10 text-white focus:border-blue-500/50' : 'bg-white border-gray-200 text-gray-900 focus:border-blue-400'}`}
                                    >
                                        <option value="">-- Seçiniz --</option>
                                        {coilWidths.map(c => (
                                            <option key={c.id} value={c.olcu}>{c.olcu} {c.olcuBirimi}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                        <Hash size={12} /> Miktar / Hedef
                                    </label>
                                    <input
                                        type="number"
                                        value={form.quantity}
                                        onChange={e => setForm({ ...form, quantity: e.target.value })}
                                        placeholder="Örn: 1000"
                                        className={`w-full border rounded-lg px-3 py-2.5 text-sm outline-none transition-all ${isDark ? 'bg-[#1c1c1c] border-white/10 text-white focus:border-blue-500/50' : 'bg-white border-gray-200 text-gray-900 focus:border-blue-400'}`}
                                    />
                                </div>
                            </div>

                            {/* Not / Açıklama */}
                            <div>
                                <label className={`block text-[10px] font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                    <FileText size={12} /> Sipariş Notu / Açıklama
                                </label>
                                <textarea
                                    value={form.notes}
                                    onChange={e => setForm({ ...form, notes: e.target.value })}
                                    rows={3}
                                    placeholder="Operatör için özel notlar..."
                                    className={`w-full border rounded-lg px-4 py-3 text-sm outline-none transition-all resize-none custom-scrollbar ${isDark ? 'bg-[#1c1c1c] border-white/10 text-white focus:border-blue-500/50 placeholder:text-gray-600' : 'bg-white border-gray-200 text-gray-900 focus:border-blue-400 placeholder:text-gray-400'}`}
                                />
                            </div>

                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className={`p-5 border-t flex justify-end gap-3 ${isDark ? 'bg-[#252525] border-[#333]' : 'bg-gray-50 border-gray-200'}`}>
                    <button
                        onClick={onClose}
                        className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${isDark ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
                    >
                        İptal
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSaving || !form.product || !form.quantity}
                        className="px-6 py-2.5 rounded-xl text-sm font-bold bg-[#137fec] hover:bg-[#137fec]/90 text-white shadow-lg shadow-[#137fec]/20 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSaving ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Save size={16} />
                        )}
                        Kaydet
                    </button>
                </div>
            </div>
        </div>
    );
}
