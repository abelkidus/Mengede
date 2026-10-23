const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const terminals = [
        { name: '4 Kilo Terminal', latitude: 9.0345, longitude: 38.7636 },
        { name: 'Megenagna Terminal', latitude: 9.0205, longitude: 38.7958 },
        { name: 'Bole Dembel', latitude: 9.0062, longitude: 38.7753 },
        { name: 'Shiromeda', latitude: 9.0528, longitude: 38.7661 },
        { name: 'Mexico Square', latitude: 9.0102, longitude: 38.7461 }
    ];

    for (const t of terminals) {
        await prisma.terminal.create({ data: t });
    }
    console.log('Terminals seeded successfully.');
}

main().catch(e => {
    console.error(e);
    process.exit(1);
}).finally(async () => {
    await prisma.$disconnect();
});