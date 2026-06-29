const assert = require('assert');
const { calculateNextLeitner } = require('./schedulerService');

console.log('Running Leitner Scheduler Unit Tests...');

try {
  // Test Case 1: Initial state is Box 1. Correct review should move to Box 2.
  let state = calculateNextLeitner(1, true);
  assert.strictEqual(state.nextBox, 2, 'Box 1 -> correct -> Box 2');
  
  // Verify correct intervals
  const expectedDateBox2 = new Date();
  expectedDateBox2.setDate(expectedDateBox2.getDate() + 3);
  assert.strictEqual(state.nextReviewDate.getDate(), expectedDateBox2.getDate(), 'Box 2 interval is 3 days');

  // Test Case 2: Move all the way up to Box 5 and ensure it caps at 5
  let currentBox = 1;
  for (let i = 0; i < 6; i++) {
    const result = calculateNextLeitner(currentBox, true);
    currentBox = result.nextBox;
  }
  assert.strictEqual(currentBox, 5, 'Box should cap at 5 after multiple correct reviews');

  // Test Case 3: Wrong answer from Box 4 should drop it to Box 1
  let resetState = calculateNextLeitner(4, false);
  assert.strictEqual(resetState.nextBox, 1, 'Box 4 -> incorrect -> resets to Box 1');
  
  const expectedDateBox1 = new Date();
  expectedDateBox1.setDate(expectedDateBox1.getDate() + 1);
  assert.strictEqual(resetState.nextReviewDate.getDate(), expectedDateBox1.getDate(), 'Box 1 interval is 1 day');

  console.log('✅ All Leitner Scheduler Unit Tests passed successfully!');
} catch (error) {
  console.error('❌ Unit Tests failed!');
  console.error(error);
  process.exit(1);
}
