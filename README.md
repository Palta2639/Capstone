# Anglo Electric - Plataforma E-Commerce y Dimensionador Solar

Plataforma web modular para la venta de equipos solares fotovoltaicos, asesoría técnica con IA y cotizador solar automatizado para Chile.

Proyecto Capstone (APT) – Duoc UC.

## Equipo

| Integrante | Rol |
|---|---|
| Cristopher Figueroa | Scrum Master y Desarrollador Backend |
| Fiorella Osorio | Desarrolladora Frontend y UX/UI |
| David Valenzuela | Ingeniero de IA y Datos |
| Kevin Peña | Analista de Datos, QA, Base de Datos e Integración (Docker) |

## Inicio rápido con Docker (recomendado)

Es la forma más simple: no requiere instalar Python ni Node ni crear archivos de configuración.

**Requisitos:** [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado y abierto. En Windows, además, WSL 2 activado (ejecutar `wsl --install` en PowerShell como administrador y reiniciar).

```bash
git clone -b AngloElectric-APT https://github.com/Palta2639/Capstone.git
cd Capstone
docker compose up --build
```

La primera vez tarda unos minutos. Cuando termine:

| Servicio | Dirección |
|---|---|
| Aplicación web | http://localhost:3000 |
| API (Swagger) | http://localhost:8000/docs |
| pgAdmin | http://localhost:5050 |

Para detener el proyecto: `docker compose down`

> El proyecto incluye por defecto la conexión a la base de datos del equipo para facilitar su evaluación. Para usar otra base de datos, crear un archivo `.env` en la raíz a partir de `.env.example`.

## Instalación manual (sin Docker)

**Requisitos:** Node.js >= 20.9, Python >= 3.10 y Git.

### 1. Backend (FastAPI)

```bash
cd src/backend
python -m venv venv
```

Activar el entorno virtual:

- Windows: `venv\Scripts\activate`
- macOS / Linux: `source venv/bin/activate`

```bash
pip install -r requirements.txt
```

Crear el archivo `src/backend/.env`:

```
DATABASE_URL=postgresql://usuario:password@host/neondb?sslmode=require
SECRET_KEY=clave_de_al_menos_32_caracteres
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

Para generar una `SECRET_KEY` válida:

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

Iniciar el servidor:

```bash
uvicorn main:app --reload --port 8000
```

### 2. Frontend (Next.js)

En otra terminal:

```bash
cd src/frontend
npm install
npm run dev
```

La aplicación queda disponible en http://localhost:3000.

## Pruebas

```bash
cd src/backend
pip install pytest httpx
pytest ../../tests/unitarias -v
```

El plan de pruebas y sus resultados están en `docs/05_pruebas/plan_pruebas.pdf`, y las evidencias en `evidencias/pruebas/`.

## Estructura del repositorio

```
├── src/
│   ├── backend/        API FastAPI, modelo KNN y Dockerfile
│   └── frontend/       Aplicación Next.js y Dockerfile
├── docs/               Documentos del proyecto (inicio, requisitos, diseño, pruebas, trazabilidad)
├── agil/               Product backlog y Definition of Done
├── tests/              Pruebas unitarias e integración (Postman)
├── evidencias/         Evidencias de pruebas, sprints y despliegue
├── docker-compose.yml
└── .env.example
```

## Tecnologías

Next.js 16 · React · FastAPI · PostgreSQL (Neon) · SQLAlchemy · Scikit-Learn (KNN) · Docker · Webpay (Transbank)
