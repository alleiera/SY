-- Add product_groups column to production_machines
ALTER TABLE public.production_machines 
ADD COLUMN IF NOT EXISTS product_groups JSONB DEFAULT '[]'::jsonb;
