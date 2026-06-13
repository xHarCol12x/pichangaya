import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Iniciando migración de datos a Tenant ---');

    // 1. Obtener todos los usuarios con rol ADMIN (dueños actuales)
    const owners = await prisma.user.findMany({
        where: { role: 'ADMIN' },
        include: { venues: true }
    });

    console.log(`Encontrados ${owners.length} administradores para migrar.`);

    for (const owner of owners) {
        // 2. Crear un Tenant para este administrador
        const tenantName = `${owner.name || 'Negocio'} - Org`;
        
        // Verificar si ya existe un tenant para este usuario (idempotencia)
        let tenant = await prisma.tenant.findFirst({
            where: { members: { some: { userId: owner.id, role: 'OWNER' } } }
        });

        if (!tenant) {
            console.log(`Creando Tenant "${tenantName}" para usuario ${owner.email}`);
            tenant = await prisma.tenant.create({
                data: {
                    name: tenantName,
                    plan: owner.plan,
                    isActive: owner.isActive,
                    subscriptionEndsAt: owner.subscriptionEndsAt,
                    members: {
                        create: {
                            userId: owner.id,
                            role: 'OWNER'
                        }
                    }
                }
            });
        }

        // 3. Vincular todas sus sedes (Venues) al nuevo Tenant
        if (owner.venues.length > 0) {
            console.log(`Vinculando ${owner.venues.length} sedes al Tenant ${tenant.id}`);
            await prisma.venue.updateMany({
                where: { ownerId: owner.id },
                data: { tenantId: tenant.id }
            });
        }
    }

    console.log('--- Migración completada con éxito ---');
}

main()
    .catch((e) => {
        console.error('Error durante la migración:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
