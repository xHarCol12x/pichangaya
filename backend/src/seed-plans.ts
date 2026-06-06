import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Iniciando siembra de planes de suscripción...');

  const plans = [
    {
      code: 'FREE_TRIAL',
      name: 'Prueba Gratis',
      description:
        'Prueba todas las funciones premium gratis por 7 días. Ideal para conocer FieldIQ antes de decidirte.',
      priceMensual: 0,
      priceAnual: 0,
      limitVenues: 1,
      limitFields: 2,
      isActive: true,
      isPopular: false,
      icon: 'Zap',
      accent: '#6366f1', // Indigo
      accentLight: '#818cf8',
      features: [
        '7 días de prueba completa',
        'Hasta 1 sede',
        'Hasta 2 canchas',
        'Calendario en tiempo real',
        'Soporte básico',
      ],
      permissions: {
        canAddFields: true,
        canViewAnalytics: true,
        canUseAi: true,
      },
    },
    {
      code: 'BASIC',
      name: 'Plan Básico',
      description:
        'La solución esencial para complejos deportivos que están empezando a digitalizar su gestión.',
      priceMensual: 29.9,
      priceAnual: 23.9,
      limitVenues: 1,
      limitFields: 3,
      isActive: true,
      isPopular: false,
      icon: 'Star',
      accent: '#10b981', // Emerald
      accentLight: '#34d399',
      features: [
        '1 Sede física',
        'Hasta 3 canchas',
        'Gestión de clientes ilimitada',
        'Calendario de reservas mensual',
        'Soporte por email',
      ],
      permissions: {
        canAddFields: true,
        canViewAnalytics: true,
        canUseAi: false,
      },
    },
    {
      code: 'PRO',
      name: 'Plan Profesional',
      description:
        'Nuestra opción más popular para complejos en crecimiento que necesitan control total y analítica.',
      priceMensual: 59.9,
      priceAnual: 47.9,
      limitVenues: 3,
      limitFields: 10,
      isActive: true,
      isPopular: true,
      icon: 'Crown',
      accent: '#f59e0b', // Amber
      accentLight: '#fbbf24',
      features: [
        'Hasta 3 sedes',
        'Hasta 10 canchas',
        'Analítica avanzada de ingresos',
        'WhatsApp API integration',
        'Soporte prioritario 24/7',
      ],
      permissions: {
        canAddFields: true,
        canViewAnalytics: true,
        canUseAi: true,
      },
    },
    {
      code: 'ENTERPRISE',
      name: 'Plan Empresarial',
      description:
        'Máximo rendimiento para grandes clubes y franquicias con necesidades de escala y seguridad.',
      priceMensual: 199.9,
      priceAnual: 159.9,
      limitVenues: 99,
      limitFields: 99,
      isActive: true,
      isPopular: false,
      icon: 'Rocket',
      accent: '#ec4899', // Pink
      accentLight: '#f472b6',
      features: [
        'Sedes y canchas ilimitadas',
        'API personalizada',
        'Account Manager dedicado',
        'Reportes forenses',
        'Panel de administración multinivel',
      ],
      permissions: {
        canAddFields: true,
        canViewAnalytics: true,
        canUseAi: true,
      },
    },
  ];

  for (const plan of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { code: plan.code },
      update: plan,
      create: plan,
    });
    console.log(`✅ Plan ${plan.name} (${plan.code}) sincronizado.`);
  }

  console.log('✨ Siembra de planes finalizada con éxito.');
}

main()
  .catch((e) => {
    console.error('❌ Error sembrando planes:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
