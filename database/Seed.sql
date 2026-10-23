-- Datos iniciales de prueba (Seed Data) - Anglo Electric

-- 1. Insertar Roles iniciales
INSERT INTO public.roles (nombre) VALUES 
('Administrador'),
('Cliente');

-- 2. Insertar Categorías principales
INSERT INTO public.categorias (nombre, descripcion) VALUES 
('Paneles Solares', 'Paneles monocristalinos y policristalinos de alta eficiencia'),
('Inversores', 'Inversores de cadena y microinversores para sistemas solares'),
('Baterías', 'Baterías de litio y gel para almacenamiento de energía'),
('Kits Completos', 'Soluciones solares integrales para instalaciones domiciliarias');

-- 3. Insertar Productos de prueba
INSERT INTO public.productos (nombre, descripcion, precio, stock, potencia_watts, categoria_id, es_kit, imagen_url) VALUES 
('Panel Solar Monocristalino 500W', 'Panel solar de alta eficiencia para uso residencial', 120000, 50, 500, 1, false, 'https://ejemplo.com/imagenes/panel.jpg'),
('Inversor Híbrido 5kW', 'Inversor solar compatible con red y almacenamiento', 450000, 15, NULL, 2, false, 'https://ejemplo.com/imagenes/inversor.jpg'),
('Batería de Litio 48V 100Ah', 'Batería de ciclo profundo para almacenamiento solar', 850000, 10, NULL, 3, false, 'https://ejemplo.com/imagenes/bateria.jpg'),
('Taladro Inalámbrico 20V', 'Taladro percutor con 2 baterías de litio', 85000, 15, 750, NULL, false, 'https://ejemplo.com/imagenes/taladro.jpg');

-- 4. Insertar Usuario Administrador inicial
INSERT INTO public.usuarios (nombre, email, password_hash, telefono, rol_id) VALUES 
('Admin Anglo Electric', 'admin@angloelectric.cl', '$2b$12$ExampleHashedPasswordStringHere', '+56912345678', 1);
