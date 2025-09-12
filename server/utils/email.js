const nodemailer = require('nodemailer');

class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Industrial IOT <${process.env.EMAIL_FROM}>`;
  }

  // Crear transporter según el entorno
  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      // Para producción - usando Gmail o servicio de email real
      return nodemailer.createTransporter({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USERNAME,
          pass: process.env.EMAIL_PASSWORD, // App Password para Gmail
        },
      });
    }

    // Para desarrollo - configuración manual del servidor SMTP
    const emailConfig = {
      host: process.env.EMAIL_HOST || 'sandbox.smtp.mailtrap.io',
      port: parseInt(process.env.EMAIL_PORT) || 2525,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    };

    // Si es el servicio de PrivateEmail, ajustar configuración
    if (process.env.EMAIL_HOST && process.env.EMAIL_HOST.includes('privateemail.com')) {
      emailConfig.port = parseInt(process.env.EMAIL_PORT) || 465;
      emailConfig.secure = emailConfig.port === 465; // true para puerto 465, false para 587
      if (emailConfig.port === 587) {
        emailConfig.requireTLS = true;
      }
    }

    return nodemailer.createTransporter(emailConfig);
  }

  // Enviar email
  async send(template, subject) {
    // 1) Define HTML template basado en el tipo
    let html;
    
    if (template === 'passwordReset') {
      html = this.passwordResetTemplate();
    } else if (template === 'welcome') {
      html = this.welcomeTemplate();
    } else {
      html = `<p>${template}</p>`;
    }

    // 2) Define mail options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: this.htmlToText(html)
    };

    // 3) Create transport and send email
    try {
      await this.newTransport().sendMail(mailOptions);
      console.log(`Email enviado exitosamente a: ${this.to}`);
    } catch (error) {
      console.error('Error enviando email:', error);
      throw new Error('Error enviando email. Inténtalo más tarde');
    }
  }

  // Template para reset de contraseña
  passwordResetTemplate() {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Restablecer Contraseña - Industrial IOT</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2563eb; color: white; padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background-color: #f8fafc; padding: 30px 20px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .button:hover { background-color: #1d4ed8; }
          .warning { background-color: #fef3cd; border: 1px solid #fecaca; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🔒 Restablecer Contraseña</h1>
          <p>Industrial IOT - Sistema de Administración</p>
        </div>
        
        <div class="content">
          <h2>Hola ${this.firstName},</h2>
          
          <p>Has solicitado restablecer tu contraseña de administrador. Si no fuiste tú, por favor ignora este correo.</p>
          
          <p>Para restablecer tu contraseña, haz clic en el siguiente botón:</p>
          
          <div style="text-align: center;">
            <a href="${this.url}" class="button">Restablecer Contraseña</a>
          </div>
          
          <p>O copia y pega este enlace en tu navegador:</p>
          <p style="word-break: break-all; background: #e5e7eb; padding: 10px; border-radius: 5px;">
            ${this.url}
          </p>
          
          <div class="warning">
            <strong>⚠️ Importante:</strong>
            <ul>
              <li>Este enlace expirará en <strong>10 minutos</strong></li>
              <li>Solo puede ser usado una vez</li>
              <li>Si no solicitaste este cambio, ignora este correo</li>
            </ul>
          </div>
          
          <p>Por tu seguridad, siempre verifica que la URL comience con tu dominio oficial antes de ingresar tu nueva contraseña.</p>
          
          <p>Si tienes problemas con el enlace, contacta al soporte técnico.</p>
          
          <p>Saludos cordiales,<br>
          <strong>Equipo de Industrial IOT</strong></p>
        </div>
        
        <div class="footer">
          <p>© 2024 Industrial IOT. Todos los derechos reservados.</p>
          <p>Este es un correo automático, no responder.</p>
        </div>
      </body>
      </html>
    `;
  }

  // Template de bienvenida (opcional)
  welcomeTemplate() {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Bienvenido - Industrial IOT</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #059669; color: white; padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background-color: #f0fdf4; padding: 30px 20px; border-radius: 0 0 10px 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🎉 ¡Bienvenido!</h1>
          <p>Industrial IOT - Sistema de Administración</p>
        </div>
        
        <div class="content">
          <h2>Hola ${this.firstName},</h2>
          <p>Tu cuenta de administrador ha sido configurada exitosamente.</p>
          <p>Ya puedes acceder al panel de administración usando tu email y contraseña.</p>
          <p>Saludos cordiales,<br><strong>Equipo de Industrial IOT</strong></p>
        </div>
      </body>
      </html>
    `;
  }

  // Convertir HTML a texto plano (simple)
  htmlToText(html) {
    return html
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Método directo para envio de reset de contraseña
  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Restablecer contraseña - Industrial IOT (válido por 10 minutos)'
    );
  }

  // Método directo para envio de bienvenida
  async sendWelcome() {
    await this.send('welcome', 'Bienvenido al sistema de administración - Industrial IOT');
  }
}

module.exports = Email;