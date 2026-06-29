const prisma = require('./database');
const path = require('path');
const fs = require('fs');

async function main() {
  const wordsPath = path.join(__dirname, '../../../data/words.json');
  const data = JSON.parse(fs.readFileSync(wordsPath, 'utf8'));

  console.log('Clearing database records in cascade order...');
  await prisma.quizResult.deleteMany({});
  await prisma.userProgress.deleteMany({});
  await prisma.derivedWord.deleteMany({});
  await prisma.wordRoot.deleteMany({});
  await prisma.mainWord.deleteMany({});
  await prisma.chapter.deleteMany({});

  console.log('Seeding chapters, main words, roots, and derived words...');

  for (const chap of data) {
    const chapter = await prisma.chapter.create({
      data: {
        title: chap.chapterTitle,
        order: chap.order
      }
    });

    console.log(`Seeded Chapter: "${chapter.title}"`);

    for (let i = 0; i < chap.mainWords.length; i++) {
      const mw = chap.mainWords[i];
      const mainWord = await prisma.mainWord.create({
        data: {
          word: mw.word,
          meaning: mw.meaning,
          order: i + 1,
          chapterId: chapter.id
        }
      });

      console.log(`  Seeded Main Word: ${mainWord.word}`);

      for (const rt of mw.roots) {
        const root = await prisma.wordRoot.create({
          data: {
            name: rt.name,
            meaning: rt.meaning,
            mainWordId: mainWord.id
          }
        });

        if (rt.derivedWords && rt.derivedWords.length > 0) {
          await prisma.derivedWord.createMany({
            data: rt.derivedWords.map(dw => ({
              word: dw.word,
              definition: dw.definition,
              example: dw.example || null,
              phonetic: dw.phonetic || null,
              rootId: root.id
            }))
          });
        }
      }
    }
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch(e => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
