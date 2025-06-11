'use client';
import { useState, useEffect } from 'react';
import styles from './TraitsForm.module.css';

const TraitsForm = ({ onSubmit, customTraits = [], generatedTraitQuestions = [] }) => {
  const [questions, setQuestions] = useState([]);
  const [formData, setFormData] = useState({
    personalInfo: {
      name: '',
      cnic: ''
    },
    answers: {}
  });

  useEffect(() => {
    // Check if we have generated trait questions from Gemini
    const fetchFormData = async () => {
      let traitsToUse = [];
      
      if (generatedTraitQuestions && generatedTraitQuestions.length > 0) {
        // Use AI-generated trait questions if available
        traitsToUse = generatedTraitQuestions;
        console.log("Using AI-generated trait questions:", traitsToUse);
      }
      
      setQuestions(traitsToUse);

      // Initialize formData with question traits
      const initialAnswers = {};
      traitsToUse.forEach((question, index) => {
        initialAnswers[`question_${index}`] = '';
      });
      setFormData(prev => ({
        ...prev,
        answers: initialAnswers
      }));
    };
    
    fetchFormData();
  }, [customTraits, generatedTraitQuestions]);

  const handlePersonalInfoChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        [name]: value
      }
    }));
  };

  const handleChange = (e, questionIndex, trait) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      answers: {
        ...prev.answers,
        [`question_${questionIndex}`]: {
          trait: trait,
          answer: value
        }
      }
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.personalInfo.name || !formData.personalInfo.cnic) {
      alert('Please fill in your Name and CNIC before submitting.');
      return;
    }

    // Transform answers into an array for easier processing
    const answersArray = Object.entries(formData.answers).map(([key, value]) => {
        const questionIndex = parseInt(key.split('_')[1]);
        const questionDetails = questions[questionIndex];
        return {
          questionNumber: questionIndex + 1,
          trait: value.trait || questionDetails.trait,
          question: questionDetails.english,
          questionUrdu: questionDetails.urdu,
          response: value.answer,
          options: ['agree', 'neutral', 'disagree']
        };
    });

    onSubmit({
      personalInfo: formData.personalInfo,
      answers: answersArray
    });
  };

  if (questions.length === 0) {
    return <div className={styles.message}>Loading questions...</div>;
  }

  return (
    <div className={styles.formContainer}>
      <h1 className={styles.title}>About You</h1>
      
      <div className={styles.instructionsContainer}>
        <div className={styles.instructionsBox}>
          <h2>📋 Instructions (English)</h2>
          <p>Answer all questions honestly based on who you truly are. Don't overthink — there are no right or wrong answers, and no one will judge you. Just respond naturally and intuitively.</p>
          
          <p>Each question has three options: Agree, Neutral/Sometimes, and Disagree.</p>
          <ul>
            <li>Agree: You agree with the statement.</li>
            <li>Disagree: You disagree with the statement.</li>
            <li>Neutral/Sometimes: You sometimes agree and sometimes disagree. Choose whichever feels right.</li>
          </ul>
          
          <p>Please use the same name you used while applying (e.g., on your CV/job application) along with your valid CNIC number. Without this information, your application may not be considered.</p>
        </div>

        <div className={`${styles.instructionsBox} ${styles.urduInstructions}`}>
          <h2>📋 ہدایات</h2>
          <p>تمام سوالات کے جوابات ایمانداری سے دیں۔ زیادہ نہ سوچیں — یہاں کوئی درست یا غلط جواب نہیں ہے اور نہ ہی آپ کا کوئی فیصلہ کیا جائے گا۔ صرف اپنی فطری سوچ اور احساسات کے مطابق جواب دیں۔</p>
          
          <p>ہر سوال کے تین اختیارات ہیں: اتفاق, درمیانی/کبھی کبھار، اور اختلاف۔</p>
          <ul>
            <li>اتفاق: آپ بیان سے مکمل اتفاق کرتے ہیں۔</li>
            <li>اختلاف: آپ بیان سے مکمل اختلاف کرتے ہیں۔</li>
            <li>درمیانی/کبھی کبھار: کبھی کبھار اتفاق اور کبھی کبھار اختلاف کرتے ہیں۔ جو آپ کو زیادہ مناسب لگے وہ منتخب کریں۔</li>
          </ul>
          
          <p>براہِ کرم وہی نام درج کریں جو آپ نے سی وی یا نوکری کے لیے درخواست دیتے وقت استعمال کیا تھا، اور ساتھ میں اپنا اصل شناختی کارڈ نمبر (CNIC) بھی ضرور فراہم کریں۔ بصورت دیگر آپ کی درخواست پر غور نہیں کیا جائے گا۔</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.personalInfo}>
          <div className={styles.inputGroup}>
            <label htmlFor="name">Full Name:</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.personalInfo.name}
              onChange={handlePersonalInfoChange}
              placeholder="Enter your full name"
              required
            />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="cnic">CNIC:</label>
            <input
              type="text"
              id="cnic"
              name="cnic"
              value={formData.personalInfo.cnic}
              onChange={handlePersonalInfoChange}
              placeholder="Enter your CNIC (e.g., 35202-1234567-1)"
              pattern="[0-9]{5}-[0-9]{7}-[0-9]{1}"
              required
            />
          </div>
        </div>

        {questions.map((question, index) => (
          <div key={index} className={styles.questionGroup}>
            <div className={styles.questionText}>
              <h2 className={styles.englishQuestion}>{index + 1}. {question.english}</h2>
              {question.urdu && <h2 className={styles.urduQuestion}>{question.urdu}</h2>}
            </div>
            <div className={styles.options}>
              <label>
                <input
                  type="radio"
                  name={`question_${index}`}
                  value="agree"
                  onChange={(e) => handleChange(e, index, question.trait)}
                  required
                />
                <span className={styles.optionText}>
                  <span className={styles.english}>Agree</span>
                </span>
              </label>
              <label>
                <input
                  type="radio"
                  name={`question_${index}`}
                  value="neutral"
                  onChange={(e) => handleChange(e, index, question.trait)}
                />
                <span className={styles.optionText}>
                  <span className={styles.english}>Neutral</span>
                </span>
              </label>
              <label>
                <input
                  type="radio"
                  name={`question_${index}`}
                  value="disagree"
                  onChange={(e) => handleChange(e, index, question.trait)}
                />
                <span className={styles.optionText}>
                  <span className={styles.english}>Disagree</span>
                </span>
              </label>
            </div>
          </div>
        ))}        <button type="submit" className={styles.submitButton}>Next</button>
      </form>
    </div>
  );
};

export default TraitsForm; 