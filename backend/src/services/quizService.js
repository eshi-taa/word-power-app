// 1. Generate 3-question quiz from an array of word objects
function generateQuiz(words) {
  if (!words || words.length < 3) {
    throw new Error('At least 3 words are required to generate a quiz');
  }

  // Question 1: Fill in the blank
  const word1 = words[0].word;
  const example1 = words[0].example;
  const regex = new RegExp(`\\b${word1}\\b`, 'gi');
  let sentence1 = example1.replace(regex, '______');
  if (sentence1 === example1) {
    sentence1 = example1.replace(new RegExp(word1, 'gi'), '______');
  }

  const q1 = {
    type: 'fill_blank',
    question: sentence1,
    answer: word1,
    hint: word1.charAt(0)
  };

  // Question 2: Definition match
  const q2 = {
    type: 'definition',
    question: `What word means: ${words[1].definition}?`,
    answer: words[1].word
  };

  // Question 3: Context / sentence usage
  const q3 = {
    type: 'context',
    question: `Write a sentence using the word "${words[2].word}" (Definition: ${words[2].definition}).`,
    answer: words[2].word
  };

  return [q1, q2, q3];
}

// 2. Score a quiz based on user answers
function scoreQuiz(questions, answers) {
  let score = 0;

  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];
    const userAnswer = (answers[i] || '').toString().toLowerCase().trim();
    const correctAnswer = (question.answer || '').toString().toLowerCase().trim();

    if (userAnswer && correctAnswer) {
      if (userAnswer.includes(correctAnswer) || correctAnswer.includes(userAnswer)) {
        score++;
      }
    }
  }

  return score;
}

module.exports = {
  generateQuiz,
  scoreQuiz
};
