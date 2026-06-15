import { Injectable, Logger, HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
import { MercadoPagoConfig, Preference, PreApproval, Payment } from 'mercadopago';
import { PrismaService } from '../../prisma.service';
import { BillingService } from '../billing/billing.service';

@Injectable()
export class MercadoPagoService {
    private client: MercadoPagoConfig;
    private readonly logger = new Logger(MercadoPagoService.name);

    constructor(
        private prisma: PrismaService,
        private billing: BillingService
    ) {
        this.client = new MercadoPagoConfig({
            accessToken: process.env.MP_ACCESS_TOKEN || '',
            options: { timeout: 10000 }
        });
    }

    async createPreference(userId: string, tenantId: string, planCode: string, interval: 'mensual' | 'anual' = 'mensual') {
        try {
            const user = await this.prisma.user.findUnique({ where: { id: userId } });
            if (!user) throw new NotFoundException('Usuario no encontrado');

            const plan = await this.prisma.subscriptionPlan.findUnique({ where: { code: planCode } });
            if (!plan) throw new NotFoundException('Plan no encontrado');

            const price = interval === 'mensual' ? plan.priceMensual : plan.priceAnual;

            const preference = new Preference(this.client);
            const result = await preference.create({
                body: {
                    items: [
                        {
                            id: plan.code,
                            title: `Plan ${plan.name} (${interval}) - PichangaLibre`,
                            quantity: 1,
                            unit_price: price,
                            currency_id: 'PEN'
                        }
                    ],
                    payer: {
                        email: user.email,
                        name: user.name || undefined
                    },
                    back_urls: {
                        success: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?status=success`,
                        failure: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/billing?status=failure`,
                        pending: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?status=pending`
                    },
                    auto_return: 'approved',
                    notification_url: `${process.env.BACKEND_URL || 'https://tu-ngrok-url.ngrok.io'}/mercadopago/webhook`,
                    external_reference: tenantId, // Using tenantId as external_reference
                    metadata: {
                        user_id: userId,
                        tenant_id: tenantId,
                        plan_code: plan.code,
                        interval: interval
                    }
                }
            });

            return result;
        } catch (error: any) {
            this.logger.error(`Error creando preferencia de MP: ${error.message || JSON.stringify(error)}`);
            if (error instanceof HttpException) throw error;
            throw new HttpException(
                error.message || 'Error al conectar con Mercado Pago.',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    async createSubscription(userId: string, tenantId: string, planCode: string) {
        try {
            const user = await this.prisma.user.findUnique({ where: { id: userId } });
            if (!user) throw new NotFoundException('Usuario no encontrado');

            const plan = await this.prisma.subscriptionPlan.findUnique({ where: { code: planCode } });
            if (!plan) throw new NotFoundException('Plan no encontrado');

            const preApproval = new PreApproval(this.client);
            const result = await preApproval.create({
                body: {
                    back_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard`,
                    reason: `Suscripción Plan ${plan.name} - PichangaLibre`,
                    auto_recurring: {
                        frequency: 1,
                        frequency_type: 'months',
                        transaction_amount: plan.priceMensual,
                        currency_id: 'PEN'
                    },
                    payer_email: user.email,
                    status: 'pending',
                    external_reference: tenantId, // Using tenantId
                }
            });

            return result;
        } catch (error: any) {
            this.logger.error(`Error creando suscripción de MP: ${error.message || JSON.stringify(error)}`);
            if (error instanceof HttpException) throw error;
            throw new HttpException(
                error.message || 'Error al conectar con Mercado Pago.',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    async handleWebhook(data: any, headers?: any) {
        this.logger.log(`Webhook de MP recibido: ${JSON.stringify(data)}`);

        const webhookId = data.id?.toString() || data.data?.id?.toString();
        if (webhookId) {
            const alreadyProcessed = await this.prisma.processedWebhook.findUnique({
                where: { webhookId }
            });
            if (alreadyProcessed) {
                this.logger.log(`Webhook ${webhookId} ya procesado anteriormente.`);
                return { received: true };
            }
        }

        if ((data.type === 'payment' || data.topic === 'payment') && (data.data?.id || data.id)) {
            const paymentId = data.data?.id || data.id;
            try {
                const mpPayment = new Payment(this.client);
                const paymentInfo = await mpPayment.get({ id: paymentId });

                if (paymentInfo.status === 'approved') {
                    const tenantId = paymentInfo.external_reference || paymentInfo.metadata?.tenant_id;
                    const userId = paymentInfo.metadata?.user_id;
                    const planCode = paymentInfo.metadata?.plan_code || 'PRO';

                    if (tenantId && userId) {
                        await this.billing.activatePlanForTenant(tenantId, planCode, {
                            amount: paymentInfo.transaction_amount || 0,
                            transactionId: paymentId.toString(),
                            source: 'MERCADOPAGO',
                            userId: userId
                        });

                        // Mark webhook as processed
                        if (webhookId) {
                            await this.prisma.processedWebhook.create({
                                data: {
                                    webhookId,
                                    source: 'MERCADOPAGO',
                                    type: data.type || data.topic,
                                    payload: data as any
                                }
                            });
                        }
                    }
                }
            } catch (error: any) {
                this.logger.error(`Error procesando pago de MP webhook: ${error.message}`);
            }
        }

        return { received: true };
    }

}
