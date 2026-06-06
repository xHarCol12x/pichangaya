import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import {
  MercadoPagoConfig,
  Preference,
  PreApproval,
  Payment,
} from 'mercadopago';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class MercadoPagoService {
  private client: MercadoPagoConfig;
  private readonly logger = new Logger(MercadoPagoService.name);

  constructor(private prisma: PrismaService) {
    this.client = new MercadoPagoConfig({
      accessToken: process.env.MP_ACCESS_TOKEN || '',
      options: { timeout: 5000 },
    });
  }

  async createPreference(userId: string, planName: string, price: number) {
    try {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new Error('Usuario no encontrado');

      const preference = new Preference(this.client);
      const result = await preference.create({
        body: {
          items: [
            {
              id: planName,
              title: `Plan ${planName} - PichangaLibre`,
              quantity: 1,
              unit_price: price,
              currency_id: 'PEN',
            },
          ],
          payer: {
            email: user.email,
            name: user.name || undefined,
          },
          back_urls: {
            success: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?status=success`,
            failure: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/billing?status=failure`,
            pending: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?status=pending`,
          },
          auto_return: 'approved',
          notification_url: `${process.env.BACKEND_URL || 'https://tu-ngrok-url.ngrok.io'}/mercadopago/webhook`,
          external_reference: userId,
        },
      });

      return result;
    } catch (error: any) {
      this.logger.error(
        `Error creando preferencia de MP: ${error.message || JSON.stringify(error)}`,
      );
      throw new HttpException(
        error.message ||
          'Error al conectar con Mercado Pago. Verifica tus Token/Llaves.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Nota: Para suscripciones (débito automático) se usa PreApproval
  async createSubscription(userId: string, planName: string, price: number) {
    try {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new Error('Usuario no encontrado');

      const preApproval = new PreApproval(this.client);
      const result = await preApproval.create({
        body: {
          back_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard`,
          reason: `Suscripción Plan ${planName} - PichangaLibre`,
          auto_recurring: {
            frequency: 1,
            frequency_type: 'months',
            transaction_amount: price,
            currency_id: 'PEN',
          },
          payer_email: user.email,
          status: 'pending',
          external_reference: userId,
        },
      });

      return result;
    } catch (error: any) {
      this.logger.error(
        `Error creando suscripción de MP: ${error.message || JSON.stringify(error)}`,
      );
      throw new HttpException(
        error.message ||
          'Error al conectar con Mercado Pago. Verifica tus Token/Llaves.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async handleWebhook(data: any) {
    this.logger.log(`Webhook de MP recibido: ${JSON.stringify(data)}`);

    if (data.type === 'payment' && data.data?.id) {
      try {
        const payment = new Payment(this.client);
        const paymentInfo = await payment.get({ id: data.data.id });

        if (paymentInfo.status === 'approved') {
          const userId = paymentInfo.external_reference;
          // By default, assuming PRO plan if they paid this specific amount.
          // If you want dynamic plans, you would extract it from paymentInfo.description or metadata.
          if (userId) {
            const user = await this.prisma.user.findUnique({
              where: { id: userId },
            });
            if (user) {
              const now = new Date();
              const nextMonth = new Date(now.setMonth(now.getMonth() + 1));

              // Determine the plan to assign
              let assignedPlan = user.plan;

              // Optional: Override if the payment description explicitly mentions another plan
              const description = (paymentInfo.description || '').toUpperCase();
              if (
                description.includes('BASIC') ||
                description.includes('BÁSICO')
              )
                assignedPlan = 'BASIC';
              else if (description.includes('PRO')) assignedPlan = 'PRO';
              else if (description.includes('ENTERPRISE'))
                assignedPlan = 'ENTERPRISE';

              await this.prisma.user.update({
                where: { id: userId },
                data: {
                  plan: assignedPlan,
                  isActive: true,
                  subscriptionEndsAt: nextMonth,
                },
              });
              this.logger.log(
                `Usuario ${userId} activado exitosamente en el plan ${assignedPlan} por pago MP.`,
              );
            }
          }
        }
      } catch (error: any) {
        this.logger.error(
          `Error procesando pago de MP webhook: ${error.message}`,
        );
      }
    }

    return { received: true };
  }
}
