const { PrismaClient } = require('@prisma/client');

// Prisma Client with query extension to support nested seeding payload with lat/lng and destination
const prisma = new PrismaClient().$extends({
  query: {
    terminal: {
      async create({ args, query }) {
        if (args.data) {
          const d = args.data;
          const mappedData = {
            name: d.name,
            latitude: d.latitude !== undefined ? d.latitude : d.lat,
            longitude: d.longitude !== undefined ? d.longitude : d.lng,
          };
          if (d.routes?.create) {
            const list = Array.isArray(d.routes.create) ? d.routes.create : [d.routes.create];
            mappedData.routes = {
              create: list.map((r) => ({
                destinationName: r.destinationName || r.destination,
                fare: r.fare,
                status: r.status || 'APPROVED',
              })),
            };
          }
          args.data = mappedData;
        }
        return query(args);
      },
    },
  },
});

async function main() {
  console.log('Clearing existing data...');
  await prisma.route.deleteMany({});
  await prisma.terminal.deleteMany({});

  const terminals = [
    { name: "4 Kilo", lat: 9.0345, lng: 38.7637, routes: { create: [{ destination: "Mexico", fare: 20 }, { destination: "Megenagna", fare: 20 }, { destination: "Kazanchis", fare: 20 }, { destination: "Shiromeda", fare: 20 }, { destination: "Kaliti", fare: 70 }, { destination: "Bole", fare: 30 }] } },
    { name: "Shiromeda", lat: 9.0574, lng: 38.7673, routes: { create: [{ destination: "4 Kilo", fare: 20 }, { destination: "Mexico", fare: 40 }] } },
    { name: "Bole", lat: 8.9892, lng: 38.7885, routes: { create: [{ destination: "4 Kilo", fare: 30 }, { destination: "Mexico", fare: 30 }] } },
    { name: "Mexico", lat: 9.0105, lng: 38.7454, routes: { create: [{ destination: "4 Kilo", fare: 20 }, { destination: "Shiromeda", fare: 40 }, { destination: "Megenagna", fare: 30 }] } },
    { name: "Megenagna", lat: 9.0221, lng: 38.8005, routes: { create: [{ destination: "4 Kilo", fare: 20 }, { destination: "Shiromeda", fare: 40 }, { destination: "Mexico", fare: 30 }, { destination: "Ayat", fare: 40 }] } }
  ];

  console.log('Seeding transit terminals and routes...');
  for (const terminal of terminals) {
    const created = await prisma.terminal.create({
      data: terminal,
    });
    console.log(`Seeded terminal "${created.name}" (ID: ${created.id})`);
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