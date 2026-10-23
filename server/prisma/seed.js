const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Clearing existing data...');
  await prisma.route.deleteMany();
  await prisma.terminal.deleteMany();

  const terminalData = [
    {
      name: '4 Kilo Terminal',
      latitude: 9.0345,
      longitude: 38.7636,
      routes: [
        { destinationName: 'Piassa', fare: 10, status: 'APPROVED' },
        { destinationName: 'Shiromeda', fare: 15, status: 'APPROVED' },
        { destinationName: 'Stadium', fare: 15, status: 'APPROVED' },
      ],
    },
    {
      name: 'Megenagna Terminal',
      latitude: 9.0205,
      longitude: 38.7958,
      routes: [
        { destinationName: 'Ayat', fare: 20, status: 'APPROVED' },
        { destinationName: 'Bole Dembel', fare: 15, status: 'APPROVED' },
        { destinationName: 'Stadium', fare: 15, status: 'APPROVED' },
      ],
    },
    {
      name: 'Bole Dembel',
      latitude: 9.0062,
      longitude: 38.7753,
      routes: [
        { destinationName: 'Mexico Square', fare: 15, status: 'APPROVED' },
        { destinationName: 'Piassa', fare: 20, status: 'APPROVED' },
        { destinationName: 'Megenagna Terminal', fare: 15, status: 'APPROVED' },
      ],
    },
    {
      name: 'Shiromeda',
      latitude: 9.0528,
      longitude: 38.7661,
      routes: [
        { destinationName: '4 Kilo Terminal', fare: 15, status: 'APPROVED' },
        { destinationName: 'Piassa', fare: 15, status: 'APPROVED' },
        { destinationName: 'Kera', fare: 25, status: 'APPROVED' },
      ],
    },
    {
      name: 'Mexico Square',
      latitude: 9.0102,
      longitude: 38.7461,
      routes: [
        { destinationName: 'Kera', fare: 10, status: 'APPROVED' },
        { destinationName: 'Stadium', fare: 10, status: 'APPROVED' },
        { destinationName: 'Bole Dembel', fare: 15, status: 'APPROVED' },
      ],
    },
  ];

  console.log('Seeding terminals and approved routes...');
  for (const t of terminalData) {
    const createdTerminal = await prisma.terminal.create({
      data: {
        name: t.name,
        latitude: t.latitude,
        longitude: t.longitude,
      },
    });

    const routeData = t.routes.map((r) => ({
      originId: createdTerminal.id,
      destinationName: r.destinationName,
      fare: r.fare,
      status: r.status,
    }));

    await prisma.route.createMany({
      data: routeData,
    });

    console.log(`Seeded ${createdTerminal.name} (ID: ${createdTerminal.id}) with ${routeData.length} approved routes.`);
  }

  console.log('Database seeded successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });