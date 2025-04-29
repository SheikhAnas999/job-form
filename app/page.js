'use client';
import { useState, useEffect } from 'react';
import TraitsForm from './components/TraitsForm';
import IQTest from './components/IQTest';
import SituationalTest from './components/SituationalTest';
import styles from './page.module.css';
import { initEmailJS, sendAssessmentResults } from './utils/emailService';

export default function Home() {
  const [currentStep, setCurrentStep] = useState('traits');
  const [personalInfo, setPersonalInfo] = useState(null);
  const [traitsResults, setTraitsResults] = useState(null);
  const [iqResults, setIQResults] = useState(null);
  const [situationalResults, setSituationalResults] = useState(null);
  const [emailStatus, setEmailStatus] = useState({ sent: false, message: '' });

  // Initialize EmailJS when component mounts
  useEffect(() => {
    initEmailJS();
  }, []);

  const handleTraitsSubmit = (results) => {
    setPersonalInfo(results.personalInfo);
    setTraitsResults(results.answers);
    setCurrentStep('iq');
  };

  const handleIQSubmit = (results) => {
    setIQResults(results);
    setCurrentStep('situational');
  };
  
  const handleSituationalSubmit = (results) => {
    setSituationalResults(results);
    setCurrentStep('results');
  };

  const renderResults = () => {
    // Create a detailed results object with all assessment data
    const combinedResults = {
      timestamp: new Date().toISOString(),
      personalInfo,
      traits: {
        questions: traitsResults,
        totalQuestions: traitsResults.length,
        summary: traitsResults.reduce((acc, item) => {
          if (!acc[item.trait]) {
            acc[item.trait] = [];
          }
          acc[item.trait].push(item.response);
          return acc;
        }, {})
      },
      iqTest: {
        score: iqResults.score,
        correctAnswers: iqResults.correctAnswers,
        totalQuestions: iqResults.totalQuestions,
        detailedAnswers: iqResults.answers,
        allQuestions: iqResults.allQuestions
      },
      situational: {
        responses: situationalResults.questions,
        totalScenarios: situationalResults.totalQuestions,
        allQuestions: situationalResults.allQuestions
      },
      metadata: {
        completionTime: new Date().toISOString(),
        platform: navigator.userAgent
      }
    };

    // Log the complete data
    console.log('Complete Assessment Results:', JSON.stringify(combinedResults, null, 2));
    
    // Send email with results if not already sent
    if (!emailStatus.sent) {
      sendResultsByEmail(combinedResults);
    }

    return (
      <div className={styles.results}>
        <h2>Thanks for submitting your answers.</h2>
        <p>Your results have been recorded.</p>
        {emailStatus.message && (
          <p className={emailStatus.sent ? styles.successMessage : styles.errorMessage}>
            {emailStatus.message}
          </p>
        )}
      </div>
    );
  };
  
  // Function to send results by email
  const sendResultsByEmail = async (data) => {
//backend API to be added here
  };

  return (
    <main className={styles.main}>
      {currentStep === 'traits' && (
        <TraitsForm onSubmit={handleTraitsSubmit} />
      )}
      
      {currentStep === 'iq' && (
        <IQTest 
          onSubmit={handleIQSubmit}
          personalInfo={personalInfo}
        />
      )}
      
      {currentStep === 'situational' && (
        <SituationalTest
          onSubmit={handleSituationalSubmit}
          personalInfo={personalInfo}
        />
      )}

      {currentStep === 'results' && renderResults()}
    </main>
  );
}
