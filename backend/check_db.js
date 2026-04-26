
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const venues = await prisma.venue.findMany({
    include: { fields: true }
  });
  console.log(JSON.stringify(venues, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
