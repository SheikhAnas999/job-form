'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import TraitsForm from '../../components/TraitsForm';
import IQTest from '../../components/IQTest';
import SituationalTest from '../../components/SituationalTest';
import styles from '../../page.module.css';
import { getFormFromFirestore, saveAssessmentResultsToFirestore } from '../../utils/firestoreService';
import { generateAssessmentResults } from '../../utils/geminiService';

export default function JobFormPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Extract form ID from URL parameters
  const formId = searchParams.get('id');
  
  const [currentStep, setCurrentStep] = useState('traits');
  const [personalInfo, setPersonalInfo] = useState(null);
  const [traitsResults, setTraitsResults] = useState(null);
  const [iqResults, setIQResults] = useState(null);
  const [situationalResults, setSituationalResults] = useState(null);
  const [emailStatus, setEmailStatus] = useState({ sent: false, message: '' });
  const [formMetadata, setFormMetadata] = useState({
    loading: true,
    jobId: formId,
    jobTitle: 'Loading...',
    jobDescription: 'Please wait while we load the job details.',
    customTraits: [],
    generatedTraitQuestions: []
  });
  const [processingResults, setProcessingResults] = useState(false);
  const [assessmentAnalysis, setAssessmentAnalysis] = useState(null);
  
  // Load form data from Firestore on component mount
  useEffect(() => {
    const loadFormData = async () => {
      if (!formId) {
        setFormMetadata({
          loading: false,
          error: true,
          message: 'Invalid form URL. Please contact the administrator.'
        });
        return;
      }
      
      try {
        // Fetch form data from Firestore
        const formData = await getFormFromFirestore(formId);
        
        // Make formData available globally for components that need it
        window.formData = formData;
        
        setFormMetadata({
          loading: false,
          jobId: formId,
          jobTitle: formData.title,
          jobDescription: formData.description,
          customTraits: formData.traits || [],
          generatedTraitQuestions: formData.generatedTraitQuestions || []
        });
      } catch (error) {
        console.error("Error loading form data:", error);
        setFormMetadata({
          loading: false,
          error: true,
          message: 'Failed to load form. Please contact the administrator.'
        });
      }
    };

    loadFormData();
  }, [formId]);

  const handleTraitsSubmit = (results) => {
    // Store results with job metadata
    results.jobId = formMetadata.jobId;
    results.jobTitle = formMetadata.jobTitle;
    
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

  useEffect(() => {
    // Generate assessment analysis when all results are available
    const generateResults = async () => {
      if (currentStep === 'results' && personalInfo && traitsResults && iqResults && situationalResults) {
        setProcessingResults(true);
        
        try {
          // Create a detailed results object with all assessment data and job metadata
          const combinedResults = {
            timestamp: new Date().toISOString(),
            jobMetadata: {
              jobId: formMetadata.jobId,
              jobTitle: formMetadata.jobTitle,
              jobDescription: formMetadata.jobDescription
            },
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

          // Generate analysis using Gemini
          const analysis = await generateAssessmentResults(combinedResults, formMetadata.jobTitle);
          setAssessmentAnalysis(analysis);
          
          // Save results to Firestore
          await saveAssessmentResultsToFirestore(combinedResults, analysis);
          

        } catch (error) {
          console.error("Error generating assessment analysis:", error);
          setEmailStatus({
            sent: false,
            message: 'There was an error analyzing your results. Your data has been saved.'
          });
        } finally {
          setProcessingResults(false);
        }
      }
    };
    
    generateResults();
  }, [currentStep, personalInfo, traitsResults, iqResults, situationalResults]);

  const renderResults = () => {
    if (processingResults) {
      return (
        <div className={styles.loadingContainer}>
          <div className={styles.loader}></div>
          <h2>Analyzing your responses...</h2>
          <p>Please wait while we generate a comprehensive analysis of your assessment.</p>
          <p>This may take a moment as our AI evaluates your fit for the {formMetadata.jobTitle} role.</p>
        </div>
      );
    }
    
    return (
      <div className={styles.results}>
        <h2>Thanks for submitting your answers for {formMetadata.jobTitle} Job Application.</h2>
        <p>Your results have been recorded and are being analyzed.</p>
        {emailStatus.message && (
          <p className={emailStatus.sent ? styles.successMessage : styles.errorMessage}>
            {emailStatus.message}
          </p>
        )}
      </div>
    );
  };
  

  // Display error if form data failed to load
  if (formMetadata.error) {
    return (
      <div className={styles.error}>
        <h2>Error Loading Assessment</h2>
        <p>{formMetadata.message}</p>
      </div>
    );
  }

  // Show loading state while form data is being fetched
  if (formMetadata.loading) {
    return <div className={styles.loading}>Loading job assessment form...</div>;
  }

  return (
    <main className={styles.main}>
      
      {currentStep === 'traits' && (
        <TraitsForm 
          onSubmit={handleTraitsSubmit} 
          customTraits={formMetadata.customTraits}
          generatedTraitQuestions={formMetadata.generatedTraitQuestions}
        />
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
          jobTitle={formMetadata.jobTitle}
          jobDescription={formMetadata.jobDescription}
        />
      )}

      {currentStep === 'results' && renderResults()}
    </main>
  );
} 