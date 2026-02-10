const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Lista completa de los 89 personajes de Super Smash Bros Ultimate
const characters = [
  // Original 12
  "Mario",
  "Donkey Kong",
  "Link",
  "Samus",
  "Dark Samus",
  "Yoshi",
  "Kirby",
  "Fox",
  "Pikachu",
  "Luigi",
  "Ness",
  "Captain Falcon",
  
  // Melee
  "Peach",
  "Daisy",
  "Bowser",
  "Ice Climbers",
  "Sheik",
  "Zelda",
  "Dr. Mario",
  "Pichu",
  "Falco",
  "Marth",
  "Lucina",
  "Young Link",
  "Ganondorf",
  "Mewtwo",
  "Roy",
  "Chrom",
  "Mr. Game & Watch",
  
  // Brawl
  "Meta Knight",
  "Pit",
  "Dark Pit",
  "Zero Suit Samus",
  "Wario",
  "Snake",
  "Ike",
  "Pokemon Trainer",
  "Diddy Kong",
  "Lucas",
  "Sonic",
  "King Dedede",
  "Olimar",
  "Lucario",
  "R.O.B.",
  "Toon Link",
  "Wolf",
  
  // Smash 4
  "Villager",
  "Mega Man",
  "Wii Fit Trainer",
  "Rosalina & Luma",
  "Little Mac",
  "Greninja",
  "Mii Brawler",
  "Mii Swordfighter",
  "Mii Gunner",
  "Palutena",
  "Pac-Man",
  "Robin",
  "Shulk",
  "Bowser Jr.",
  "Duck Hunt",
  "Ryu",
  "Ken",
  "Cloud",
  "Corrin",
  "Bayonetta",
  
  // Ultimate Newcomers
  "Inkling",
  "Ridley",
  "Simon",
  "Richter",
  "King K. Rool",
  "Isabelle",
  "Incineroar",
  
  // DLC Fighters Pass 1
  "Piranha Plant",
  "Joker",
  "Hero",
  "Banjo & Kazooie",
  "Terry",
  "Byleth",
  
  // DLC Fighters Pass 2
  "Min Min",
  "Steve",
  "Sephiroth",
  "Pyra/Mythra",
  "Kazuya",
  "Sora",
];

async function main() {
  console.log('🎮 Iniciando seed de personajes de Smash Bros Ultimate...');
  
  // Limpiar datos existentes (opcional - comentar si no quieres limpiar)
  console.log('🗑️  Limpiando datos existentes...');
  await prisma.matchResult.deleteMany();
  await prisma.match.deleteMany();
  await prisma.weeklyCharacter.deleteMany();
  await prisma.week.deleteMany();
  await prisma.player.deleteMany();
  await prisma.character.deleteMany();
  
  // Insertar personajes
  console.log(`📝 Insertando ${characters.length} personajes...`);
  
  for (const characterName of characters) {
    await prisma.character.create({
      data: {
        name: characterName,
      },
    });
  }
  
  console.log('✅ Seed completado exitosamente!');
  console.log(`✨ ${characters.length} personajes han sido agregados a la base de datos`);
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
