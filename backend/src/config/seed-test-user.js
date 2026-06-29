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

    // Get the word groups to associate progress
    const groups = await prisma.wordGroup.findMany();
    const credGroup = groups.find(g => g.root === 'CRED');
    const egoGroup = groups.find(g => g.root === 'EGO');

    if (credGroup) {
      await prisma.userProgress.upsert({
        where: {
          userId_groupId: {
            userId: user.id,
            groupId: credGroup.id
          }
        },
        update: {
          studied: true,
          quizUnlocked: true
        },
        create: {
          userId: user.id,
          groupId: credGroup.id,
          studied: true,
          quizUnlocked: true
        }
      });
      console.log('Seeded progress for CRED group');
    }

    if (egoGroup) {
      await prisma.userProgress.upsert({
        where: {
          userId_groupId: {
            userId: user.id,
            groupId: egoGroup.id
          }
        },
        update: {
          studied: true,
          quizUnlocked: false
        },
        create: {
          userId: user.id,
          groupId: egoGroup.id,
          studied: true,
          quizUnlocked: false
        }
      });
      console.log('Seeded progress for EGO group');
    }

  } catch (err) {
    console.error('Error seeding test user:', err);
  } finally {
    await prisma.$disconnect();
  }
}

seedTestUser();
