# 🤖 Claude Code - Configuración para Industrial IOT

## 📋 **Información del Proyecto**

**Usuario GitHub:** pbuitron
**Email:** pbuitron.be@gmail.com
**Token GitHub:** `ghp_h51Ojw7WVSjJFMgiAHyFJsv6MdJW8o[MASKED]`
**VPS SSH:** `root@162.254.37.42`

---

## 🎯 **Prompt de Configuración Inicial**

```
Hola Claude! Soy el desarrollador de Industrial IOT. Aquí tienes la información completa del proyecto:

**Credenciales de acceso:**
- Mi email de GitHub: pbuitron.be@gmail.com
- Mi token de GitHub: ghp_h51Ojw7WVSjJFMgiAHyFJsv6MdJW8o[MASKED]
- SSH del VPS: root@162.254.37.42
- Repositorio: https://github.com/pbuitron/industrial.git

**Estructura del proyecto:**
- Frontend: Next.js (Puerto 3000) - Rama: development/production
- Backend: Express.js (Puerto 3001) - Directorio: server/
- Base de datos: MongoDB Atlas
- Proxy: Nginx
- Process Manager: PM2

**Workflow de ramas:**
- development: Para desarrollo y testing
- production: Para deployment en VPS (rama estable)
- main: Releases estables

**Comandos importantes:**
- Build: npm run build
- Restart: pm2 restart all
- Logs: pm2 logs [frontend/backend]
- Nginx: nginx -t && systemctl reload nginx

Lee el archivo ARCHITECTURE.md para entender la estructura completa del proyecto.
```

---

## 🛠️ **Comandos de Administración Frecuentes**

### **Git Operations**
```bash
# Cambiar a rama de desarrollo
git checkout development

# Cambiar a rama de producción
git checkout production

# Pull cambios desde el repositorio
git pull origin [branch-name]

# Push cambios al repositorio
git push origin [branch-name]
```

### **VPS Operations**
```bash
# Conectar al VPS
ssh root@162.254.37.42

# Ver estado de servicios
pm2 status

# Reiniciar servicios
pm2 restart all

# Ver logs en tiempo real
pm2 logs frontend
pm2 logs backend

# Build del proyecto
npm run build

# Verificar Nginx
nginx -t
systemctl reload nginx
```

### **Deployment Workflow**
```bash
# 1. Desarrollo local (development branch)
git checkout development
# hacer cambios...
git add .
git commit -m "descripción del cambio"
git push origin development

# 2. Testing en VPS
ssh root@162.254.37.42
cd /root/industrial
git checkout development
git pull origin development
npm run build
pm2 restart all

# 3. Promoción a producción
git checkout production
git merge development
git push origin production

# 4. Deploy en VPS
ssh root@162.254.37.42
cd /root/industrial
git checkout production
git pull origin production
npm run build
pm2 restart all
```

---

## 🔧 **Variables de Entorno**

### **Frontend (.env.production.local)**
```env
NEXT_PUBLIC_BASE_URL=https://industrial-iot.us
NEXT_PUBLIC_API_URL=https://industrial-iot.us/api
NEXT_PUBLIC_ENV=production
NEXT_PUBLIC_IMAGE_QUALITY=85
NEXT_PUBLIC_CACHE_DURATION=3600
```

### **Backend (server/.env.production)**
```env
PORT=3001
MONGODB_URI=mongodb+srv://pbuitron:[PASSWORD]@backend.98juy.mongodb.net/industrial-iot?retryWrites=true&w=majority
NODE_ENV=production
FRONTEND_URL=https://industrial-iot.us,https://www.industrial-iot.us
CORS_ORIGIN=https://industrial-iot.us,https://www.industrial-iot.us
JWT_SECRET=[MASKED_JWT_SECRET]
JWT_EXPIRES_IN=1d
JWT_COOKIE_EXPIRES_IN=1
EMAIL_FROM=info@industrial-iot.us
EMAIL_HOST=mail.privateemail.com
EMAIL_PORT=465
EMAIL_USERNAME=info@industrial-iot.us
EMAIL_PASSWORD=[MASKED_EMAIL_PASSWORD]
BCRYPT_ROUNDS=12
MAX_LOGIN_ATTEMPTS=5
LOCK_TIME=30
APIPERU_TOKEN=[MASKED_API_TOKEN]
```

---

## 🚨 **Troubleshooting**

### **Backend no responde**
```bash
# Verificar logs
pm2 logs backend

# Verificar puerto
netstat -tlnp | grep 3001

# Verificar variables de entorno
cat server/.env.production

# Restart limpio
pm2 stop backend
pm2 start server.js --name backend --node-args="--max-old-space-size=512"
```

### **Frontend no carga productos**
```bash
# Verificar logs
pm2 logs frontend

# Verificar API
curl https://industrial-iot.us/api/health

# Verificar build
npm run build

# Restart frontend
pm2 restart frontend
```

### **Nginx problemas**
```bash
# Verificar configuración
nginx -t

# Ver logs de error
tail -f /var/log/nginx/industrial-iot.error.log

# Reload configuración
systemctl reload nginx
```

---

## 💡 **Notas Importantes**

1. **Siempre usar la rama `development` para cambios nuevos**
2. **La rama `production` solo para deploys estables al VPS**
3. **Verificar que ambos dominios funcionen: industrial-iot.us y www.industrial-iot.us**
4. **Usar URLs relativas (`/api`) en el frontend para compatibilidad universal**
5. **El backend debe tener el archivo `.env.production` con las variables correctas**
6. **PM2 debe ejecutarse desde `/root/industrial/server` con NVM cargado**

---

## 🔄 **Script de Verificación Rápida**

```bash
#!/bin/bash
echo "=== VERIFICACIÓN RÁPIDA INDUSTRIAL IOT ==="
echo "1. Verificando servicios PM2..."
pm2 status

echo "2. Verificando API backend..."
curl -s https://industrial-iot.us/api/health | head -2

echo "3. Verificando productos en ambos dominios..."
echo "industrial-iot.us:"
curl -s https://industrial-iot.us | grep -c "SEALPRO"
echo "www.industrial-iot.us:"
curl -s https://www.industrial-iot.us | grep -c "SEALPRO"

echo "4. Verificando logs recientes..."
pm2 logs --lines 3 --nostream
```