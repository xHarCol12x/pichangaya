import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaService } from './prisma.service';
import * as bcrypt from 'bcrypt';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const prisma = app.get(PrismaService);

    const superAdminEmail = 'superadmin@fieldiq.com';
    const superAdminPassword = 'superadminpassword'; // Change in production!

    const existingAdmin = await prisma.user.findUnique({
        where: { email: superAdminEmail },
    });

    if (!existingAdmin) {
        const hashedPassword = await bcrypt.hash(superAdminPassword, 10);
        await prisma.user.create({
            data: {
                email: superAdminEmail,
                name: 'FieldIQ Super Admin',
                password: hashedPassword,
                role: 'SUPER_ADMIN',
                plan: 'ENTERPRISE', // Super admin gets everything
                isActive: true,
            },
        });
        console.log('✅ Super Admin account created successfully.');
        console.log(`Email: ${superAdminEmail}`);
        console.log(`Password: ${superAdminPassword}`);
    } else {
        console.log('ℹ️ Super Admin account already exists. Skipping seed.');
    }

    // Seed Dummy Tenants for testing the UI
    const now = new Date();

    // 1. Active Tenant
    const activeTenantEmail = 'cliente.activo@fieldiq.com';
    const existingActive = await prisma.user.findUnique({ where: { email: activeTenantEmail } });
    if (!existingActive) {
        const hash = await bcrypt.hash('password123', 10);
        await prisma.user.create({
            data: {
                email: activeTenantEmail,
                name: 'Canchas El Golazo',
                password: hash,
                role: 'ADMIN',
                plan: 'PRO',
                isActive: true,
                subscriptionEndsAt: new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()), // Next year
            }
        });
        console.log(`✅ Active Tenant created: ${activeTenantEmail}`);
    }

    // 2. Expired Tenant
    const expiredTenantEmail = 'cliente.moroso@fieldiq.com';
    const existingExpired = await prisma.user.findUnique({ where: { email: expiredTenantEmail } });
    if (!existingExpired) {
        const hash = await bcrypt.hash('password123', 10);
        await prisma.user.create({
            data: {
                email: expiredTenantEmail,
                name: 'Club Deportivo Sur',
                password: hash,
                role: 'ADMIN',
                plan: 'BASIC',
                isActive: false, // Expired
                subscriptionEndsAt: new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()), // Last month
            }
        });
        console.log(`✅ Expired Tenant created: ${expiredTenantEmail}`);
    }

    await app.close();
}
bootstrap();
