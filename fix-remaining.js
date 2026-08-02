const fs = require('fs');

// Fix quizzes service - replace delete with property omission
let quizzesContent = fs.readFileSync('src/quizzes/quizzes.service.ts', 'utf8');

// Replace delete operators with property omission using object spread
quizzesContent = quizzesContent.replace(
  /\/\/ Hide correct answers for students unless it's for review after submission\s+if \(!includeAnswers && user && user\.role === Role\.STUDENT\) \{\s+quiz\.questions\.forEach\(question => \{\s+delete question\.correctOptionIndex;\s+delete question\.explanation;\s+\}\);\s+\}/,
  `// Hide correct answers for students unless it's for review after submission
    if (!includeAnswers && user && user.role === Role.STUDENT) {
      quiz.questions = quiz.questions.map(question => {
        const { correctOptionIndex, explanation, ...rest } = question;
        return rest as QuizQuestion;
      });
    }`
);

// Fix null return type issue - add null check after transaction
quizzesContent = quizzesContent.replace(
  /return this\.dataSource\.transaction\(async \(manager\) => \{\s+\/\/ Process answers/,
  `const result = await this.dataSource.transaction(async (manager) => {
      // Process answers`
);

quizzesContent = quizzesContent.replace(
  /\/\/ Return updated submission\s+return manager\.findOne\(QuizSubmission, \{\s+where: \{ id: submission\.id \},\s+relations: \{ quiz: true, answers: \{ question: true \} \},\s+\}\);/,
  `// Return updated submission
      const updatedSubmission = await manager.findOne(QuizSubmission, {
        where: { id: submission.id },
        relations: { quiz: true, answers: { question: true } },
      });

      if (!updatedSubmission) {
        throw new NotFoundException('Submission not found after update');
      }

      return updatedSubmission;`
);

quizzesContent = quizzesContent.replace(
  /\}\);\s+\}\s+async getSubmission/,
  `});

    if (!result) {
      throw new NotFoundException('Failed to process quiz submission');
    }

    return result;
  }

  async getSubmission`
);

// Fix selectedOptionIndex nullable issue
quizzesContent = quizzesContent.replace(
  /const evaluation = this\.calculationService\.evaluateAnswer\(\s+answerDto\.selectedOptionIndex,/,
  `const evaluation = this.calculationService.evaluateAnswer(
          answerDto.selectedOptionIndex ?? -1,`
);

fs.writeFileSync('src/quizzes/quizzes.service.ts', quizzesContent, 'utf8');
console.log('Fixed quizzes service!');

// Fix payments service null return issue
let paymentsContent = fs.readFileSync('src/payments/payments.service.ts', 'utf8');

// Find and replace the verifyPayment return type issue
paymentsContent = paymentsContent.replace(
  /\/\/ Return updated claim\s+return manager\.findOne\(PaymentClaim, \{\s+where: \{ id: claimId \},\s+relations: \{ user: true, course: true, verifier: true, enrollment: true \},\s+\}\);/,
  `// Return updated claim
      const updatedClaim = await manager.findOne(PaymentClaim, {
        where: { id: claimId },
        relations: { user: true, course: true, verifier: true, enrollment: true },
      });

      if (!updatedClaim) {
        throw new NotFoundException('Payment claim not found after update');
      }

      return updatedClaim;`
);

fs.writeFileSync('src/payments/payments.service.ts', paymentsContent, 'utf8');
console.log('Fixed payments service!');

console.log('All remaining fixes applied!');
