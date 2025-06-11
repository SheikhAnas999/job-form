import { collection, doc, setDoc, getDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "./firebaseConfig";
import { generateQuestions, generateTraitQuestions } from "./geminiService";

/**
 * Save job form details including generated situational questions to Firestore
 * @param {Object} formData - The form data created by the admin
 * @param {string} formURL - The generated URL for the form
 * @returns {Promise<string>} - The document ID of the saved form
 */
export const saveFormToFirestore = async (formData, formURL = null) => {
  try {
    // Create a form document with the job title as the ID
    const slug = formData.title.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, '-');
    const formRef = doc(db, "forms", slug);
    
    // Extract trait names from formData
    const traitNames = formData.traits.map(trait => trait.trait);
    
    // Generate trait questions based on the provided traits
    let generatedTraitQuestions = [];
    if (traitNames.length > 0) {
      generatedTraitQuestions = await generateTraitQuestions(traitNames);
    }
    
    // Generate situational questions for this job
    const situationalQuestions = await generateQuestions(formData.title, formData.description);
    
    // Combine form data with generated questions
    const formWithQuestions = {
      ...formData,
      generatedTraitQuestions,
      situationalQuestions,
      formURL,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Save to Firestore
    await setDoc(formRef, formWithQuestions);
    
    console.log(`Form saved successfully with ID: ${slug}`);
    return slug;
  } catch (error) {
    console.error("Error saving form to Firestore:", error);
    throw new Error(`Failed to save form: ${error.message}`);
  }
};

/**
 * Save assessment results to Firestore as a subcollection of the form
 * @param {Object} assessmentData - The complete assessment data
 * @param {Object} analysisResults - The analysis results from Gemini
 * @returns {Promise<string>} - The document ID of the saved results
 */
export const saveAssessmentResultsToFirestore = async (assessmentData, analysisResults) => {
  try {
    // Get the form ID from the assessment data
    const formId = assessmentData.jobMetadata.jobId;
    
    // Create a unique ID for the assessment result
    const resultId = `${assessmentData.personalInfo.name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`;
    
    // Create a reference to the submissions subcollection within the form document
    const submissionRef = doc(db, "forms", formId, "submissions", resultId);
    
    // Combine assessment data with analysis results
    const completeResults = {
      rawData: assessmentData,
      analysis: analysisResults,
      timestamp: new Date().toISOString()
    };
    
    // Save to Firestore as a subcollection document
    await setDoc(submissionRef, completeResults);
    
    console.log(`Assessment results saved successfully with ID: ${resultId} in form ${formId}`);
    return resultId;
  } catch (error) {
    console.error("Error saving assessment results to Firestore:", error);
    throw new Error(`Failed to save assessment results: ${error.message}`);
  }
};

/**
 * Get a job form including its situational questions from Firestore
 * @param {string} formId - The ID of the form to retrieve
 * @returns {Promise<Object>} - The form data with questions
 */
export const getFormFromFirestore = async (formId) => {
  try {
    const formRef = doc(db, "forms", formId);
    const formSnap = await getDoc(formRef);
    
    if (formSnap.exists()) {
      return formSnap.data();
    } else {
      throw new Error(`Form with ID ${formId} not found`);
    }
  } catch (error) {
    console.error("Error retrieving form from Firestore:", error);
    throw new Error(`Failed to get form: ${error.message}`);
  }
};

/**
 * Get situational questions for a specific job form
 * @param {string} formId - The ID of the form
 * @returns {Promise<Array>} - Array of situational questions
 */
export const getSituationalQuestions = async (formId) => {
  try {
    const formRef = doc(db, "forms", formId);
    const formSnap = await getDoc(formRef);
    
    if (formSnap.exists() && formSnap.data().situationalQuestions) {
      return formSnap.data().situationalQuestions;
    } else {
      throw new Error(`Situational questions for form ${formId} not found`);
    }
  } catch (error) {
    console.error("Error retrieving situational questions:", error);
    throw new Error(`Failed to get situational questions: ${error.message}`);
  }
};

/**
 * Get all forms from Firestore
 * @returns {Promise<Array>} - Array of all form documents
 */
export const getAllForms = async () => {
  try {
    const formsRef = collection(db, "forms");
    const querySnapshot = await getDocs(formsRef);
    
    const forms = [];
    querySnapshot.forEach((doc) => {
      // Add each form document to the array with its ID
      forms.push({ id: doc.id, ...doc.data() });
    });
    
    return forms;
  } catch (error) {
    console.error("Error retrieving all forms:", error);
    throw new Error(`Failed to get forms: ${error.message}`);
  }
};

/**
 * Get all submissions for a specific form
 * @param {string} formId - The ID of the form
 * @returns {Promise<Array>} - Array of all submission documents for the form
 */
export const getFormSubmissions = async (formId) => {
  try {
    const submissionsRef = collection(db, "forms", formId, "submissions");
    const querySnapshot = await getDocs(submissionsRef);
    
    const submissions = [];
    querySnapshot.forEach((doc) => {
      // Add each submission document to the array with its ID
      submissions.push({ id: doc.id, ...doc.data() });
    });
    
    return submissions;
  } catch (error) {
    console.error(`Error retrieving submissions for form ${formId}:`, error);
    throw new Error(`Failed to get submissions: ${error.message}`);
  }
}; 