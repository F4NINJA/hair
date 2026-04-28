import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function analyzeHairLoss(inputs: {
  age: number;
  gender: string;
  severity: string;
  familyHistory: string;
  stress: string;
  diet: string;
  illness: string;
}) {
  const prompt = `
    Analyze the following hair loss data and provide a professional, empathetic assessment.
    
    Data:
    - Age: ${inputs.age}
    - Gender: ${inputs.gender}
    - Severity: ${inputs.severity}
    - Family History: ${inputs.familyHistory === 'yes' ? 'Positive' : 'Negative'}
    - Stress Level: ${inputs.stress}
    - Diet Quality: ${inputs.diet}
    - Recent Illness/Medication: ${inputs.illness}
    
    Structure your response with:
    1. **Overview**: General summary of their situation.
    2. **Key Factors**: Why this might be happening (genetics, stress, age, etc.).
    3. **Actionable Recommendations**: Steps they can take (diet, lifestyle, medical consulting).
    4. **Warning Signs**: When to see a doctor immediately.
    
    Keep the tone medical but accessible. Use Markdown formatting.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to generate assessment. Please try again later.");
  }
}
