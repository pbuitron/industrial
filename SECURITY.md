# 🔐 Guía de Seguridad - Industrial IOT

## ⚠️ ARCHIVOS CRÍTICOS - NUNCA SUBIR A GIT

### **Variables de Entorno (.env)**
```
❌ NUNCA subir:
- server/.env
- .env.local
- .env.production
```

### **Archivos que Contienen Información Sensible:**
- Contraseñas de base de datos
- Claves JWT
- Credenciales de email
- API keys
- Certificados SSL

## ✅ Configuración Correcta

### **1. Configurar Variables de Entorno**
```bash
# En el servidor
cd server
cp .env.example .env
# Editar .env con tus valores reales
```

### **2. Verificar que .gitignore esté Funcionando**
```bash
# Verificar que .env está ignorado
git status

# No debería aparecer server/.env en la lista
```

### **3. Variables Críticas que DEBES Cambiar**
```env
# ¡CAMBIAR ANTES DE PRODUCCIÓN!
JWT_SECRET=clave-super-larga-y-compleja-al-menos-64-caracteres
MONGODB_URI=tu-connection-string-real
EMAIL_PASSWORD=tu-password-real
```

## 🚨 Checklist de Seguridad

### **Antes de hacer git push:**
- [ ] Verificar que `.env` no está en git status
- [ ] Cambiar `JWT_SECRET` por uno único y complejo
- [ ] Configurar credenciales de email reales
- [ ] Cambiar password del admin por defecto

### **Para Producción:**
- [ ] `NODE_ENV=production`
- [ ] `JWT_SECRET` único y seguro
- [ ] Base de datos MongoDB segura
- [ ] HTTPS habilitado
- [ ] Credenciales de email de producción

## 🔍 Cómo Verificar Seguridad

### **1. Verificar .gitignore:**
```bash
git ls-files --ignored --exclude-standard
# No debería mostrar .env
```

### **2. Verificar que no hay secrets en el repositorio:**
```bash
git log --all --full-history -- "*/.env"
# No debería mostrar commits
```

### **3. Test de Variables:**
```bash
# En servidor
node -e "console.log(process.env.JWT_SECRET ? '✅ JWT_SECRET configurado' : '❌ JWT_SECRET faltante')"
```

## 🚀 Deploy Seguro

### **Variables de Entorno en Producción:**
1. **Vercel/Netlify:** Configurar en dashboard web
2. **Heroku:** `heroku config:set JWT_SECRET=tu-clave`
3. **AWS/Digital Ocean:** Configurar en variables del servidor

### **Nunca Hacer:**
- ❌ Hardcodear credenciales en código
- ❌ Subir .env al repositorio
- ❌ Usar contraseñas simples en producción
- ❌ Compartir JWT_SECRET por email/chat

## 📞 Si Hay una Filtración de Seguridad

1. **Cambiar inmediatamente:**
   - JWT_SECRET
   - Password de base de datos
   - Credenciales de email
   - Password del admin

2. **Revisar logs de acceso**
3. **Notificar al equipo**
4. **Actualizar todas las instancias en producción**

---

**Recuerda:** La seguridad es responsabilidad de todo el equipo. Siempre verifica antes de hacer push.