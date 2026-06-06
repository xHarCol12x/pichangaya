import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Actualizando permisos avanzados en los planes...');

  const planPermissions = {
    FREE_TRIAL: {
      canViewCalendar: true,
      canDeleteBookings: true,
      canExportData: true,
      canSendWhatsapp: true,
      canSetAdvancedPricing: true,
      whatsapp_chat: true,
      canUsePredictiveAI: true,
    },
    BASIC: {
      canViewCalendar: true,
      canDeleteBookings: false,
      canExportData: false,
      canSendWhatsapp: false,
      canSetAdvancedPricing: false,
      whatsapp_chat: false,
      canUsePredictiveAI: false,
    },
    PRO: {
      canViewCalendar: true,
      canDeleteBookings: true,
      canExportData: true,
      canSendWhatsapp: true,
      canSetAdvancedPricing: true,
      whatsapp_chat: false,
      canUsePredictiveAI: false,
    },
    ENTERPRISE: {
      canViewCalendar: true,
      canDeleteBookings: true,
      canExportData: true,
      canSendWhatsapp: true,
      canSetAdvancedPricing: true,
      whatsapp_chat: true,
      canUsePredictiveAI: true,
    },
  };

  for (const [code, permissions] of Object.entries(planPermissions)) {
    await prisma.subscriptionPlan.updateMany({
      where: { code },
      data: { permissions },
    });
    console.log(`✅ Permisos actualizados para el plan: ${code}`);
  }

  console.log('✨ Sincronización de permisos finalizada.');
}

main()
  .catch((e) => {
    console.error('❌ Error actualizando permisos:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
