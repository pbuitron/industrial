# 🚀 Guía Completa de Despliegue - Industrial IoT

## 📋 Información del Servidor
- **IP**: 162.254.37.42
- **Usuario**: root
- **Contraseña**: SY0G2B18pXnvvYz3r7
- **Dominio**: industrial-iot.us

## ⚡ Instalación Rápida (Un Solo Comando)

### 1. Subir scripts al servidor
```bash
scp -r deploy-scripts root@162.254.37.42:~/
# Contraseña: SY0G2B18pXnvvYz3r7
```

### 2. Conectar y ejecutar instalación automática
```bash
ssh root@162.254.37.42
# Contraseña: SY0G2B18pXnvvYz3r7

cd ~/deploy-scripts
chmod +x *.sh
./fresh-install.sh
```

## 🎯 ¿Qué hace el script automático?

### ✅ Preparación del Sistema
- Actualiza Ubuntu completamente
- Limpia instalaciones previas
- Instala dependencias básicas
- Configura firewall

### ✅ Servicios Principales
- **Node.js 18** (para el backend)
- **MongoDB 5.0** (en Docker para mayor estabilidad)
- **Nginx** (servidor web y proxy reverse)
- **PM2** (gestor de procesos)
- **Certbot** (certificados SSL automáticos)

### ✅ Configuración del Proyecto
- Clona desde GitHub
- Instala todas las dependencias
- Configura variables de entorno
- Compila el frontend
- Configura SSL automático

### ✅ Verificaciones
- Conexión a internet
- Configuración DNS
- Estado de servicios
- Funcionamiento de la API
- Acceso al sitio web

## 🔧 Herramientas de Mantenimiento

### Comandos Básicos
```bash
# Ver estado general
./maintenance-advanced.sh status

# Ver logs en tiempo real
./maintenance-advanced.sh logs-live

# Verificación completa de salud
./maintenance-advanced.sh health

# Actualizar desde GitHub
./maintenance-advanced.sh update
```

### Comandos Avanzados
```bash
# Hacer backup de la base de datos
./maintenance-advanced.sh backup

# Reiniciar todos los servicios
./maintenance-advanced.sh restart-all

# Limpiar logs y archivos temporales
./maintenance-advanced.sh cleanup

# Renovar certificado SSL
./maintenance-advanced.sh ssl
```

## 📊 Arquitectura del Sistema

```
Internet → Nginx (Puerto 80/443) → PM2 → Node.js Backend (Puerto 3001)
                ↓                              ↓
         Archivos Estáticos              MongoDB (Docker)
           (Frontend)                    (Puerto 27017)
```

### Rutas
- **Frontend**: `https://industrial-iot.us/` → Archivos estáticos en `/root/industrial/out/`
- **API**: `https://industrial-iot.us/api/` → Backend Node.js en puerto 3001
- **MongoDB**: `localhost:27017` → Contenedor Docker

## 🔒 Configuración de Seguridad

### Firewall (UFW)
- Puerto 22 (SSH)
- Puerto 80 (HTTP) → Redirige a HTTPS
- Puerto 443 (HTTPS)
- Todos los demás puertos bloqueados

### SSL/TLS
- Certificado Let's Encrypt automático
- Renovación automática cada 90 días
- Headers de seguridad configurados

### Base de Datos
- MongoDB con autenticación
- Usuario: `admin`
- Contraseña: `industrial2024`
- Acceso solo desde localhost

## 📁 Estructura de Archivos

```
/root/
├── industrial/                 # Código del proyecto
│   ├── out/                   # Frontend compilado
│   ├── server/               # Backend Node.js
│   ├── logs/                 # Logs de PM2
│   └── ecosystem.config.js   # Configuración PM2
├── backups/                  # Backups de la BD
└── deploy-scripts/           # Scripts de mantenimiento
```

## 🔍 Logs Importantes

### Ubicaciones de Logs
- **Backend**: `pm2 logs industrial-iot-backend`
- **Nginx**: `/var/log/nginx/industrial-iot.error.log`
- **MongoDB**: `docker logs mongodb`
- **Sistema**: `journalctl -u nginx` / `journalctl -u docker`

### Comandos de Diagnóstico
```bash
# Estado de todos los servicios
systemctl status nginx
docker ps
pm2 status

# Logs en tiempo real
pm2 logs industrial-iot-backend --lines 0
docker logs -f mongodb

# Verificar configuración
nginx -t
docker exec mongodb mongosh --eval "db.runCommand('ping')"
```

## 🆘 Solución de Problemas

