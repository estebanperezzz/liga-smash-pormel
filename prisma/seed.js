const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const prisma = new PrismaClient();

// Mapeo de nombres para coincidir con la API
const characterMapping = {
  // Nombres en nuestra lista -> Nombres en la API
  "Donkey Kong": "donkey-kong",
  "Dark Samus": "dark-samus",
  "Ice Climbers": "ice-climbers",
  "Dr. Mario": "dr-mario",
  "Young Link": "young-link",
  "Meta Knight": "meta-knight",
  "Dark Pit": "dark-pit",
  "Zero Suit Samus": "zero-suit-samus",
  "Pokemon Trainer": "pokemon-trainer",
  "Diddy Kong": "diddy-kong",
  "King Dedede": "king-dedede",
  "Toon Link": "toon-link",
  "Mega Man": "mega-man",
  "Wii Fit Trainer": "wii-fit-trainer",
  "Rosalina & Luma": "rosalina-and-luma",
  "Little Mac": "little-mac",
  "Mii Brawler": "mii-brawler",
  "Mii Swordfighter": "mii-swordfighter",
  "Mii Gunner": "mii-gunner",
  "Bowser Jr.": "bowser-jr",
  "Duck Hunt": "duck-hunt",
  "King K. Rool": "king-k-rool",
  "Piranha Plant": "piranha-plant",
  "Banjo & Kazooie": "banjo-and-kazooie",
  "Min Min": "min-min",
  "Pyra/Mythra": "pyra-and-mythra",
};

// Función para normalizar nombres (convertir a formato slug)
function normalizeCharacterName(name) {
  // Si hay un mapeo específico, usarlo
  if (characterMapping[name]) {
    return characterMapping[name];
  }
  
  // Convertir a slug: lowercase, reemplazar espacios con guiones, etc.
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
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
  console.log('🎮 Iniciando seed de personajes de Smash Bros Ultimate...');
  
  // Limpiar datos existentes
  console.log('🗑️  Limpiando datos existentes...');
  await prisma.matchResult.deleteMany();
  await prisma.match.deleteMany();
  await prisma.weeklyCharacter.deleteMany();
  await prisma.week.deleteMany();
  await prisma.player.deleteMany();
  await prisma.character.deleteMany();
  
  console.log(`📝 Obteniendo información de ${characters.length} personajes desde la API...`);
  
  // Obtener todos los personajes de la API
  let apiCharacters = [];
  try {
    const response = await axios.get('https://smashbros-unofficial-api.vercel.app/api/v1/ultimate');
    apiCharacters = response.data;
    console.log(`✅ API respondió con ${apiCharacters.length} personajes`);
  } catch (error) {
    console.log('⚠️  No se pudo conectar con la API, continuando sin imágenes...');
  }
  
  // Crear mapa de personajes por nombre normalizado
  const apiCharactersMap = {};
  apiCharacters.forEach(char => {
    const slug = char.slug || normalizeCharacterName(char.name);
    apiCharactersMap[slug] = char;
  });
  
  // Insertar personajes
  let successCount = 0;
  let withImageCount = 0;
  
  for (const characterName of characters) {
    try {
      const slug = normalizeCharacterName(characterName);
      const apiChar = apiCharactersMap[slug];
      
      const characterData = {
        name: characterName,
        image: apiChar?.images?.portrait || null,
        series: apiChar?.series || null,
      };
      
      await prisma.character.create({
        data: characterData,
      });
      
      successCount++;
      if (characterData.image) {
        withImageCount++;
        console.log(`  ✓ ${characterName} (con imagen)`);
      } else {
        console.log(`  ○ ${characterName} (sin imagen)`);
      }
    } catch (error) {
      console.log(`  ✗ Error con ${characterName}:`, error.message);
    }
  }
  
  console.log('\n✅ Seed completado exitosamente!');
  console.log(`✨ ${successCount} personajes agregados a la base de datos`);
  console.log(`🖼️  ${withImageCount} personajes con imágenes`);
  console.log(`📊 ${successCount - withImageCount} personajes sin imágenes`);
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
