'use client';
import { useState, useEffect } from 'react';
import { getSituationalQuestions } from '../utils/firestoreService';
import styles from './SituationalTest.module.css';

const SituationalTest = ({ onSubmit, personalInfo, jobTitle, jobDescription }) => {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Load pre-generated questions from Firestore
    const loadQuestions = async () => {
      try {
        setLoading(true);
        
        // Create the form ID from the job title
        const formId = jobTitle
          .toLowerCase()
          .replace(/[^\w\s]/gi, '')
          .replace(/\s+/gi, '-');
        
        // Fetch questions from Firestore
        const storedQuestions = await getSituationalQuestions(formId);
        console.log(`Loaded ${storedQuestions.length} pre-generated questions for ${jobTitle}`);
        setQuestions(storedQuestions);
        setLoading(false);
      } catch (err) {
        console.error("Error loading questions:", err);
        setError("Failed to load pre-generated questions. Please contact the administrator.");
        setLoading(false);
      }
    };

    loadQuestions();
  }, [jobTitle]);

  const handleAnswerChange = (questionIndex, selectedAnswer) => {
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: selectedAnswer
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (Object.keys(answers).length < questions.length) {
      alert('Please answer all questions before submitting');
      return;
    }
    
    // Prepare results
    const results = {
      jobTitle,
      jobDescription,
      totalQuestions: questions.length,
      questions: questions.map((q, index) => ({
        questionNumber: index + 1,
        question: q.question,
        translation: q.translation,
        selectedOption: answers[index],
        allOptions: q.options,
        traits: q.traits
      })),
      allQuestions: questions
    };

    onSubmit(results);
  };

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <div className={styles.situationalContainer}>
      <h2 className={styles.title}>Situational Assessment for {jobTitle || 'Job Position'}</h2>
      <div className={styles.instructions}>
        <p>• Below are various workplace scenarios you might encounter</p>
        <p>• For each situation, choose the option that best describes how you would respond</p>
        <p>• There are no right or wrong answers - be honest about how you would actually behave</p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        {questions.map((question, index) => (
          <div key={index} className={styles.questionGroup}>
            <div className={styles.questionText}>
              <h3>Scenario {index + 1}</h3>
              <p className={styles.english}>{question.question}</p>
              <p className={styles.translation}>{question.translation}</p>
              
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
        <button type="submit" className={styles.submitButton}>Submit Responses</button>
      </form>
    </div>
  );
};

export default SituationalTest; 