### Backend no inicia
```bash
# Ver logs detallados
pm2 logs industrial-iot-backend

# Verificar variables de entorno
cat /root/industrial/server/.env

# Reiniciar
pm2 restart industrial-iot-backend
```

### MongoDB no funciona
```bash
# Ver estado del contenedor
docker ps -a

# Ver logs de MongoDB
docker logs mongodb

# Reiniciar MongoDB
docker restart mongodb

# Verificar conexión
docker exec mongodb mongosh --eval "db.runCommand('ping')"
```

### SSL no funciona
```bash
# Renovar certificado
certbot renew

# Verificar configuración de Nginx
nginx -t

# Reiniciar Nginx
systemctl restart nginx
```

### Sitio web no carga
1. Verificar DNS: `dig industrial-iot.us`
2. Verificar Nginx: `systemctl status nginx`
3. Verificar archivos: `ls -la /root/industrial/out/`
4. Verificar logs: `tail -f /var/log/nginx/industrial-iot.error.log`

## 🔄 Proceso de Actualización

### Actualización Normal
```bash
./maintenance-advanced.sh update
```

### Actualización Manual
```bash
cd /root/industrial
git pull
npm install
cd server && npm install && cd ..
npm run build
pm2 restart industrial-iot-backend
```

## 💾 Respaldos y Restauración

### Backup Automático
```bash
# Crear backup
./maintenance-advanced.sh backup

# Los backups se guardan en /root/backups/
# Se mantienen automáticamente los últimos 5
```

### Restaurar desde Backup
```bash
./maintenance-advanced.sh restore
# Seguir las instrucciones interactivas
```

## 📈 Monitoreo

### PM2 Monitor (Tiempo Real)
```bash
pm2 monit
# Muestra CPU, memoria, logs en tiempo real
```

### Verificación de Salud Completa
```bash
./maintenance-advanced.sh health
# Verifica todos los servicios y conectividad
```

### Información del Sistema
```bash
./maintenance-advanced.sh info
# Muestra información completa del servidor
```

## 🎛️ Variables de Entorno

### Backend (.env)
```bash
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb://admin:industrial2024@localhost:27017/industrial-iot?authSource=admin
JWT_SECRET=<clave-segura-generada>
CORS_ORIGIN=https://industrial-iot.us
```

### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=https://industrial-iot.us/api
```

## 🚨 Comandos de Emergencia

### Reinicio Completo del Sistema
```bash
./maintenance-advanced.sh restart-all
```

### Reset Completo de la Base de Datos (¡CUIDADO!)
```bash
./maintenance-advanced.sh reset-db
# Esto ELIMINARÁ todos los datos
```

### Limpieza General
```bash
./maintenance-advanced.sh cleanup
# Limpia logs y archivos temporales
```

## 📞 Soporte y Mantenimiento

### Comandos Rápidos de Diagnóstico
```bash
# Verificar que todo funciona
curl https://industrial-iot.us/
curl https://industrial-iot.us/api/

# Estado de servicios clave
pm2 status
docker ps
systemctl status nginx

# Espacio en disco
df -h

# Memoria disponible
free -h

# Procesos que más consumen
top -n 1
```

### Logs Más Importantes
```bash
# Backend (más importante)
pm2 logs industrial-iot-backend --lines 50

# Nginx (errores web)
tail -f /var/log/nginx/industrial-iot.error.log

# MongoDB (base de datos)
docker logs mongodb --tail 50

# Sistema (errores generales)
journalctl -xe --lines 50
```

---

## ✅ Checklist Post-Instalación

- [ ] Sitio web accesible en https://industrial-iot.us
- [ ] API responde en https://industrial-iot.us/api/
- [ ] Certificado SSL válido y activo
- [ ] Backend ejecutándose en PM2
- [ ] MongoDB funcionando en Docker
- [ ] Nginx sirviendo archivos correctamente
- [ ] Backup automático configurado
- [ ] Scripts de mantenimiento funcionando

## 🎉 ¡Listo!

Tu aplicación Industrial IoT está completamente desplegada y funcionando. Usa los scripts de mantenimiento para gestionar el servidor y mantener todo actualizado.

**URLs Importantes:**
- **Sitio Web**: https://industrial-iot.us
- **API**: https://industrial-iot.us/api/
- **Repositorio**: https://github.com/pbuitron/industrial

**Comandos Esenciales:**
- Estado: `./maintenance-advanced.sh status`
- Logs: `./maintenance-advanced.sh logs`
- Actualizar: `./maintenance-advanced.sh update`
- Salud: `./maintenance-advanced.sh health`