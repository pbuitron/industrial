# Scripts de Despliegue - Industrial IoT

## 🚀 Instalación Automática

Sube estos scripts a tu VPS y ejecútalos en orden:

### Paso 1: Subir scripts al VPS
```bash
# Desde tu máquina local
scp -r deploy-scripts root@162.254.37.42:~/
# Contraseña: SY0G2B18pXnvvYz3r7
```

### Paso 2: Conectar al VPS y dar permisos
```bash
# Conectar al VPS
ssh root@162.254.37.42
# Contraseña: SY0G2B18pXnvvYz3r7

# Dar permisos de ejecución
cd ~/deploy-scripts
chmod +x *.sh
```

### Paso 3: Ejecutar instalación (en orden)
```bash
# 1. Instalar sistema base
./01-install-system.sh

# 2. Configurar proyecto
./02-setup-project.sh

# 3. Configurar Nginx y SSL (CAMBIAR EMAIL ANTES)
nano 03-configure-nginx.sh  # Cambiar EMAIL por tu email real
./03-configure-nginx.sh

# 4. Desplegar aplicación
./04-deploy.sh
```

## 🔧 Mantenimiento

```bash
# Ver comandos disponibles
./maintenance.sh help

# Actualizar desde GitHub
./maintenance.sh update

# Ver logs
./maintenance.sh logs

# Ver estado
./maintenance.sh status

# Hacer backup
./maintenance.sh backup
```

## 📋 Verificación Post-Instalación

1. **Verificar servicios:**
   ```bash
   pm2 status
   sudo systemctl status mongod
   sudo systemctl status nginx
   ```

2. **Probar sitio:**
   - https://industrial-iot.us
   - https://industrial-iot.us/api/

3. **Monitorear:**
   ```bash
   pm2 monit
   ```

## ⚠️ Importante

1. **Antes del paso 3:** Cambia el email en `03-configure-nginx.sh`
2. **DNS:** Asegúrate de que `industrial-iot.us` apunte a `162.254.37.42`
3. **Firewall:** Los puertos 80 y 443 deben estar abiertos

## 🆘 Troubleshooting

- **Error de permisos:** `sudo chmod +x *.sh`
- **Error de DNS:** Verificar configuración en Namecheap
- **Error de build:** Verificar que Node.js esté instalado correctamente
- **Backend no inicia:** `pm2 logs industrial-iot-backend`