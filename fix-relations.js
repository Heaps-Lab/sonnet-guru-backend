const fs = require('fs');
const path = require('path');

// Files to fix
const files = [
  'src/payments/payments.service.ts',
  'src/quizzes/quizzes.service.ts'
];

// Relation mappings
const relationReplacements = {
  "relations: ['user', 'course']": "relations: { user: true, course: true }",
  "relations: ['user', 'course', 'verifier', 'enrollment']": "relations: { user: true, course: true, verifier: true, enrollment: true }",
  "relations: ['course', 'verifier', 'enrollment']": "relations: { course: true, verifier: true, enrollment: true }",
  "relations: ['course', 'course.instructor', 'paymentClaim']": "relations: { course: { instructor: true }, paymentClaim: true }",
  "relations: ['user', 'paymentClaim']": "relations: { user: true, paymentClaim: true }",
  "relations: ['paymentClaim']": "relations: { paymentClaim: true }",
  "relations: ['course']": "relations: { course: true }",
  "relations: ['module', 'module.course']": "relations: { module: { course: true } }",
  "relations: ['quiz', 'quiz.questions', 'quiz.questions.options']": "relations: { quiz: { questions: { options: true } } }",
  "relations: ['quiz', 'answers', 'answers.question']": "relations: { quiz: true, answers: { question: true } }",
  "relations: [\n        'quiz',\n        'quiz.module',\n        'quiz.module.course',\n        'student',\n        'answers',\n        'answers.question',\n        'answers.question.options',\n      ]": "relations: { quiz: { module: { course: true } }, student: true, answers: { question: { options: true } } }",
  "relations: ['quiz']": "relations: { quiz: true }",
  "relations: ['student']": "relations: { student: true }",
  "relations: ['module', 'module.course', 'questions']": "relations: { module: { course: true }, questions: true }"
};

files.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  Object.entries(relationReplacements).forEach(([oldRel, newRel]) => {
    content = content.replace(new RegExp(oldRel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newRel);
  });
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Fixed: ${file}`);
});

console.log('All relation fixes applied!');
