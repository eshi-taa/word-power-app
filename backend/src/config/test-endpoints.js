const axios = require('axios');
const jwt = require('jsonwebtoken');
const prisma = require('./database');
const JWT_SECRET = process.env.JWT_SECRET || 'word-power-super-secret-jwt-key-minimum-32-chars';

async function runTests() {
  console.log('--- STARTING ENDPOINT TESTS ---');

  // Test 1: Health Check
  try {
    const healthRes = await axios.get('http://localhost:3000/health');
    console.log('Health Check Status:', healthRes.status);
    console.log('Health Check Response:', healthRes.data);
  } catch (err) {
    console.error('Health Check Failed:', err.message);
  }

  // Find or Create test user
  let user;
  try {
    user = await prisma.user.findUnique({
      where: { email: 'test@test.com' }
    });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: 'test@test.com',
          name: 'Test User'
        }
      });
      console.log('Created test user:', user.email);
    } else {
      console.log('Found test user:', user.email);
    }
  } catch (err) {
    console.error('Prisma User Query Failed:', err.message);
    process.exit(1);
  }

  // Sign Access Token
  const accessToken = jwt.sign(
    { userId: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: '15m' }
  );
  console.log('Generated JWT token:', accessToken);

  // Test 2: GET /api/words/groups
  let groups;
  try {
    const groupsRes = await axios.get('http://localhost:3000/api/words/groups', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    groups = groupsRes.data;
    console.log('Groups Status:', groupsRes.status);
    console.log('Groups count:', groups.length);
  } catch (err) {
    console.error('Groups Fetch Failed:', err.response ? err.response.data : err.message);
    process.exit(1);
  }

  // Test 3: GET /api/quiz/:groupId for CRED
  const credGroup = groups.find(g => g.root === 'CRED');
  if (!credGroup) {
    console.error('CRED group not found in DB!');
    process.exit(1);
  }

  // Before we fetch quiz, we need to mark group as studied, otherwise we get 403
  try {
    const studyRes = await axios.post('http://localhost:3000/api/words/groups/studied', {
      groupId: credGroup.id
    }, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    console.log('Mark Studied Status:', studyRes.status);
  } catch (err) {
    console.error('Mark Studied Failed:', err.response ? err.response.data : err.message);
  }

  try {
    const quizRes = await axios.get(`http://localhost:3000/api/quiz/${credGroup.id}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    console.log('Quiz Status:', quizRes.status);
    console.log('Quiz Questions count:', quizRes.data.questions.length);
    console.log('Quiz Questions samples:', JSON.stringify(quizRes.data.questions.map(q => ({ type: q.type, question: q.question })), null, 2));
  } catch (err) {
    console.error('Quiz Fetch Failed:', err.response ? err.response.data : err.message);
  }

  console.log('--- ENDPOINT TESTS COMPLETED ---');
  await prisma.$disconnect();
}

runTests();
