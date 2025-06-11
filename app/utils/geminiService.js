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

export const generateTraitQuestions = async (traits) => {
  try {
    console.log(`Generating trait questions for traits: ${traits.join(', ')}`);
    
    // Initialize the Gemini client
    const genAI = initializeGeminiClient();
    
    // Get the generative model
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    
    // Create the prompt for generating trait-based questions
    const prompt = `
      Generate a set of psychometric personality-based questions for the role of Performance & Training Coach (who'll be in learning and development department, responsible for training corporate staff members and sales assistant in our retail stores). The questions should be designed to assess the following traits, reflecting realistic, on-the-job scenarios:

      ##**Traits:**
      ${traits.map(trait => `- ${trait}`).join('\n')}

      ##**Note:**
      * Each question should be realistic, simple, and clear, designed to avoid obvious "Agree" answers (such as socially desirable responses).
      * The answers would be presented as three options: Agree, Neutral/Sometimes, Disagree.
      * Ensure that the questions are nuanced, where the "right" answer is not obvious, and reflect real-life trade-offs or conflicting priorities.
      * Include reverse-scored questions where agreeing could imply a less favorable trait.
      * Provide simple Urdu translations for each question. The translations should be easy to understand and conversational.
      * Avoid complex vocabulary and make sure the language remains accessible.

      ##**Output Format:**
      Return the questions as a JSON array, with each object containing:

      - trait: The trait being assessed
      - question: The English question
      - urdu_translation: The translated Urdu question

      ##**Here's an example format:**
      [
        {
          "trait": "creative/problem solving",
          "question": "When I face a problem, I prefer sticking to tried methods that have worked before.",
          "urdu_translation": "جب کوئی مسئلہ پیش آتا ہے تو میں اُن طریقوں کو اپنانا پسند کرتا ہوں جو پہلے کامیاب رہے ہوں۔"
        }
      ]

      Generate 4 questions for each trait based on provided guidelines and ensure they align with the job role's key responsibilities.
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
      
      // Transform the response to match the expected format for trait questions
      const formattedQuestions = questions.map(q => ({
        trait: q.trait,
        english: q.question,
        urdu: q.urdu_translation
      }));
      
      return formattedQuestions;
    } catch (parseError) {
      console.error('Failed to parse Gemini API response for trait questions:', parseError);
      console.log('Raw response:', textResponse);
      throw new Error('Failed to parse trait questions from Gemini API response');
    }
  } catch (error) {
    console.error('Error generating trait questions with Gemini API:', error);
    throw new Error(`Failed to generate trait questions: ${error.message}`);
  }
};

export const generateAssessmentResults = async (assessmentData, jobTitle) => {
  try {
    console.log(`Generating assessment results for ${jobTitle}`);
    
    // Initialize the Gemini client
    const genAI = initializeGeminiClient();
    
    // Get the generative model
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    
    // Create the prompt for generating assessment results
    const prompt = `
You are a psychometric analyst tasked with interpreting the results of a candidate's assessment across three distinct sections:

1. Personality-Based Questions
2. IQ Questions
3. Situational-Based Questions

The goal is to provide a nuanced, actionable report that helps employers understand both the candidate's fit for the applied role and their potential fit for related roles, without being superficial or generic. Use the detailed instructions below to assess and report results.

##**Instructions:**
1) Analyze each section Independently:
* Personality-Based Section: Score each trait using candidate responses. Use a 3-point Likert scale (Agree = 2, Neutral = 1, Disagree = 0), or reverse the scoring where applicable. Normalize scores across different traits for comparability. Include a short behavioral interpretation for each trait, based on the candidate's responses.
* IQ Section: Evaluate responses to logic, pattern recognition, quantitative reasoning, and general knowledge. Assign 1 point for each correct response. Provide a total raw score and a percentile rank based on your internal benchmark distribution. Include brief analysis of strengths (e.g., pattern recognition etc...) or weaknesses (e.g., arithmetic reasoning etc...).
* Situational-Based Section: Score each answer based on how well it maps to one or more relevant traits. For each situational question, evaluate the option chosen against the traits it was designed to assess. Score responses on a 1-10 scale. Explain the rationale behind the scoring where the behavior is ambiguous.

2) Incorporate Weighted Scoring: Weight each section differently depending on the role. For example:
* A creative role (e.g., Social Media Manager): Personality: 50%, Situational: 30%, IQ: 20%
* A technical role (e.g., Data Analyst): IQ: 50%, Personality: 30%, Situational: 20%
Include the job title to determine weight distribution automatically.

3) Generate a Final Report with the following example structure and be as detailed as possible to provide useful and interesting insights. Strictly follow the JSON output and do not include any additional text or formattings:
{
  "candidate_name": "",
  "role_applied_for": "",
  "section_scores": {
    "personality": {
      "total": 85,
      "by_trait": {
        "extrovert": 8,
        ...
      },
      "analysis": {
        "extroversion": "Shows high social engagement and comfort in collaborative environments... (give reason and also site the relevant questions for reference of your decision)",
        ...
      }
    },
    "iq": {
      "total_score": 18,
      "percentile": 75,
      "subscores": {
        "logic": 6,
        "arithmetic": 4,
        "pattern_recognition": 5,
        ...
      },
      "analysis": "Strong in abstract reasoning; minor struggles with numerical accuracy..."
    },
    "situational": {
      "creativity": 7,
      ...
    }
  },
  "weighted_score": 87,
  "strengths": [
    {
      "trait": "",
      "reason": "give reason and also site the relevant questions for reference of your decision"
    },
    ...
  ],
  "weaknesses": [
    {
      "trait": "",
      "reason": "give reason and also site the relevant questions for reference of your decision"
    },
    ...
  ],
  "suitability_for_applied_role": "Highly Suitable (Score: 90%)",
  "suitability_for_other_roles": [
    {
      "role": "",
      "match_score": "%"
    },
    ... at least 3 more
  ],
  "non_suitability_for_other_roles": [
    {
      "role": "",
      "match_score": "%"
    },
    ... at least 3 more
  ],
  "remarks": [
    <array of at least 3 strings of detailed remarks, also site the relevant questions for reference of your decision>
  ],
  "feedback_to_candidate": [
    <array of at least 3 strings of detailed feedbacks, also site the relevant questions for reference of your decision>
  ]
}

Here is the assessment data to analyze:
${JSON.stringify(assessmentData, null, 2)}

The job title is: ${jobTitle}
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
    try {
      // Find JSON content between ``` markers if present
      let jsonString = textResponse;
      const jsonMatch = textResponse.match(/```json\s*([\s\S]*?)\s*```/) || 
                         textResponse.match(/```\s*([\s\S]*?)\s*```/);
      
      if (jsonMatch && jsonMatch[1]) {
        jsonString = jsonMatch[1];
      }
      
      // Parse the JSON response
      const assessmentResults = JSON.parse(jsonString);
      
      return assessmentResults;
    } catch (parseError) {
      console.error('Failed to parse Gemini API response for assessment results:', parseError);
      console.log('Raw response:', textResponse);
      throw new Error('Failed to parse assessment results from Gemini API response');
    }
  } catch (error) {
    console.error('Error generating assessment results with Gemini API:', error);
    throw new Error(`Failed to generate assessment results: ${error.message}`);
  }
};
