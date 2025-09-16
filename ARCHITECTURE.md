# 🏗️ Industrial IOT - Mapa de Arquitectura y Servicios

## 📋 **Resumen de Infraestructura**

```
┌─────────────────────────────────────────────────────────────────┐
│                        INDUSTRIAL IOT                           │
│                     VPS: 162.254.37.42                         │
└─────────────────────────────────────────────────────────────────┘

🌐 **Dominios Principales:**
- https://industrial-iot.us
- https://www.industrial-iot.us

🔧 **Servicios Principales:**
- Frontend: Next.js (Puerto 3000)
- Backend: Express.js (Puerto 3001)
- Base de Datos: MongoDB Atlas (Cloud)
- Proxy: Nginx (Puerto 80/443)
```

---

## 🌐 **Flujo de Datos - Frontend → Backend**

### **1. Frontend (Next.js - Puerto 3000)**

```typescript
📂 components/products-section.tsx
├── 🔗 API Calls: '/api/products/{category}'
├── 📊 State Management: useState, useEffect
├── 🎨 UI Components: Cards, Tabs, Buttons
└── 📱 Responsive Design: Tailwind CSS

📍 API Endpoints que consume:
- GET /api/products/abrazaderas
- GET /api/products/kits
- GET /api/products/epoxicos
```

### **2. Nginx Proxy (Puerto 80/443)**

```nginx
📂 /etc/nginx/sites-enabled/industrial-iot
├── 🔒 SSL Termination (Let's Encrypt)
├── 🔄 HTTP → HTTPS Redirect
├── 🎯 Location /api/ → Backend (localhost:3001)
└── 🎯 Location / → Frontend (localhost:3000)

🌍 Routing Rules:
- *.industrial-iot.us → Frontend (3000)
- *.industrial-iot.us/api/* → Backend (3001)
```

### **3. Backend (Express.js - Puerto 3001)**

```javascript
📂 server/
├── 🚀 server.js (Entry Point)
├── 🛣️ routes/ (API Endpoints)
├── 🗃️ models/ (MongoDB Schemas)
├── 🔧 config/ (Database, CORS)
└── 🔐 middleware/ (Auth, Validation)

📍 API Routes:
- GET /api/health
- GET /api/products/:category
- POST /api/cotizaciones
- GET /api/search
```

### **4. Base de Datos (MongoDB Atlas)**

```
🗄️ MongoDB Cluster: backend.98juy.mongodb.net
├── 📋 Database: industrial-iot
├── 📦 Collections:
│   ├── products (abrazaderas, kits, epoxicos)
│   ├── cotizaciones
│   ├── users
│   └── analytics
└── 🔐 Connection: Via MONGODB_URI
```

---

## 🔄 **Flujo Completo de Datos**

```mermaid
graph TD
    A[Usuario visita www.industrial-iot.us] --> B[Nginx Puerto 443]
    B --> C[Frontend Next.js Puerto 3000]
    C --> D[useEffect ejecuta fetch('/api/products/abrazaderas')]
    D --> B
    B --> E[Backend Express.js Puerto 3001]
    E --> F[MongoDB Atlas Cloud]
    F --> E
    E --> B
    B --> C
    C --> G[UI actualizada con productos]
```

---

## 📁 **Estructura de Archivos Críticos**

### **Frontend**
```
├── components/
│   ├── products-section.tsx (🎯 Componente principal)
│   ├── header.tsx
│   └── footer.tsx
├── .env.production.local (Variables frontend)
└── next.config.js
```

### **Backend**
```
├── server/
│   ├── server.js (🎯 Entry point)
│   ├── .env.production (Variables backend)
│   ├── routes/
│   │   ├── products.js
│   │   └── cotizaciones.js
│   └── models/
│       └── Product.js
```

### **Nginx**
```
├── /etc/nginx/sites-enabled/industrial-iot
├── /etc/letsencrypt/live/industrial-iot.us/
└── /var/log/nginx/industrial-iot.{access,error}.log
```

---

## 🔧 **Variables de Entorno**

### **Frontend (.env.production.local)**
```env
NEXT_PUBLIC_BASE_URL=https://industrial-iot.us
NEXT_PUBLIC_API_URL=https://industrial-iot.us/api
NEXT_PUBLIC_ENV=production
```

### **Backend (server/.env.production)**
```env
PORT=3001
MONGODB_URI=mongodb+srv://pbuitron:***@backend.98juy.mongodb.net/industrial-iot
NODE_ENV=production
FRONTEND_URL=https://industrial-iot.us,https://www.industrial-iot.us
CORS_ORIGIN=https://industrial-iot.us,https://www.industrial-iot.us
```

---

## 🚀 **PM2 Process Management**

```bash
┌────┬─────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┐
│ id │ name        │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │
├────┼─────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┤
│ 1  │ frontend    │ default     │ 0.40.3  │ fork    │ 42314    │ 1h     │ 15   │ online    │
│ 3  │ backend     │ default     │ 1.0.0   │ fork    │ 42326    │ 1h     │ 77   │ online    │
└────┴─────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┘
```

---

## 📊 **Health Check Endpoints**

```bash
# Backend Health
curl https://industrial-iot.us/api/health
# Response: {"success":true,"message":"Server is running","timestamp":"...","environment":"production"}

# Frontend Health
curl https://industrial-iot.us
# Response: HTML page with products loaded

# Products API
curl https://industrial-iot.us/api/products/abrazaderas
# Response: {"success":true,"data":[...],"count":6}
```

---

## 🔄 **Git Workflow**

```
📦 Branches:
├── main (stable releases)
├── production (🎯 VPS deployment branch)
└── development (🛠️ active development)

🚀 Deployment Flow:
development → testing → production → VPS deployment
```

---

## 🛠️ **Comandos de Administración**

```bash
# Restart services
pm2 restart all

# View logs
pm2 logs frontend
pm2 logs backend

# Monitor processes
pm2 monit

# Nginx operations
nginx -t && systemctl reload nginx

# Git operations
git checkout production
git pull origin production
npm run build
```