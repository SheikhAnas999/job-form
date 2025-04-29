'use client';
import { useState, useEffect } from 'react';
import { generateQuestions } from '../utils/geminiService';
import styles from './SituationalTest.module.css';

const SituationalTest = ({ onSubmit, personalInfo }) => {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Load questions from Gemini API
    const loadQuestions = async () => {
      try {
        setLoading(true);
        
        // Hardcoded job title and description for now
        // In a real scenario, these could be from user input or configuration
        const jobTitle = "Software Developer";
        const jobDescription = "Responsible for designing, developing, and maintaining software applications. Works with team members to deliver high-quality code, troubleshoot issues, and implement new features.";
        
        const generatedQuestions = await generateQuestions(jobTitle, jobDescription);
        console.log(generatedQuestions);
        setQuestions(generatedQuestions);
        setLoading(false);
      } catch (err) {
        console.error("Error loading questions:", err);
        setError("Failed to generate questions. Please try again.");
        setLoading(false);
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
    
    if (Object.keys(answers).length < questions.length) {
      alert('Please answer all questions before submitting');
      return;
    }
    
    // Prepare results
    const results = {
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

  if (loading) {
    return <div className={styles.loading}>Generating situational questions...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <div className={styles.situationalContainer}>
      <h2 className={styles.title}>Situational Assessment</h2>
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