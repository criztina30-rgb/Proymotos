import { prisma } from '../src/prisma.js';

async function main() {
  console.log("Seeding database...");

  // Clear existing motorcycles just in case
  await prisma.motorcycle.deleteMany();

  const motos = [
    {
      brand: "Yamaha",
      model: "MT-09",
      year: 2024,
      price: 120.0,
      engineCapacity: 890,
      imageUrl: "/moto_naked.png",
      description: "La Yamaha MT-09 es una motocicleta Naked de alto rendimiento, perfecta para la ciudad y carreteras abiertas.",
      category: "Urbana",
      available: true
    },
    {
      brand: "Ducati",
      model: "Panigale V4",
      year: 2023,
      price: 250.0,
      engineCapacity: 1103,
      imageUrl: "/moto_sport.png",
      description: "Diseñada para la pista. La máxima expresión de velocidad, aerodinámica y tecnología.",
      category: "Sport",
      available: true
    },
    {
      brand: "BMW",
      model: "R 1250 GS",
      year: 2024,
      price: 180.0,
      engineCapacity: 1254,
      imageUrl: "/moto_adventure.png",
      description: "La reina de las aventuras. Supera cualquier terreno con comodidad y potencia inigualables.",
      category: "Adventure",
      available: true
    },
    {
      brand: "Harley-Davidson",
      model: "Fat Boy 114",
      year: 2023,
      price: 150.0,
      engineCapacity: 1868,
      imageUrl: "/moto_cruiser.png",
      description: "Estilo icónico y un motor Milwaukee-Eight 114 que ruge en cada kilómetro.",
      category: "Cruiser",
      available: true
    }
  ];

  for (const moto of motos) {
    await prisma.motorcycle.create({ data: moto });
  }

  console.log("Seeding finished!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
