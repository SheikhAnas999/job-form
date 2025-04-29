import emailjs from '@emailjs/browser';

// Initialize EmailJS with your User ID
// You'll need to sign up at https://www.emailjs.com/ and get these credentials
const initEmailJS = () => {
  // Replace with your actual EmailJS User ID
  emailjs.init("1ucCnEqdna-4j_oe4");
};

// Function to send assessment results via email
const sendAssessmentResults = async (data) => {
  try {
    // Clean the data to fit EmailJS template length restrictions
    // EmailJS has a limit on template size, so we need to serialize and split the data
    
    // Stringify the complete results object
    const fullResults = JSON.stringify(data, null, 2);
    
    // Create the email data object with complete results
    const emailData = {
      to_email: "sheikhanasasif786@gmail.com",
      from_name: `Job Form - ${data.personalInfo.name}`,
      candidate_name: data.personalInfo.name,
      candidate_cnic: data.personalInfo.cnic,
      iq_score: data.iqTest.score.toFixed(1) + '%',
      correct_answers: `${data.iqTest.correctAnswers} out of ${data.iqTest.totalQuestions}`,
      situational_count: data.situational.totalScenarios || 0,
      
      // Include the complete traits data
      traits_data: JSON.stringify(data.traits, null, 2),
      
      // Include the complete IQ test data
      iq_data: JSON.stringify(data.iqTest, null, 2),
      
      // Include the complete situational test data
      situational_data: JSON.stringify(data.situational, null, 2),
      
      // Include the full results content, trimmed to avoid email size limits
      full_results: fullResults.length > 50000 ? 
        fullResults.substring(0, 50000) + "... [truncated due to size]" : 
        fullResults
    };

    // Send the email using EmailJS
    const response = await emailjs.send(
      "service_c8wvm7s", 
      "template_p8z5hgf",
      emailData
    );
    
    console.log('Email sent successfully:', response);
    
    // If the data is too large, send additional emails with the remaining parts
    if (fullResults.length > 50000) {
      let currentPart = 2;
      for (let i = 50000; i < fullResults.length; i += 50000) {
        const partData = {
          to_email: "sheikhanasasif786@gmail.com",
          from_name: `Job Form - ${data.personalInfo.name} (Part ${currentPart})`,
          candidate_name: data.personalInfo.name,
          candidate_cnic: data.personalInfo.cnic,
          full_results: fullResults.substring(i, i + 50000)
        };
        
        // Send the additional part
        await emailjs.send(
          "service_c8wvm7s", 
          "template_p8z5hgf",
          partData
        );
        
        currentPart++;
      }
    }
    
    return { success: true, message: "Results emailed successfully!" };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, message: "Failed to email results: " + error.message };
  }
};

export { initEmailJS, sendAssessmentResults }; 