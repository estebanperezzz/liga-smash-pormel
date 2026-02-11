const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const OFFICIAL_IMAGE_BASE = 'https://www.smashbros.com/assets_v2/img/fighter';

// Convierte el nombre del personaje al codeName oficial (usa "_" y "and")
function toOfficialCodeName(name) {
  return name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/\//g, ' and ')
    .replace(/['".]/g, '')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\s/g, '_')
    .replace(/_+/g, '_');
}

function getOfficialImageUrl(name) {
  const codeName = toOfficialCodeName(name);
  return `${OFFICIAL_IMAGE_BASE}/${codeName}/main.png`;
}

// Lista completa de los 89 personajes de Super Smash Bros Ultimate
const characters = [
  "Mario", "Donkey Kong", "Link", "Samus", "Dark Samus", "Yoshi", "Kirby", 
  "Fox", "Pikachu", "Luigi", "Ness", "Captain Falcon", "Peach", "Daisy", 
  "Bowser", "Ice Climbers", "Sheik", "Zelda", "Dr. Mario", "Pichu", "Falco", 
  "Marth", "Lucina", "Young Link", "Ganondorf", "Mewtwo", "Roy", "Chrom", 
  "Mr. Game & Watch", "Meta Knight", "Pit", "Dark Pit", "Zero Suit Samus", 
  "Wario", "Snake", "Ike", "Pokemon Trainer", "Diddy Kong", "Lucas", "Sonic", 
  "King Dedede", "Olimar", "Lucario", "R.O.B.", "Toon Link", "Wolf", "Villager", 
  "Mega Man", "Wii Fit Trainer", "Rosalina & Luma", "Little Mac", "Greninja", 
  "Mii Brawler", "Mii Swordfighter", "Mii Gunner", "Palutena", "Pac-Man", 
  "Robin", "Shulk", "Bowser Jr.", "Duck Hunt", "Ryu", "Ken", "Cloud", "Corrin", 
  "Bayonetta", "Inkling", "Ridley", "Simon", "Richter", "King K. Rool", 
  "Isabelle", "Incineroar", "Piranha Plant", "Joker", "Hero", "Banjo & Kazooie", 
  "Terry", "Byleth", "Min Min", "Steve", "Sephiroth", "Pyra/Mythra", "Kazuya", 
  "Sora"
];

async function main() {
  console.log('ðŸŽ® Iniciando seed de personajes de Smash Bros Ultimate...');
  
  // Limpiar datos existentes
  console.log('ðŸ—‘ï¸  Limpiando datos existentes...');
  await prisma.matchResult.deleteMany();
  await prisma.match.deleteMany();
  await prisma.weeklyCharacter.deleteMany();
  await prisma.week.deleteMany();
  await prisma.player.deleteMany();
  await prisma.character.deleteMany();
  
  console.log(`ðŸ“ Generando imÃ¡genes oficiales para ${characters.length} personajes...`);

  // Insertar personajes
  let successCount = 0;
  let withImageCount = 0;
  
  for (const characterName of characters) {
    try {
      const characterData = {
        name: characterName,
        image: getOfficialImageUrl(characterName),
        series: null,
      };
      
      await prisma.character.create({
        data: characterData,
      });
      
      successCount++;
      if (characterData.image) {
        withImageCount++;
        console.log(`  âœ“ ${characterName} (con imagen)`);
      } else {
        console.log(`  â—‹ ${characterName} (sin imagen)`);
      }
    } catch (error) {
      console.log(`  âœ— Error con ${characterName}:`, error.message);
    }
  }
  
  console.log('\nâœ… Seed completado exitosamente!');
  console.log(`âœ¨ ${successCount} personajes agregados a la base de datos`);
  console.log(`ðŸ–¼ï¸  ${withImageCount} personajes con imÃ¡genes`);
  console.log(`ðŸ“Š ${successCount - withImageCount} personajes sin imÃ¡genes`);
}

main()
  .catch((e) => {
    console.error('âŒ Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
