import { AiToolsService } from './src/ai-tools/ai-tools.service';

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

async function run() {
    const service = new AiToolsService(new MockPrisma() as any);

    // Warmup
    await service.getAvailability('2023-10-10', 'venue_1');

    const start = performance.now();
    for (let i = 0; i < 50; i++) {
        await service.getAvailability('2023-10-10', 'venue_1');
    }
    const end = performance.now();

    console.log(`Time taken: ${(end - start).toFixed(2)} ms`);
}

run().catch(console.error);
