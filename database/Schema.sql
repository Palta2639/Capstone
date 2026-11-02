CREATE SCHEMA "public";
CREATE TABLE "agenda" (
	"id" serial PRIMARY KEY,
	"pedido_id" integer,
	"fecha_instalacion" timestamp,
	"estado_agenda" varchar
);
CREATE TABLE "categorias" (
	"id" serial PRIMARY KEY,
	"nombre" varchar(100) NOT NULL,
	"descripcion" text
);
CREATE TABLE "cotizaciones" (
	"id" serial PRIMARY KEY,
	"usuario_id" integer,
	"consumo_kwh_mensual" numeric(10, 2) NOT NULL,
	"comuna" varchar(100),
	"presupuesto_estimado" integer,
	"estado" varchar(50) DEFAULT 'pendiente',
	"fecha_solicitud" timestamp DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "detalle_pedidos" (
	"id" serial PRIMARY KEY,
	"pedido_id" integer,
	"producto_id" integer,
	"cantidad" integer NOT NULL,
	"precio_unitario" integer NOT NULL
);
CREATE TABLE "pedidos" (
	"id" serial PRIMARY KEY,
	"usuario_id" integer,
	"monto_total" integer NOT NULL,
	"estado" varchar(50) DEFAULT 'pendiente',
	"fecha_pedido" timestamp DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "productos" (
	"id" serial PRIMARY KEY,
	"nombre" varchar(150) NOT NULL,
	"descripcion" text,
	"precio" integer NOT NULL,
	"stock" integer DEFAULT 0 NOT NULL,
	"potencia_watts" integer,
	"categoria_id" integer,
	"imagen_url" text,
	"creado_en" timestamp DEFAULT CURRENT_TIMESTAMP,
	"es_kit" boolean DEFAULT false
);
CREATE TABLE "roles" (
	"id" serial PRIMARY KEY,
	"nombre" varchar(50) NOT NULL CONSTRAINT "roles_nombre_key" UNIQUE
);
CREATE TABLE "usuarios" (
	"id" serial PRIMARY KEY,
	"nombre" varchar(100) NOT NULL,
	"email" varchar(100) NOT NULL CONSTRAINT "usuarios_email_key" UNIQUE,
	"password_hash" varchar(255) NOT NULL,
	"telefono" varchar(20),
	"rol_id" integer DEFAULT 2,
	"creado_en" timestamp DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "agenda_pkey" ON "agenda" ("id");
CREATE INDEX "ix_agenda_id" ON "agenda" ("id");
CREATE UNIQUE INDEX "categorias_pkey" ON "categorias" ("id");
CREATE UNIQUE INDEX "cotizaciones_pkey" ON "cotizaciones" ("id");
CREATE UNIQUE INDEX "detalle_pedidos_pkey" ON "detalle_pedidos" ("id");
CREATE UNIQUE INDEX "pedidos_pkey" ON "pedidos" ("id");
CREATE UNIQUE INDEX "productos_pkey" ON "productos" ("id");
CREATE UNIQUE INDEX "roles_nombre_key" ON "roles" ("nombre");
CREATE UNIQUE INDEX "roles_pkey" ON "roles" ("id");
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios" ("email");
CREATE UNIQUE INDEX "usuarios_pkey" ON "usuarios" ("id");
ALTER TABLE "agenda" ADD CONSTRAINT "agenda_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "pedidos"("id");
ALTER TABLE "cotizaciones" ADD CONSTRAINT "cotizaciones_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL;
ALTER TABLE "detalle_pedidos" ADD CONSTRAINT "detalle_pedidos_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "pedidos"("id") ON DELETE CASCADE;
ALTER TABLE "detalle_pedidos" ADD CONSTRAINT "detalle_pedidos_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT;
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL;
ALTER TABLE "productos" ADD CONSTRAINT "productos_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias"("id");
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "roles"("id");
