# 📁 ESTRUCTURA DE ARCHIVOS .env SEPARADA POR AMBIENTES

## 🎯 REGLA PRINCIPAL
- **Desarrollo**: `.env.local` (frontend) + `server/.env` (backend)
- **Producción**: `.env.production.local` (frontend) + `server/.env.production` (backend)

## 📂 Estructura correcta:
```
industrial/
├── .env.local              ← FRONTEND DESARROLLO (Next.js lee aquí)
├── .env.production.local   ← FRONTEND PRODUCCIÓN (Next.js lee aquí)
├── .env.example            ← Ejemplo para frontend
├── package.json            ← Frontend dependencies
├── node_modules/           ← Frontend dependencies instaladas
└── server/
    ├── .env                ← BACKEND DESARROLLO (Express lee aquí)
    ├── .env.production     ← BACKEND PRODUCCIÓN (Express lee aquí)
    ├── .env.example        ← Ejemplo para backend
    ├── package.json        ← Backend dependencies
    └── node_modules/       ← Backend dependencies instaladas
```

## 🚫 ARCHIVOS A EVITAR (causan conflictos):
```
industrial/
├── .env                ← ❌ ELIMINAR (confunde a Next.js)
├── .env.production     ← ❌ ELIMINAR (no se usa en deploy)
└── server/
    └── .env.production ← ❌ ELIMINAR (no se usa en deploy)
```

## 💻 DESARROLLO vs 🚀 PRODUCCIÓN

### 🏠 Desarrollo local:
```bash
# Frontend (.env.local)
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_ENV=development

# Backend (server/.env)
PORT=5000
MONGODB_URI=mongodb+srv://...atlas... (COMPARTIDA)
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
JWT_SECRET=Pr0duct0sS3gur0sIndu5tr14l_Dev
JWT_EXPIRES_IN=7d (más tiempo para desarrollo)
BCRYPT_ROUNDS=10 (menos seguridad, más velocidad)
MAX_LOGIN_ATTEMPTS=10 (más permisivo)
```

### 🌐 Producción VPS:
```bash
# Frontend (.env.production.local)
NEXT_PUBLIC_BASE_URL=https://industrial-iot.us
NEXT_PUBLIC_API_URL=https://industrial-iot.us/api
NEXT_PUBLIC_ENV=production

# Backend (server/.env.production)
PORT=3001
MONGODB_URI=mongodb+srv://...atlas... (COMPARTIDA)
NODE_ENV=production
FRONTEND_URL=https://industrial-iot.us
JWT_SECRET=9k2m8n4p6r7t1w3x... (más largo y complejo)
JWT_EXPIRES_IN=1d (menos tiempo por seguridad)
BCRYPT_ROUNDS=12 (más seguridad)
MAX_LOGIN_ATTEMPTS=5 (más restrictivo)
```

## 📦 INSTALACIÓN DE DEPENDENCIAS

### ✅ Secuencia correcta:
```bash
cd /root/industrial

# 1. Frontend
npm install

# 2. Backend
cd server
npm install
cd ..

# 3. Build
npm run build
```

## 🔄 COMANDOS DE GESTIÓN

### Desarrollo:
```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
npm run dev
```

### Producción:
```bash
# Todo gestionado por PM2
pm2 status
pm2 logs
pm2 restart all
```

## 🛡️ PREVENCIÓN DE CONFLICTOS

### En el deploy:
```bash
# Limpiar archivos .env existentes
rm -f .env .env.production .env.development 2>/dev/null || true
rm -f server/.env.production server/.env.development 2>/dev/null || true

# Crear solo los necesarios
echo "..." > .env.local           # Frontend
echo "..." > server/.env         # Backend
```

## ✅ VERIFICACIÓN POST-DEPLOY

```bash
# Verificar estructura
ls -la .env*
ls -la server/.env*

# Verificar dependencias
ls node_modules/ | wc -l          # Frontend deps
ls server/node_modules/ | wc -l   # Backend deps

# Verificar funcionamiento
curl http://localhost:3000/       # Frontend
curl http://localhost:3001/api/   # Backend
```