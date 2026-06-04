import { AiToolsService } from './src/ai-tools/ai-tools.service';

const numFields = 1000;
const numBookings = 10000;

const fields = Array.from({ length: numFields }).map((_, i) => ({
    id: `field_${i}`,
    name: `Field ${i}`,
    type: 'Football',
    pricePerHour: 100,
    venueId: 'venue_1'
}));

const bookings = Array.from({ length: numBookings }).map((_, i) => ({
    id: `booking_${i}`,
    fieldId: `field_${i % numFields}`,
    startTime: new Date(),
    endTime: new Date(),
    status: 'CONFIRMED'
}));

class MockPrisma {
    field = {
        findMany: async () => fields
    };
    booking = {
        findMany: async () => bookings
    };
    venue = { findUnique: async () => null };
    client = { findFirst: async () => null, create: async () => null };
    $transaction = async () => null;
}

async function run() {
    const service = new AiToolsService(new MockPrisma() as any);

    // Warmup
    await service.getAvailability('2023-10-10', 'venue_1');

    let totalTime = 0;
    const iters = 50;

    for (let i = 0; i < iters; i++) {
        const start = performance.now();
        await service.getAvailability('2023-10-10', 'venue_1');
        const end = performance.now();
        totalTime += (end - start);
    }

    console.log(`Average time taken: ${(totalTime / iters).toFixed(2)} ms`);
    console.log(`Total time taken: ${totalTime.toFixed(2)} ms`);
}

run().catch(console.error);
