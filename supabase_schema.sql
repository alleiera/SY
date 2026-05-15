-- ==========================================
-- 1. CLEANUP (Optional - Use with caution)
-- ==========================================
-- drop table if exists public.user_settings;
-- drop table if exists public.user_roles;
-- drop table if exists public.role_permissions;
-- drop table if exists public.permissions;
-- drop table if exists public.roles;

-- ==========================================
-- 2. TABLES SETUP
-- ==========================================

-- A. ROLES (Roller)
create table public.roles (
  id bigint generated always as identity primary key,
  name text not null unique,
  description text
);

-- B. PERMISSIONS (Yetkiler)
create table public.permissions (
  id bigint generated always as identity primary key,
  code text not null unique, -- ex: 'materials.view', 'materials.edit'
  description text
);

-- C. ROLE_PERMISSIONS (Rol-Yetki İlişkisi)
create table public.role_permissions (
  role_id bigint references public.roles(id) on delete cascade,
  permission_id bigint references public.permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

-- D. USER_ROLES (Kullanıcı-Rol İlişkisi)
create table public.user_roles (
  user_id uuid references auth.users on delete cascade,
  role_id bigint references public.roles(id) on delete cascade,
  primary key (user_id, role_id)
);

-- E. USER_SETTINGS (Kullanıcı Ayarları)
create table public.user_settings (
  user_id uuid references auth.users not null primary key,
  theme text default 'system',
  grid_settings jsonb default '{}'::jsonb,
  updated_at timestamp with time zone default now()
);

-- ==========================================
-- 3. ENABLE ROW LEVEL SECURITY (RLS)
-- ==========================================
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.user_roles enable row level security;
alter table public.user_settings enable row level security;

-- ==========================================
-- 4. RLS POLICIES (Güvenlik Kuralları)
-- ==========================================

-- Roles/Permissions are readable by everyone authenticated (to check their own access)
create policy "Read roles" on public.roles for select using ( auth.role() = 'authenticated' );
create policy "Read permissions" on public.permissions for select using ( auth.role() = 'authenticated' );
create policy "Read role_permissions" on public.role_permissions for select using ( auth.role() = 'authenticated' );
create policy "Read user_roles" on public.user_roles for select using ( auth.role() = 'authenticated' );

-- User Settings: Users can only manage their own settings
create policy "Manage own settings" on public.user_settings
  for all using ( auth.uid() = user_id );

-- ==========================================
-- 5. INITIAL DATA SEEDING (Başlangıç Verileri)
-- ==========================================

-- Insert Roles
insert into public.roles (name, description) values
('admin', 'Tam yetkili yönetici'),
('warehouse_staff', 'Depo sorumlusu - Sadece stok yönetimi'),
('viewer', 'İzleyici - Sadece görüntüleme yapar')
on conflict (name) do nothing;

-- Insert Permissions (Expand this list as needed)
insert into public.permissions (code, description) values
('materials.view', 'Malzemeleri görüntüleyebilir'),
('materials.create', 'Yeni malzeme ekleyebilir'),
('materials.edit', 'Malzeme düzenleyebilir'),
('materials.delete', 'Malzeme silebilir'),
('settings.view', 'Ayarlar sayfasına girebilir')
on conflict (code) do nothing;

-- Assign ALL permissions to 'admin' role
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r cross join public.permissions p
where r.name = 'admin'
on conflict do nothing;

-- Assign READ-ONLY permissions to 'viewer' role
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r join public.permissions p on p.code like '%.view'
where r.name = 'viewer'
on conflict do nothing;

-- ==========================================
-- 6. PRODUCTS TABLE (Ürünler)
-- ==========================================
create table if not exists public.products (
  id uuid default gen_random_uuid() primary key,
  code text not null unique,
  product_name text not null,
  surface text,
  product_group text,
  h_code text,
  brand text,
  brand_code text,
  description1 text,
  description2 text,
  description3 text,
  special_code1 text,
  special_code2 text,
  special_code3 text,
  special_code4 text,
  special_code5 text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.products enable row level security;

create policy "Enable read access for products" on public.products for select using (auth.role() = 'authenticated');
create policy "Enable insert for products" on public.products for insert with check (auth.role() = 'authenticated');
create policy "Enable update for products" on public.products for update using (auth.role() = 'authenticated');
create policy "Enable delete for products" on public.products for delete using (auth.role() = 'authenticated');

