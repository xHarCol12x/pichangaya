import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private resend: Resend;
  private fromEmail = 'PichangaLibre <noreply@pichangalibre.xyz>';

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY || 're_dummykey1234567890');
  }

  async sendWelcomeEmail(name: string, email: string): Promise<void> {
    await this.resend.emails.send({
      from: this.fromEmail,
      to: email,
      subject: '¡Bienvenido a PichangaLibre! 🎉',
      html: `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#1e293b;border-radius:24px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0ea5e9,#38bdf8);padding:40px;text-align:center;">
              <div style="font-size:36px;font-weight:900;color:#0f172a;letter-spacing:-1px;">
                ⚡ PichangaLibre
              </div>
              <p style="color:#0f172a;opacity:0.7;margin:8px 0 0;font-size:14px;">Sistema de Gestión Deportiva</p>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h1 style="color:#f8fafc;font-size:28px;font-weight:800;margin:0 0 16px;">
                ¡Bienvenido, ${name}! 🎉
              </h1>
              <p style="color:#94a3b8;font-size:16px;line-height:1.6;margin:0 0 24px;">
                Tu cuenta en PichangaLibre fue creada exitosamente. Estás a un paso de transformar la gestión de tu complejo deportivo.
              </p>
              
              <!-- Features grid -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
                <tr>
                  <td width="33%" style="padding:12px;background:rgba(14,165,233,0.1);border-radius:12px;text-align:center;border:1px solid rgba(14,165,233,0.2);">
                    <div style="font-size:24px;">📅</div>
                    <div style="color:#38bdf8;font-size:12px;font-weight:700;margin-top:4px;">Reservas</div>
                  </td>
                  <td width="4%"></td>
                  <td width="30%" style="padding:12px;background:rgba(14,165,233,0.1);border-radius:12px;text-align:center;border:1px solid rgba(14,165,233,0.2);">
                    <div style="font-size:24px;">🏟️</div>
                    <div style="color:#38bdf8;font-size:12px;font-weight:700;margin-top:4px;">Canchas</div>
                  </td>
                  <td width="4%"></td>
                  <td width="29%" style="padding:12px;background:rgba(14,165,233,0.1);border-radius:12px;text-align:center;border:1px solid rgba(14,165,233,0.2);">
                    <div style="font-size:24px;">📊</div>
                    <div style="color:#38bdf8;font-size:12px;font-weight:700;margin-top:4px;">Reportes</div>
                  </td>
                </tr>
              </table>
              
              <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:24px 0;">
                Tu prueba gratuita de <strong style="color:#38bdf8;">7 días</strong> ya está activa. ¡Aprovéchala al máximo!
              </p>
              
              <!-- CTA Button -->
              <div style="text-align:center;margin:32px 0;">
                <a href="${process.env.FRONTEND_URL}/dashboard" 
                   style="display:inline-block;background:#0ea5e9;color:#0f172a;font-weight:800;font-size:16px;padding:16px 40px;border-radius:12px;text-decoration:none;letter-spacing:-0.3px;">
                  Ir a mi Dashboard →
                </a>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;border-top:1px solid rgba(255,255,255,0.05);text-align:center;">
              <p style="color:#475569;font-size:12px;margin:0;">
                © 2025 PichangaLibre · Gestión deportiva profesional<br>
                <a href="${process.env.FRONTEND_URL}" style="color:#38bdf8;text-decoration:none;">pichangalibre.xyz</a>
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    });
  }

  async sendPasswordResetEmail(email: string, resetLink: string): Promise<void> {
    await this.resend.emails.send({
      from: this.fromEmail,
      to: email,
      subject: 'Restablecer tu contraseña - PichangaLibre',
      html: `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#1e293b;border-radius:24px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0ea5e9,#38bdf8);padding:40px;text-align:center;">
              <div style="font-size:36px;font-weight:900;color:#0f172a;letter-spacing:-1px;">
                🔐 PichangaLibre
              </div>
              <p style="color:#0f172a;opacity:0.7;margin:8px 0 0;font-size:14px;">Seguridad de cuenta</p>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h1 style="color:#f8fafc;font-size:26px;font-weight:800;margin:0 0 16px;">
                ¿Olvidaste tu contraseña?
              </h1>
              <p style="color:#94a3b8;font-size:16px;line-height:1.6;margin:0 0 24px;">
                Recibimos una solicitud para restablecer la contraseña de tu cuenta. Haz click en el botón de abajo para crear una nueva.
              </p>
              
              <!-- Warning box -->
              <div style="background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.2);border-radius:12px;padding:16px;margin:24px 0;">
                <p style="color:#fbbf24;font-size:13px;margin:0;">
                  ⚠️ Este link expirará en <strong>1 hora</strong>. Si no solicitaste este cambio, ignora este correo.
                </p>
              </div>
              
              <!-- CTA Button -->
              <div style="text-align:center;margin:32px 0;">
                <a href="${resetLink}" 
                   style="display:inline-block;background:#0ea5e9;color:#0f172a;font-weight:800;font-size:16px;padding:16px 40px;border-radius:12px;text-decoration:none;">
                  Restablecer Contraseña →
                </a>
              </div>
              
              <p style="color:#475569;font-size:13px;line-height:1.6;margin:16px 0 0;">
                Si el botón no funciona, copia y pega este link en tu navegador:<br>
                <a href="${resetLink}" style="color:#38bdf8;word-break:break-all;">${resetLink}</a>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;border-top:1px solid rgba(255,255,255,0.05);text-align:center;">
              <p style="color:#475569;font-size:12px;margin:0;">
                © 2025 PichangaLibre · <a href="${process.env.FRONTEND_URL}" style="color:#38bdf8;text-decoration:none;">pichangalibre.xyz</a>
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    });
  }
}
