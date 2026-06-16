const prisma = require('./database');
const path = require('path');
const fs = require('fs');

async function main() {
  const wordsPath = path.join(__dirname, '../../../data/words.json');
  const data = JSON.parse(fs.readFileSync(wordsPath, 'utf8'));

  for (const item of data) {
    const seededGroup = await prisma.wordGroup.upsert({
      where: { root: item.root },
      update: {
        meaning: item.meaning,
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
