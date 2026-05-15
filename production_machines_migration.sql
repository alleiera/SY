-- ÜRETİM MAKİNELERİ TABLOSU
CREATE TABLE production_machines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'extruder', 'pattern', 'cutting'
  location VARCHAR(100),
  status VARCHAR(20) DEFAULT 'running', -- 'running', 'paused', 'error'
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Varsayılan Makineler (Başlangıç verisi)
INSERT INTO production_machines (name, type, location, status, display_order)
VALUES 
  ('Ekstruder E-100', 'extruder', 'A-Sektörü', 'running', 1),
  ('Ekstruder E-200', 'extruder', 'A-Sektörü', 'running', 2),
  ('Desen Baskı D-01', 'pattern', 'B-Sektörü', 'running', 1),
  ('Desen Baskı D-02', 'pattern', 'B-Sektörü', 'paused', 2),
  ('Kesim Ünitesi K-10', 'cutting', 'C-Sektörü', 'running', 1);
