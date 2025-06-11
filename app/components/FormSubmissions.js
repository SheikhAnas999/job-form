'use client';
import { useState, useEffect } from 'react';
import { getFormSubmissions } from '../utils/firestoreService';
import styles from '../admin/admin.module.css';

export default function FormSubmissions({ formId, formTitle }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedSubmission, setExpandedSubmission] = useState(null);
  const [activeTab, setActiveTab] = useState('analysis');
  const [expandedTest, setExpandedTest] = useState(null);

  useEffect(() => {
    const loadSubmissions = async () => {
      if (!formId) return;
      
      setLoading(true);
      try {
        const formSubmissions = await getFormSubmissions(formId);
        setSubmissions(formSubmissions);
        setError(null);
      } catch (error) {
        console.error(`Error loading submissions for form ${formId}:`, error);
        setError(`Failed to load submissions: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    loadSubmissions();
  }, [formId]);

  const toggleSubmission = (submissionId) => {
    if (expandedSubmission === submissionId) {
      setExpandedSubmission(null);
    } else {
      setExpandedSubmission(submissionId);
      setActiveTab('analysis'); // Default to analysis tab when expanding
      setExpandedTest(null); // Reset expanded test when changing submission
    }
  };

  const toggleTest = (testName) => {
    if (expandedTest === testName) {
      setExpandedTest(null);
    } else {
      setExpandedTest(testName);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Function to render analysis content based on type
  const renderAnalysis = (analysis) => {
    if (!analysis) return 'No analysis available';
    
    if (typeof analysis === 'string') {
      return analysis;
    }
    
    if (typeof analysis === 'object') {
      // Filter out the key metrics that are shown at the top
      const topMetrics = ['candidate_name', 'weighted_score', 'suitability_for_applied_role', 'remarks'];
      const otherMetrics = Object.entries(analysis).filter(([key]) => !topMetrics.includes(key));
      
      return (
        <div className={styles.analysisObject}>
          {otherMetrics.map(([key, value]) => (
            <div key={key} className={styles.analysisItem}>
              <h4>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h4>
              <div>{typeof value === 'object' ? JSON.stringify(value, null, 2) : value}</div>
            </div>
          ))}
        </div>
      );
    }
    
    return String(analysis);
  };
  
  // Function to render key metrics at the top of the analysis tab
  const renderKeyMetrics = (analysis) => {
    if (!analysis || typeof analysis !== 'object') return null;
    
    return (
      <div className={styles.keyMetrics}>
        {analysis.weighted_score && (
          <div className={styles.metricItem}>
            <span className={styles.metricLabel}>Weighted Score:</span>
            <span className={styles.metricValue}>{analysis.weighted_score}</span>
          </div>
        )}
        
        {analysis.suitability_for_applied_role && (
          <div className={styles.metricItem}>
            <span className={styles.metricLabel}>Suitability For Applied Role:</span>
            <span className={styles.metricValue}>{analysis.suitability_for_applied_role}</span>
          </div>
        )}
        
        {analysis.remarks && (
          <div className={styles.metricItem}>
            <span className={styles.metricLabel}>Remarks:</span>
            <span className={styles.metricValue}>{analysis.remarks}</span>
          </div>
        )}
      </div>
    );
  };

  // Function to render IQ Test content
  const renderIQTest = (submission) => {
    if (!submission?.rawData?.iqTest) return <p>No IQ test data available</p>;
    
    return (
      <div className={styles.testContent}>
        <div className={styles.testSummary}>
          <p><strong>Score:</strong> {submission.rawData.iqTest.score} / {submission.rawData.iqTest.totalQuestions}</p>
          <p><strong>Correct Answers:</strong> {submission.rawData.iqTest.correctAnswers}</p>
        </div>
        
        {submission.rawData.iqTest.allQuestions && (
          <div className={styles.detailedAnswers}>
            <h4>Questions and Answers</h4>
            <div className={styles.questionsAnswersList}>
              {submission.rawData.iqTest.allQuestions.map((question, index) => {
                const userAnswer = submission.rawData.iqTest.detailedAnswers.find(a => a.questionId === question.id);
                return (
                  <div key={question.id} className={styles.questionAnswerItem}>
                    <div className={styles.questionText}>
                      <strong>Q{index + 1}:</strong> {question.question}
                    </div>
                    <div className={styles.answerOptions}>
                      <div><strong>Options:</strong> {question.options.join(', ')}</div>
                      <div><strong>Correct Answer:</strong> {question.correctAnswer}</div>
                      <div className={`${styles.userAnswer} ${userAnswer?.isCorrect ? styles.correctAnswer : styles.wrongAnswer}`}>
                        <strong>User Answer:</strong> {userAnswer?.answer || 'Not answered'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Function to render Traits Test content
  const renderTraitsTest = (submission) => {
    if (!submission?.rawData?.traits) return <p>No traits assessment data available</p>;
    
    return (
      <div className={styles.testContent}>
        {submission.rawData.traits.questions && (
          <div className={styles.traitQuestionsList}>
            {submission.rawData.traits.questions.map((item, index) => (
              <div key={index} className={styles.traitQuestionItem}>
                <div className={styles.traitName}>
                  <strong>Trait:</strong> {item.trait}
                </div>
                <div className={styles.questionText}>
                  <strong>Q{item.questionNumber}:</strong> {item.question}
                  {item.questionUrdu && <div className={styles.urduQuestion}>{item.questionUrdu}</div>}
                </div>
                <div className={`${styles.responseValue} ${
                  item.response === 'agree' ? styles.agreeResponse : 
                  item.response === 'disagree' ? styles.disagreeResponse : 
                  styles.neutralResponse
                }`}>
                  <strong>Response:</strong> {item.response}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {submission.rawData.traits.summary && (
          <div className={styles.traitSummary}>
            <h4>Traits Summary</h4>
            {Object.entries(submission.rawData.traits.summary).map(([trait, responses]) => (
              <div key={trait} className={styles.traitSummaryItem}>
                <h5>{trait}</h5>
                <div className={styles.responseCounts}>
                  <span className={styles.agreeCount}>
                    Agree: {responses.filter(r => r === 'agree').length}
                  </span>
                  <span className={styles.neutralCount}>
                    Neutral: {responses.filter(r => r === 'neutral').length}
                  </span>
                  <span className={styles.disagreeCount}>
                    Disagree: {responses.filter(r => r === 'disagree').length}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Function to render Situational Test content
  const renderSituationalTest = (submission) => {
    if (!submission?.rawData?.situational) return <p>No situational test data available</p>;
    
    const situational = submission.rawData.situational;
    // Handle different possible data structures
    const responses = situational.responses || [];
    const questions = situational.allQuestions || [];
    
    // If responses is an array of objects with questionId and answer
    const isResponsesArray = Array.isArray(responses) && responses.length > 0;
    
    return (
      <div className={styles.testContent}>
        <div className={styles.testSummary}>
          <p><strong>Total Scenarios:</strong> {situational.totalScenarios || responses.length || 0}</p>
        </div>
        
        {isResponsesArray ? (
          <div className={styles.situationalResponses}>
            <h4>Scenarios and Responses</h4>
            <div className={styles.scenariosList}>
              {responses.map((response, index) => {
                // Try to find matching question
                const questionId = response.questionId || response.id;
                const scenario = questions.find(q => q.id === questionId) || {};
                
                // Get question text from either source
                const questionText = scenario.scenario || response.question || response.scenario;
                
                return (
                  <div key={questionId || index} className={styles.scenarioItem}>
                    <div className={styles.scenarioText}>
                      <h5>Scenario {index + 1}</h5>
                      {questionText ? (
                        <p>{questionText}</p>
                      ) : (
                        <p>Question details not available</p>
                      )}
                    </div>
                    <div className={styles.scenarioResponse}>
                      <strong>Response:</strong>
                      <p>{response.answer || response.response || 'No response provided'}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className={styles.noData}>
            <p>No situational test responses available in the expected format.</p>
            <details>
              <summary>Debug Information</summary>
              <pre>{JSON.stringify(situational, null, 2)}</pre>
            </details>
          </div>
        )}
      </div>
    );
  };

  // Function to render raw response data
  const renderRawResponse = (submission) => {
    if (!submission || !submission.rawData) return <p>No response data available</p>;
    
    const tests = [
      { id: 'iqTest', name: 'IQ Test', available: !!submission.rawData.iqTest },
      { id: 'traitsTest', name: 'Traits Assessment', available: !!submission.rawData.traits },
      { id: 'situationalTest', name: 'Situational Test', available: !!submission.rawData.situational }
    ];
    
    return (
      <div className={styles.rawResponse}>
        <div className={styles.testsList}>
          {tests.filter(test => test.available).map(test => (
            <div key={test.id} className={styles.testItem}>
              <div 
                className={`${styles.testHeader} ${expandedTest === test.id ? styles.testHeaderActive : ''}`}
                onClick={() => toggleTest(test.id)}
              >
                <span className={styles.testName}>{test.name}</span>
                <span className={styles.testToggle}>{expandedTest === test.id ? '▼' : '►'}</span>
              </div>
              
              {expandedTest === test.id && (
                <div className={styles.testDetails}>
                  {test.id === 'iqTest' && renderIQTest(submission)}
                  {test.id === 'traitsTest' && renderTraitsTest(submission)}
                  {test.id === 'situationalTest' && renderSituationalTest(submission)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loader}></div>
        <p>Loading submissions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorMessage}>
        {error}
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className={styles.section}>
        <h2>Submissions for {formTitle}</h2>
        <p>No submissions found for this form.</p>
      </div>
    );
  }

  return (
    <div className={styles.section}>
      <h2>Submissions for {formTitle}</h2>
      <p>Total submissions: {submissions.length}</p>
      
      <div className={styles.submissionsList}>
        {submissions.map((submission) => (
          <div key={submission.id} className={styles.submissionItem}>
            <div 
              className={styles.submissionHeader}
              onClick={() => toggleSubmission(submission.id)}
            >
              <div className={styles.submissionName}>
                {submission.rawData?.personalInfo?.name || 'Anonymous'}
              </div>
              <div className={styles.submissionDate}>
                {formatDate(submission.timestamp)}
              </div>
              <div className={styles.submissionExpand}>
                {expandedSubmission === submission.id ? '▼' : '►'}
              </div>
            </div>
            
            {expandedSubmission === submission.id && (
              <div className={styles.submissionDetails}>
                <div className={styles.candidateHeader}>
                  <h3 className={styles.candidateName}>
                    {typeof submission.analysis === 'object' && submission.analysis.candidate_name 
                      ? submission.analysis.candidate_name 
                      : submission.rawData?.personalInfo?.name || 'Anonymous'}
                  </h3>
                </div>
                
                <div className={styles.submissionTabs}>
                  <button 
                    className={`${styles.submissionTabButton} ${activeTab === 'analysis' ? styles.activeSubmissionTab : ''}`}
                    onClick={() => setActiveTab('analysis')}
                  >
                    Analysis
                  </button>
                  <button 
                    className={`${styles.submissionTabButton} ${activeTab === 'response' ? styles.activeSubmissionTab : ''}`}
                    onClick={() => setActiveTab('response')}
                  >
                    Response Data
                  </button>
                </div>
                
                {activeTab === 'analysis' && (
                  <div className={styles.analysisTab}>
                    {renderKeyMetrics(submission.analysis)}
                    <h3>Detailed Analysis</h3>
                    <div className={styles.analysisContent}>
                      {renderAnalysis(submission.analysis)}
                    </div>
                  </div>
                )}
                
                {activeTab === 'response' && (
                  <div className={styles.responseTab}>
                    {renderRawResponse(submission)}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 