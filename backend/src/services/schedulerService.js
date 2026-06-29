// Leitner Box Intervals in days
// Box 1 -> 1 day, Box 2 -> 3 days, Box 3 -> 7 days, Box 4 -> 14 days, Box 5 -> 30 days
const BOX_INTERVALS = {
  1: 1,
  2: 3,
  3: 7,
  4: 14,
  5: 30
};

/**
 * Calculates the next Leitner Box and next review date.
 * @param {number} currentBox - The current box (1 to 5)
 * @param {boolean} isCorrect - Did the user pass the review/quiz?
 * @returns {Object} { nextBox, nextReviewDate }
 */
function calculateNextLeitner(currentBox, isCorrect) {
  let nextBox = currentBox;

  if (isCorrect) {
    nextBox = Math.min(5, currentBox + 1);
  } else {
    nextBox = 1;
  }

  const daysInterval = BOX_INTERVALS[nextBox] || 1;
  const nextReviewDate = new Date();
  
  nextReviewDate.setDate(nextReviewDate.getDate() + daysInterval);

  return { nextBox, nextReviewDate };
}

module.exports = {
  calculateNextLeitner
};
