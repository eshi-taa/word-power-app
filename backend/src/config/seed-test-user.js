const prisma = require('./database');
const bcrypt = require('bcryptjs');

async function seedTestUser() {
  try {
    const passwordHash = await bcrypt.hash('password', 10);
    const user = await prisma.user.upsert({
      where: { email: 'test@test.com' },
      update: {
        name: 'Test User',
        phone: '+919999999999',
        passwordHash,
        verified: true
      },
      create: {
        name: 'Test User',
        email: 'test@test.com',
        phone: '+919999999999',
        passwordHash,
        verified: true
      }
    });
    console.log('Test user seeded:', user.email);

    // Get the main words to associate progress
    const mainWords = await prisma.mainWord.findMany();
    const egoWord = mainWords.find(w => w.word === 'EGO');
    const alterWord = mainWords.find(w => w.word === 'ALTER');

    if (egoWord) {
      await prisma.userProgress.upsert({
        where: {
          userId_mainWordId: {
            userId: user.id,
            mainWordId: egoWord.id
          }
        },
        update: {
          studied: true,
          quizUnlocked: true
        },
        create: {
          userId: user.id,
          mainWordId: egoWord.id,
          studied: true,
          quizUnlocked: true
        }
      });
      console.log('Seeded progress for EGO main word');
    }

    if (alterWord) {
      await prisma.userProgress.upsert({
        where: {
          userId_mainWordId: {
            userId: user.id,
            mainWordId: alterWord.id
          }
        },
        update: {
          studied: true,
          quizUnlocked: false
        },
        create: {
          userId: user.id,
          mainWordId: alterWord.id,
          studied: true,
          quizUnlocked: false
        }
      });
      console.log('Seeded progress for ALTER main word');
    }

  } catch (err) {
    console.error('Error seeding test user:', err);
  } finally {
    await prisma.$disconnect();
  }
}

seedTestUser();
