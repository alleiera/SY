-- 1. ESKİ TABLOLARI SİLMEK İSTERSENİZ (DİKKAT: İçindeki veriler gidecektir)
-- DROP TABLE IF EXISTS pvc_widths CASCADE;
-- DROP TABLE IF EXISTS coil_widths CASCADE;
-- DROP TABLE IF EXISTS thicknesses CASCADE;
-- DROP TABLE IF EXISTS surfaces CASCADE;

-- 2. YENİ: DÜĞÜM TÜRLERİ TABLOSU
CREATE TABLE node_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code_key VARCHAR(50) NOT NULL UNIQUE, -- Örn: "RAW_MATERIAL", "CUSTOM_1"
  label VARCHAR(100) NOT NULL, -- Örn: "Hammadde", "Fırınlama"
  description TEXT,
  color_classes VARCHAR(255), -- Tailwind renk sınıfları (Örn: "bg-amber-50 border-amber-400 text-amber-900")
  icon_name VARCHAR(50), -- Lucide ikon adı (Örn: "Box", "Flame")
  icon_color_classes VARCHAR(255),
  port_in BOOLEAN DEFAULT true,
  port_out BOOLEAN DEFAULT true,
  has_consumption BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. YENİ: DÜĞÜM ÖZELLİKLERİ (FORM ALANLARI) TABLOSU
CREATE TABLE node_attributes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  node_type_id UUID REFERENCES node_types(id) ON DELETE CASCADE,
  field_key VARCHAR(50) NOT NULL, -- Örn: "pvcWidth", "temperature"
  label VARCHAR(100) NOT NULL, -- Örn: "PVC Genişliği", "Sıcaklık (°C)"
  field_type VARCHAR(50) NOT NULL, -- 'text', 'number', 'select'
  options JSONB, -- Eğer field_type 'select' ise seçenekler: [{"label": "100 Derece", "value": "100"}]
  is_required BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. VARSAYILAN VERİLERİ (İLK ŞABLONLARI) EKLEYELİM
INSERT INTO node_types (id, code_key, label, description, color_classes, icon_name, icon_color_classes, port_in, port_out, has_consumption)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'RAW_MATERIAL', 'Hammadde', 'Sürecin başlangıç malzemesi', 'bg-amber-50 border-amber-400 text-amber-900', 'Box', 'text-amber-600', false, true, true),
  ('22222222-2222-2222-2222-222222222222', 'SEMI_PRODUCT', 'Yarı Mamul', 'Ara üretim aşaması', 'bg-orange-50 border-orange-400 text-orange-900', 'Archive', 'text-orange-500', true, true, true),
  ('33333333-3333-3333-3333-333333333333', 'FINAL_PRODUCT', 'Nihai Ürün', 'Tamamlanmış ürün', 'bg-emerald-50 border-emerald-400 text-emerald-900', 'Package', 'text-emerald-600', true, false, true);

-- Varsayılan Alanlar (Örnek)
-- Hammadde için "Malzeme Kodu"
INSERT INTO node_attributes (node_type_id, field_key, label, field_type, display_order)
VALUES ('11111111-1111-1111-1111-111111111111', 'materialCode', 'Malzeme Kodu', 'text', 1);

-- Yarı Mamul için "Sıcaklık" dropdown örneği
INSERT INTO node_attributes (node_type_id, field_key, label, field_type, options, display_order)
VALUES ('22222222-2222-2222-2222-222222222222', 'temperature', 'Sıcaklık Ayarı', 'select', '[{"label": "100°C", "value": "100"}, {"label": "200°C", "value": "200"}]'::jsonb, 1);
