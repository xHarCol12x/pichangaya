import { PrismaClient } from '@prisma/client';
import { TasksService } from './tasks.service';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding data for benchmark...');
  // Clean up
  await prisma.analyticsLog.deleteMany();
  await prisma.user.deleteMany();

  // Create 1000 expired users
  const now = new Date();
  const past = new Date(now.getTime() - 1000000);

  console.log('Creating 1000 expired users...');

  const users = Array.from({ length: 1000 }).map((_, i) => ({
    email: `test${i}@example.com`,
    password: 'password',
    isActive: true,
    subscriptionEndsAt: past,
    role: 'ADMIN' as const,
  }));

  await prisma.user.createMany({
    data: users,
  });

  console.log('Finished seeding. Starting benchmark...');

  // The service uses injected PrismaService, we can mock it with the real one for the test
  // Or just instantiate the service
  const service = new TasksService(prisma as any);

  const start = process.hrtime();
  await service.handleSubscriptionExpiration();
  const diff = process.hrtime(start);

  const timeInMs = (diff[0] * 1e9 + diff[1]) / 1e6;
  console.log(`Benchmark finished in ${timeInMs} ms`);

  // Verify
  const activeUsers = await prisma.user.count({
    where: {
      isActive: true,
      role: 'ADMIN',
    }
  });
  console.log(`Active users after (should be 0): ${activeUsers}`);

  const logsCount = await prisma.analyticsLog.count();
  console.log(`Analytics logs count (should be 1000): ${logsCount}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
