'use client';
import { useState, useEffect } from 'react';
import styles from './IQTest.module.css';

const IQTest = ({ onSubmit, personalInfo }) => {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});

  useEffect(() => {
    // Load and process questions
    const loadQuestions = async () => {
      try {
        const response = await fetch('/questions.json');
        const allQuestions = await response.json();

        // Separate questions by difficulty
        const easyQuestions = allQuestions.filter(q => q.difficulty === 'easy');
        const mediumQuestions = allQuestions.filter(q => q.difficulty === 'medium');
        const hardQuestions = allQuestions.filter(q => q.difficulty === 'hard');

        // Randomly select questions
        const getRandomQuestions = (arr, count) => {
          const shuffled = [...arr].sort(() => 0.5 - Math.random());
          return shuffled.slice(0, count);
        };

        const selectedQuestions = [
          ...getRandomQuestions(easyQuestions, 5),
          ...getRandomQuestions(mediumQuestions, 3),
          ...getRandomQuestions(hardQuestions, 2)
        ].sort(() => 0.5 - Math.random()); // Shuffle all selected questions

        setQuestions(selectedQuestions);
      } catch (error) {
        console.error('Error loading questions:', error);
      }
    };

    loadQuestions();
  }, []);

  const handleAnswerChange = (questionIndex, selectedAnswer) => {
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: selectedAnswer
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Calculate score
    let correctAnswers = 0;
    questions.forEach((question, index) => {
      if (answers[index] === question.answer) {
        correctAnswers++;
      }
    });

    const score = (correctAnswers / questions.length) * 100;

    // Prepare results
    const results = {
      totalQuestions: questions.length,
      correctAnswers,
      score,
      answers: Object.entries(answers).map(([index, answer]) => ({
        questionNumber: parseInt(index) + 1,
        question: questions[index].question,
        questionUrdu: questions[index].urdu_question,
        userAnswer: answer,
        correctAnswer: questions[index].answer,
        isCorrect: answer === questions[index].answer,
        difficulty: questions[index].difficulty,
        options: questions[index].options
      })),
      allQuestions: questions
    };

    onSubmit(results);
  };

  if (questions.length === 0) {
    return <div className={styles.loading}>Loading questions...</div>;
  }

  return (
    <div className={styles.iqTestContainer}>
      <h2 className={styles.title}>IQ Assessment</h2>

      <form onSubmit={handleSubmit} className={styles.form}>
        {questions.map((question, index) => (
          <div key={index} className={styles.questionGroup}>
            <div className={styles.questionText}>
              <h3>Question {index + 1}</h3>
              <p className={styles.english}>{question.question}</p>
              <p className={styles.urdu}>{question.urdu_question}</p>
            </div>
            <div className={styles.options}>
              {question.options.map((option, optionIndex) => (
                <label key={optionIndex}>
                  <input
                    type="radio"
                    name={`question_${index}`}
                    value={option}
                    onChange={() => handleAnswerChange(index, option)}
                    required
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
        <button type="submit" className={styles.submitButton}>Next</button>
      </form>
    </div>
  );
};

export default IQTest; 