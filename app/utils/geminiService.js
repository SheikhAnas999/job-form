
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Google Generative AI client
const initializeGeminiClient = () => {
  const apiKey = "AIzaSyCg0PYomWpaP419SOu4jyglpqHQiCRsv20";
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not defined in environment variables');
  }
  return new GoogleGenerativeAI(apiKey);
};


export const generateQuestions = async (jobTitle, jobDescription) => {
  try {
    console.log(`Generating questions for ${jobTitle}`);
    
    // Initialize the Gemini client
    const genAI = initializeGeminiClient();
    
    // Get the generative model (gemini-pro)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    
    // Create the prompt for generating assessment questions
    const prompt = `
      You are a psychometric assessment generator. Your task is to generate 20 situational judgment questions (SJTs) for a given job title and its description.
      
      Each question should reflect realistic, on-the-job situations that a candidate may face. There are no right or wrong answers — each option should reflect a different style of responding. For every question, also identify the behavioral trait(s) being assessed.
      
      The language should be simple, clear, and easy to understand. Do not use complicated vocabulary or long sentences. Keep it professional but friendly. Assume the test-taker understands basic English (like many people in Pakistan), but may struggle with complex phrasing or advanced grammar.
      
      Please return the result in valid JSON format, structured as an array of 20 objects. Each object should have the following keys:
      
      1. "question" – A simple and realistic workplace scenario phrased as a question.
      2. "translation" – Translate the question into Urdu.
      3. "options" – An array of four multiple-choice answers (as short strings).
      4. "traits" – An array of 1–3 traits or soft skills being assessed (e.g., empathy, patience, adaptability, conflict resolution, decision-making, coaching style, leadership, etc.).
      
      Use the following inputs:
      - Job Title: ${jobTitle}
      - Job Description: ${jobDescription}
      
      Ensure the JSON is clean, properly structured, and easy to parse. Avoid overly technical language unless absolutely required by the job.
    `;

    // Configure generation parameters
    const generationConfig = {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 8192,
    };

    // Generate content
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig,
    });

    const response = result.response;
    const textResponse = response.text();
    
    // Extract and parse JSON from the response
    // We need to handle potential formatting issues in the response
    try {
      // Find JSON content between ``` markers if present
      let jsonString = textResponse;
      const jsonMatch = textResponse.match(/```json\s*([\s\S]*?)\s*```/) || 
                         textResponse.match(/```\s*([\s\S]*?)\s*```/);
      
      if (jsonMatch && jsonMatch[1]) {
        jsonString = jsonMatch[1];
      }
      
      // Parse the JSON response
      const questions = JSON.parse(jsonString);
      
      // Validate the response format
      if (!Array.isArray(questions)) {
        throw new Error('Response is not in the expected array format');
      }
      
      return questions;
    } catch (parseError) {
      console.error('Failed to parse Gemini API response:', parseError);
      console.log('Raw response:', textResponse);
      throw new Error('Failed to parse questions from Gemini API response');
    }
  } catch (error) {
    console.error('Error generating questions with Gemini API:', error);
    throw new Error(`Failed to generate questions: ${error.message}`);
  }
};
