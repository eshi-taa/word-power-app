const prisma = require('./database');
const path = require('path');
const fs = require('fs');

async function main() {
  const wordsPath = path.join(__dirname, '../../../data/words.json');
  const data = JSON.parse(fs.readFileSync(wordsPath, 'utf8'));

  const orderMap = {
    'EGO': 1,
    'ALTER': 2,
    'VERT': 3,
    'MIS': 4,
    'DERMA': 5,
    'PSYCHE': 6,
    'OPHTHAL': 7,
    'ORTHO': 8
  };

  for (const item of data) {
    const order = orderMap[item.root] || 1;

    const seededGroup = await prisma.wordGroup.upsert({
      where: { root: item.root },
      update: {
        meaning: item.meaning,
        order,
        words: {
          deleteMany: {},
          create: item.words.map(w => ({
            word: w.word,
            definition: w.definition,
            example: w.example,
            phonetic: w.phonetic,
          }))
        }
      },
      create: {
        root: item.root,
        meaning: item.meaning,
        order,
        words: {
          create: item.words.map(w => ({
            word: w.word,
            definition: w.definition,
            example: w.example,
            phonetic: w.phonetic,
          }))
        }
      }
    });

    console.log(`Seeded: ${seededGroup.root}`);
  }
}

main()
  .catch(e => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
