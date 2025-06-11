'use client';
import { useState, useEffect } from 'react';
import styles from './admin.module.css';
import { saveFormToFirestore, getAllForms } from '../utils/firestoreService';
import FormSubmissions from '../components/FormSubmissions';

export default function AdminPage() {
  const [activeForm, setActiveForm] = useState(null);
  const [forms, setForms] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    traits: []
  });
  const [newTrait, setNewTrait] = useState({ trait: '' });
  const [generatedURL, setGeneratedURL] = useState('');
  const [isURLCopied, setIsURLCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [activeTab, setActiveTab] = useState('editor'); // 'editor' or 'submissions'

  // Load all forms from Firestore on component mount
  useEffect(() => {
    const loadForms = async () => {
      try {
        const firestoreForms = await getAllForms();
        setForms(firestoreForms);
      } catch (error) {
        console.error("Error loading forms:", error);
        setErrorMessage("Failed to load saved forms. Please try again later.");
      }
    };

    loadForms();
  }, []);

  const handleFormSelect = (form) => {
    setActiveForm(form);
    setFormData({
      title: form.title,
      description: form.description,
      traits: form.traits || []
    });
    
    // Display the saved URL if available
    if (form.formURL) {
      setGeneratedURL(form.formURL);
    } else {
      // Generate URL if not already saved
      const url = generateFormURL(form.id);
      setGeneratedURL(url);
    }
    
    setIsURLCopied(false);
    setErrorMessage('');
    setActiveTab('editor'); // Default to editor tab when selecting a form
  };

  const handleTitleChange = (e) => {
    setFormData({...formData, title: e.target.value});
  };

  const handleDescriptionChange = (e) => {
    setFormData({...formData, description: e.target.value});
  };

  const handleTraitChange = (field, value) => {
    setNewTrait({...newTrait, [field]: value});
  };

  const addTrait = () => {
    if (newTrait.trait) {
      setFormData({
        ...formData,
        traits: [...(formData.traits || []), { trait: newTrait.trait }]
      });
      setNewTrait({ trait: '' });
    } else {
      setErrorMessage("Please provide a trait name");
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const removeTrait = (index) => {
    const updatedTraits = [...formData.traits];
    updatedTraits.splice(index, 1);
    setFormData({...formData, traits: updatedTraits});
  };

  const generateFormURL = (formId) => {
    // Create a unique slug from job title
    const slug = formData.title
      .toLowerCase()
      .replace(/[^\w\s]/gi, '')
      .replace(/\s+/gi, '-');
    
    // Generate URL with form ID
    const baseURL = window.location.origin;
    const formURL = `${baseURL}/form/${slug}?id=${slug}`;
    
    return formURL;
  };

  const saveForm = async () => {
    // Validate form has at least title and description
    if (!formData.title || !formData.description) {
      setErrorMessage("Please provide both job title and description");
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      // Generate the URL for the form
      const url = generateFormURL();
      setGeneratedURL(url);
      
      // Save form data to Firestore, including the generated URL
      const formId = await saveFormToFirestore(formData, url);
      
      // Load all forms to update the sidebar
      const updatedForms = await getAllForms();
      setForms(updatedForms);
      
      // Set active form to the newly created one
      const newForm = updatedForms.find(form => form.id === formId);
      if (newForm) {
        setActiveForm(newForm);
      } else {
        // Reset form selection if new form can't be found
        setActiveForm(null);
        setFormData({title: '', description: '', traits: []});
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error("Error saving form:", error);
      setErrorMessage("Failed to save form. Please try again.");
      setIsLoading(false);
    }
  };

  const createNewForm = () => {
    setActiveForm(null);
    setFormData({title: '', description: '', traits: []});
    setGeneratedURL('');
    setIsURLCopied(false);
    setErrorMessage('');
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedURL).then(() => {
      setIsURLCopied(true);
      setTimeout(() => setIsURLCopied(false), 3000);
    });
  };

  // Function to visit the form URL
  const visitForm = () => {
    if (generatedURL) {
      window.open(generatedURL, '_blank');
    }
  };

  return (
    <div className={styles.adminLayout}>
      <div className={styles.sidebar}>
        <h2>Job Forms</h2>
        <button 
          className={styles.newFormButton}
          onClick={createNewForm}
        >
          + Create New Form
        </button>
        <div className={styles.formsList}>
          {forms.length > 0 ? (
            forms.map(form => (
              <div 
                key={form.id} 
                className={`${styles.formItem} ${activeForm?.id === form.id ? styles.active : ''}`}
                onClick={() => handleFormSelect(form)}
                title={form.title}
              >
                {form.title}
              </div>
            ))
          ) : (
            <div className={styles.noForms}>No saved forms yet</div>
          )}
        </div>
      </div>

      <div className={styles.mainContent}>
        <h1>Job Form Editor</h1>
        
        {errorMessage && (
          <div className={styles.errorMessage}>
            {errorMessage}
          </div>
        )}

        {isLoading && (
          <div className={styles.loadingContainer}>
            <div className={styles.loader}></div>
            <p>Saving form and generating questions...</p>
            <p>This may take a moment as we create custom trait questions and situational scenarios for the job.</p>
          </div>
        )}
        
        {activeForm && !isLoading && (
          <div className={styles.tabsContainer}>
            <div className={styles.tabs}>
              <button 
                className={`${styles.tabButton} ${activeTab === 'editor' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('editor')}
              >
                Form Editor
              </button>
              <button 
                className={`${styles.tabButton} ${activeTab === 'submissions' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('submissions')}
              >
                View Submissions
              </button>
            </div>
          </div>
        )}
        
        {generatedURL && !isLoading && (
          <div className={styles.urlContainer}>
            <h3>Form URL{activeForm ? " for " + activeForm.title : " Generated Successfully"}</h3>
            <div className={styles.urlBox}>
              <input 
                type="text" 
                readOnly 
                value={generatedURL} 
                className={styles.urlInput}
              />
              <button 
                className={styles.copyButton}
                onClick={copyToClipboard}
              >
                {isURLCopied ? 'Copied!' : 'Copy URL'}
              </button>
            </div>
            <p className={styles.urlNote}>
              Share this URL with candidates to access the job assessment form.
            </p>
            <div className={styles.urlActions}>
              <button 
                className={styles.previewButton}
                onClick={visitForm}
              >
                Visit Form
              </button>
            </div>
          </div>
        )}
        
        {!isLoading && activeForm && activeTab === 'submissions' && (
          <FormSubmissions formId={activeForm.id} formTitle={activeForm.title} />
        )}
        
        {!isLoading && (activeTab === 'editor' || !activeForm) && (
          <div className={styles.formEditor}>
            <div className={styles.section}>
              <h2>Job Details</h2>
              <div className={styles.inputGroup}>
                <label htmlFor="title">Job Title</label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={handleTitleChange}
                  placeholder="Enter job title"
                  required
                />
              </div>
              <div className={styles.inputGroup}>
                <label htmlFor="description">Job Description</label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={handleDescriptionChange}
                  placeholder="Enter job description"
                  rows={4}
                  required
                />
              </div>
            </div>

            <div className={styles.section}>
              <h2>Job Traits</h2>
              
              <div className={styles.addTraitForm}>
                <h3>Add New Trait</h3>
                <div className={styles.traitInputs}>
                  <div className={styles.inputGroup}>
                    <label>Trait Name</label>
                    <input
                      type="text"
                      value={newTrait.trait}
                      onChange={(e) => handleTraitChange('trait', e.target.value)}
                      placeholder="e.g. Communication, Leadership, Empathy, etc."
                    />
                  </div>
                </div>
                <button 
                  className={styles.addButton}
                  onClick={addTrait}
                >
                  Add Trait
                </button>
              </div>

              <h3>{formData.traits?.length > 0 ? 'Added Traits' : 'No traits added yet'}</h3>
              <div className={styles.traitsList}>
                {formData.traits && formData.traits.map((trait, index) => (
                  <div key={index} className={styles.traitItem}>
                    <div>
                      <strong>{trait.trait}</strong>
                    </div>
                    <button 
                      className={styles.removeButton}
                      onClick={() => removeTrait(index)}
                      title="Remove trait"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.formActions}>
              <button 
                className={styles.saveButton}
                onClick={saveForm}
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : activeForm ? 'Update Form' : 'Save & Generate URL'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 