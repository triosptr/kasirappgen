-- Pengaturan (single row)
create table settings (
  id int primary key default 1,
  point_per_tx int not null default 10,
  point_for_free_wash int not null default 150,
  commission_per_wash int not null default 7000,      -- Rupiah per cuci
  discount_presets int[] not null default '{0,5,10,15,20}',
  constraint settings_singleton check (id = 1)
);

-- Jasa cuci
create table services (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,            -- 'biasa' | 'cepat' | 'premium'
  name text not null,
  price int not null,                  -- Rupiah
  color text not null,                 -- hex untuk UI
  soft_color text not null,
  duration_min int,
  active boolean not null default true
);

-- Teknisi
create table technicians (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  present boolean not null default true,
  active boolean not null default true,
  created_at timestamptz default now()
);

-- Pelanggan
create table gen_customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  points int not null default 0,
  created_at timestamptz default now()
);

-- Motor milik pelanggan
create table vehicles (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references gen_customers(id) on delete cascade,
  plate text not null,
  vehicle_type text,                   -- "Honda Vario 160", dst.
  created_at timestamptz default now()
);

-- Transaksi / invoice (antrian = transaksi berstatus antri/proses)
create table transactions (
  id uuid primary key default gen_random_uuid(),
  invoice_no text unique,
  customer_id uuid references gen_customers(id),
  owner_name text not null,            -- snapshot
  vehicle_plate text not null,
  vehicle_type text,
  phone text,
  service_id uuid references services(id),
  technician_id uuid references technicians(id),
  subtotal int not null,
  discount_pct int not null default 0,
  discount_amt int not null default 0,
  total int not null,
  points_earned int not null default 0,
  points_redeemed boolean not null default false,   -- tukar poin (cuci gratis)
  status text not null default 'antri',             -- 'antri' | 'proses' | 'selesai'
  cleanliness_rating numeric(2,1),                  -- diisi saat selesai
  created_at timestamptz default now(),
  completed_at timestamptz
);

-- Kasir/admin: pakai Supabase Auth (auth.users) + tabel profil opsional
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'kasir'   -- 'kasir' | 'admin'
);

-- Insert Default Data
INSERT INTO settings (id, point_per_tx, point_for_free_wash, commission_per_wash, discount_presets) VALUES (1, 10, 150, 7000, '{0,5,10,15,20}');

INSERT INTO services (key, name, price, color, soft_color, duration_min) VALUES 
('biasa', 'Cuci Biasa', 25000, '#1535D4', '#E7ECFD', 20),
('cepat', 'Cuci Cepat', 35000, '#7FA000', '#F2FBC9', 12),
('premium', 'Cuci Premium', 50000, '#373A4A', '#E8EAEE', 40);

INSERT INTO technicians (name, present) VALUES 
('Budi Santoso', true),
('Andi Pratama', true),
('Rizky Maulana', true),
('Joko Susilo', true),
('Dewi Lestari', false);
