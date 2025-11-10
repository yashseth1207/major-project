import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import Connection from "./db.js";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenerativeAI } from "@google/generative-ai";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config();

const app = express();
app.use(cookieParser());

const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:8080",
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' })); // Increased limit for image uploads
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ✅ Initialize Gemini AI (latest SDK)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ✅ Helper function to handle AI calls with vision (for images)
async function analyzeHealthWithGemini(prompt, imageData = null) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    
    if (imageData) {
      // If there's an image, use vision model
      const imageParts = [{
        inlineData: {
          data: imageData.split(',')[1], // Remove data:image/jpeg;base64, prefix
          mimeType: imageData.split(';')[0].split(':')[1]
        }
      }];
      
      const result = await model.generateContent([prompt, ...imageParts]);
      return result.response.text();
    } else {
      // Text only
      const result = await model.generateContent(prompt);
      return result.response.text();
    }
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}

import userRouter from "./Routes/userRouter.js";
app.use("/api/user", userRouter);

/* --------------------------- HEALTH ANALYSIS ENDPOINT --------------------------- */

// Helper function to extract severity from AI response
function extractSeverity(text) {
  const lowerText = text.toLowerCase();
  if (lowerText.includes("severity level: high") || lowerText.includes("severity: high") || lowerText.includes("🔴")) {
    return "high";
  } else if (lowerText.includes("severity level: moderate") || lowerText.includes("severity: moderate") || lowerText.includes("🟡")) {
    return "moderate";
  }
  return "low";
}

app.post("/api/health/analyze", async (req, res) => {
  try {
    const { symptoms, age, gender, reportImage, hasReport } = req.body;

    // Validation
    if (!symptoms || !age || !gender) {
      return res.status(400).json({
        error: "Missing required fields: symptoms, age, and gender are required",
      });
    }

    // Verify API key exists
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "Gemini API key not configured. Please add GEMINI_API_KEY to your .env file",
      });
    }

    console.log("Attempting to call Gemini API...");
    console.log("Has medical report:", hasReport);

    // Create AI prompt with systematic structure
    let prompt = `You are an expert medical AI assistant for farmers. Analyze the patient information and provide clear, systematic health guidance.

Patient Information:
- Age: ${age}
- Gender: ${gender}
- Symptoms: ${symptoms}
${hasReport ? "- Medical Report: Attached (analyze the test results in the image)" : ""}

Provide your analysis in this EXACT structured format using emojis for visual clarity:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏥 HEALTH ANALYSIS REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👋 GREETING
Write one friendly, reassuring sentence.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 SYMPTOM ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Based on your symptoms, here's what I found:

${hasReport ? `📋 TEST REPORT FINDINGS
Analyze the medical report values and highlight:
• Key abnormal values (if any)
• Normal ranges vs actual values
• Important observations

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
` : ""}🤔 POSSIBLE CONDITIONS

List 2-3 possible conditions:

1️⃣ [Condition Name]
   • What it is (simple explanation)
   • Why these symptoms match
   • Common in farmers because...

2️⃣ [Condition Name]
   • What it is (simple explanation)
   • Why these symptoms match
   • Common in farmers because...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ SEVERITY ASSESSMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Based on symptoms ${hasReport ? "and test results" : ""}, this appears to be:

${hasReport ? "🟢 LOW SEVERITY / 🟡 MODERATE SEVERITY / 🔴 HIGH SEVERITY" : "🟢 LOW SEVERITY / 🟡 MODERATE SEVERITY / 🔴 HIGH SEVERITY"}

Explanation: [Brief reason for severity level]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💊 RECOMMENDATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🏡 HOME CARE (what you can do now):

1. 💧[First recommendation]
   - Specific action to take
   - Why it helps

2. 🍎[Second recommendation]
   - Specific action to take
   - Why it helps

3. 😴[Third recommendation]
   - Specific action to take
   - Why it helps

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏥 WHEN TO SEE A DOCTOR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ SEE A DOCTOR IMMEDIATELY IF:

🚨 [Urgent symptom 1]
🚨 [Urgent symptom 2]
🚨 [Urgent symptom 3]

📅 SCHEDULE AN APPOINTMENT IF:

• [Non-urgent but important sign 1]
• [Non-urgent but important sign 2]
• Symptoms persist beyond [timeframe]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌿 LIFESTYLE TIPS FOR FARMERS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ [Farming-specific tip 1]
✓ [Farming-specific tip 2]
✓ [Farming-specific tip 3]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Keep language simple, avoid medical jargon, and be farmer-friendly. ${hasReport ? "Reference specific values from the test report when relevant." : ""}`;

    // ✅ Call Gemini API (with or without image)
    const analysis = await analyzeHealthWithGemini(prompt, reportImage);

    console.log("Successfully received response from Gemini");

    // Format and send back structured response
    const structuredResponse = {
      analysis,
      severity: extractSeverity(analysis),
      timestamp: new Date().toISOString(),
      disclaimer:
        "⚠️ IMPORTANT: This AI analysis is for informational purposes only and is NOT a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare professional for medical concerns.",
    };

    res.json(structuredResponse);
  } catch (error) {
    console.error("Error analyzing health:", error);

    let errorMessage = "Failed to analyze symptoms.";
    if (error.message.includes("API_KEY_INVALID")) {
      errorMessage = "Invalid API key. Please check your GEMINI_API_KEY in the .env file.";
    } else if (error.message.includes("404")) {
      errorMessage =
        "Gemini API access issue. Please verify your API key has access to Gemini models at https://aistudio.google.com/app/apikey";
    }

    res.status(500).json({
      error: errorMessage,
      details: error.message,
    });
  }
});

// Health check endpoint
app.get("/api/health/status", (req, res) => {
  res.json({ status: "ok", message: "Health Analysis API is running" });
});

/* ----------------------------------------------------------------------------------------------------------------------------- */
/* --------------------------- AI DIET PLAN ENDPOINT --------------------------- */

app.post("/api/diet/plan", async (req, res) => {
  try {
    const { age, weight, height, condition, dietType, allergies } = req.body;

    if (!age || !weight || !height || !condition) {
      return res.status(400).json({
        error: "Missing required fields: age, weight, height, and condition are required.",
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "Gemini API key not configured.",
      });
    }

    console.log("Generating AI Diet Plan...");
    console.log("Diet Type:", dietType || "vegetarian");

    // Calculate BMI and additional metrics
    const heightInMeters = parseFloat(height) / 100;
    const bmi = (parseFloat(weight) / (heightInMeters * heightInMeters)).toFixed(1);
    
    let bmiCategory = "Normal";
    if (bmi < 18.5) bmiCategory = "Underweight";
    else if (bmi >= 25 && bmi < 30) bmiCategory = "Overweight";
    else if (bmi >= 30) bmiCategory = "Obese";

    // Calculate recommended daily calorie intake
    let recommendedCalories = 2000;
    if (condition === "Obesity" || bmi >= 30) recommendedCalories = 1500;
    else if (condition === "Malnutrition" || bmi < 18.5) recommendedCalories = 2500;
    else if (condition === "Diabetes") recommendedCalories = 1800;

    // ✅ Enhanced AI Prompt with Systematic Structure
    const prompt = `You are an expert nutrition and diet AI assistant for farmers in India.
Create a highly personalized, medically accurate diet plan with locally available, affordable foods.

FARMER PROFILE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Age: ${age} years
• Weight: ${weight} kg
• Height: ${height} cm
• BMI: ${bmi} (${bmiCategory})
• Health Condition: ${condition}
• Diet Type: ${dietType || "vegetarian"}
• Food Allergies: ${allergies && allergies.length ? allergies.join(", ") : "None"}
• Recommended Daily Calories: ~${recommendedCalories} kcal

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Provide your response in this EXACT structured format:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🥗 PERSONALIZED DIET PLAN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👋 WELCOME MESSAGE
Write a warm, personalized greeting addressing their health condition and diet preference.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 YOUR NUTRITION GOALS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• Daily Calorie Target: ${recommendedCalories} kcal
• Protein: [Calculate based on weight and condition] g/day
• Carbohydrates: [Percentage and grams]
• Fats: [Percentage and grams]
• Fiber: [Recommended amount]
• Water Intake: [Liters per day]

${condition === "Diabetes" ? "🩺 Special Focus: Low glycemic index foods, controlled carbs" : ""}
${condition === "High Blood Pressure" ? "🩺 Special Focus: Low sodium, high potassium foods" : ""}
${condition === "Heart Disease" ? "🩺 Special Focus: Low cholesterol, omega-3 rich foods" : ""}
${condition === "Obesity" ? "🩺 Special Focus: Calorie deficit, high fiber foods" : ""}
${condition === "Malnutrition" ? "🩺 Special Focus: High calorie, nutrient-dense foods" : ""}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🍽️ DAILY MEAL PLAN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🌅 BREAKFAST (6:00 AM - 8:00 AM) | ~${Math.round(recommendedCalories * 0.25)} kcal

OPTION 1:
• Main Dish: [Specific local food with quantity]
• Side Dish: [Specific food with quantity]
• Beverage: [Specific drink]
• Why This Works: [Nutritional benefits for their condition]

OPTION 2:
• [Alternative breakfast option]
• [Nutritional rationale]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

☀️ MID-MORNING SNACK (10:00 AM) | ~${Math.round(recommendedCalories * 0.10)} kcal

• [Specific snack with quantity]
• [Alternative option]
• Benefits: [Why this helps]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🌞 LUNCH (12:00 PM - 2:00 PM) | ~${Math.round(recommendedCalories * 0.35)} kcal

MEAL COMPONENTS:
• Grain/Staple: [Specific food, quantity, preparation]
• Protein Source: [${dietType === "non-vegetarian" ? "Chicken/Fish/Eggs" : "Lentils/Beans/Paneer"} with quantity]
• Vegetables: [2-3 vegetables with quantities]
• Salad: [Fresh vegetables]
• Accompaniment: [Yogurt/Buttermilk]

Why This Meal: [Nutritional explanation]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🍵 EVENING SNACK (4:00 PM - 5:00 PM) | ~${Math.round(recommendedCalories * 0.10)} kcal

• [Healthy snack option]
• [Alternative]
• Benefits: [Energy boost, nutrients]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🌙 DINNER (7:00 PM - 8:00 PM) | ~${Math.round(recommendedCalories * 0.20)} kcal

LIGHT MEAL:
• [Lighter version of lunch with specific items]
• [Why dinner should be lighter]
• [Timing importance]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🥤 HYDRATION SCHEDULE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• Morning (6 AM): 2 glasses warm water
• With meals: 1 glass before/after each meal
• During farm work: [Specific hydration plan for working hours]
• Evening: [Recommended beverages]
• Total daily water: 8-10 glasses (2-3 liters)

${dietType === "vegetarian" ? "🌱 VEGETARIAN PROTEIN SOURCES TO INCLUDE:" : "🍗 NON-VEGETARIAN PROTEIN SOURCES TO INCLUDE:"}

${dietType === "vegetarian" ? 
`• Lentils (Dal): Moong, Masoor, Toor - 1 cup daily
• Chickpeas: 1/2 cup, 3-4 times/week
• Paneer: 50g, 2-3 times/week
• Soy products: Tofu, soy chunks
• Nuts & Seeds: Almonds, walnuts, flaxseeds` :
`• Chicken: 100g, 3-4 times/week (grilled/boiled)
• Fish: 100g, 2-3 times/week (fatty fish like Rohu, Katla)
• Eggs: 1-2 daily (boiled/poached)
• Lentils: As complementary protein
• Occasional: Mutton (lean cuts, once a week)`}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ FOODS TO AVOID OR LIMIT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

❌ STRICTLY AVOID:
${allergies && allergies.length ? allergies.map(a => `• ${a} - Due to allergy`).join('\n') : ''}
${condition === "Diabetes" ? "• White sugar, sugary drinks, refined flour (maida)\n• White rice (prefer brown rice)" : ""}
${condition === "High Blood Pressure" ? "• Excess salt, pickles, papads\n• Fried and processed foods" : ""}
${condition === "Heart Disease" ? "• Deep fried foods, trans fats\n• Red meat, organ meats" : ""}
${condition === "Obesity" ? "• Junk food, sugary snacks\n• Excess oil, ghee, butter" : ""}

⚠️ CONSUME IN MODERATION:
• [List 3-4 foods to limit]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💪 LIFESTYLE TIPS FOR FARMERS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🌾 During Farm Work:
1. Eat breakfast before going to the field
2. Carry snacks (nuts, fruits) for energy
3. Stay hydrated - drink water every 30 minutes
4. Avoid heavy meals during midday heat

🏠 Daily Habits:
1. Fixed meal timings - don't skip meals
2. Eat slowly, chew properly
3. Avoid sleeping immediately after meals
4. Light walk after dinner

🧘 Health Management:
1. [Specific tip for their condition]
2. [Exercise recommendation]
3. [Stress management]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 WEEKLY MEAL VARIETY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Rotate these foods throughout the week:
• Grains: Rice, wheat chapati, bajra, jowar
• Proteins: [Based on diet type]
• Vegetables: Seasonal vegetables (list 5-6)
• Fruits: Seasonal fruits (list 4-5)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🛒 SHOPPING LIST (WEEKLY)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Provide quantities of ingredients needed for the week]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

IMPORTANT GUIDELINES:
- Use only locally available, affordable ingredients from Indian markets
- All measurements should be practical (cups, bowls, not precise grams unless important)
- Consider farming work schedule and energy needs
- Make it simple to follow and sustainable
- Focus on the specific health condition
- Respect the ${dietType} preference strictly
- Avoid any foods listed in allergies`;

    // ✅ Call Gemini API
    const plan = await analyzeHealthWithGemini(prompt);

    res.json({
      plan,
      bmi,
      bmiCategory,
      recommendedCalories,
      timestamp: new Date().toISOString(),
      disclaimer:
        "⚠️ This diet plan is AI-generated for educational purposes. Please consult a certified nutritionist or registered dietitian for professional medical advice and personalized nutrition guidance.",
    });
  } catch (error) {
    console.error("Error generating diet plan:", error);
    res.status(500).json({
      error: "Failed to generate diet plan.",
      details: error.message,
    });
  }
});

/* --------------------------- AI CROP DISEASE DETECTION --------------------------- */

/* --------------------------- AI CROP DISEASE DETECTION --------------------------- */

app.post("/api/crop/analyze", async (req, res) => {
  try {
    const { image, cropType } = req.body;

    if (!image) {
      return res.status(400).json({ error: "Image of the crop is required" });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "Gemini API key not configured. Please add GEMINI_API_KEY to your .env file",
      });
    }

    console.log("Calling Gemini AI for crop disease detection...");
    console.log("Crop Type:", cropType || "Not specified");

    // ✅ Enhanced Structured AI Prompt for Systematic Analysis
    const prompt = `You are an expert agricultural AI assistant specializing in crop disease detection and plant health assessment.

Analyze this crop image systematically and provide a comprehensive report.

CROP INFORMATION:
• Crop Type: ${cropType || "Please identify from image"}

Your analysis MUST be returned as a valid JSON object with this EXACT structure (no markdown, no extra text):

{
  "healthStatus": {
    "status": "Healthy" OR "Diseased" OR "Warning Signs",
    "confidence": "High/Medium/Low",
    "summary": "One-line overall assessment"
  },
  "identifiedIssues": [
    {
      "name": "Specific disease/pest/deficiency name",
      "type": "Disease/Pest/Nutrient Deficiency/Environmental Stress",
      "severity": "Mild/Moderate/Severe",
      "confidence": "percentage (e.g., 85%)",
      "description": "Brief description of the issue",
      "symptoms": ["symptom 1", "symptom 2", "symptom 3"],
      "causes": ["cause 1", "cause 2"]
    }
  ],
  "treatmentRecommendations": {
    "immediate": [
      "Urgent action 1 with specific instructions",
      "Urgent action 2 with specific instructions"
    ],
    "organic": [
      "Organic treatment 1 with application method",
      "Organic treatment 2 with application method",
      "Organic treatment 3 with application method"
    ],
    "chemical": [
      "Chemical treatment 1 - [Product name/active ingredient] at [dosage]",
      "Chemical treatment 2 - [Product name/active ingredient] at [dosage]",
      "Safety note about chemical usage"
    ],
    "preventive": [
      "Prevention measure 1",
      "Prevention measure 2",
      "Prevention measure 3"
    ]
  },
  "additionalTips": [
    "Watering recommendation",
    "Fertilization advice",
    "Crop rotation suggestion",
    "Monitoring advice",
    "Environmental factor to consider"
  ]
}

ANALYSIS GUIDELINES:
1. Carefully examine leaf color, texture, spots, lesions, wilting, discoloration
2. Look for pest damage, holes, eggs, insects, webbing
3. Check for nutrient deficiency symptoms (yellowing, purpling, browning)
4. Assess overall plant vigor and growth patterns
5. Consider environmental stress (water, light, temperature)

IMPORTANT:
- Be specific with disease/pest names (e.g., "Late Blight (Phytophthora infestans)" not just "fungal disease")
- Provide practical, actionable treatments
- Include both organic and chemical options
- Mention specific product names when possible (neem oil, copper fungicide, etc.)
- Give dosage and application frequency
- Consider farmer accessibility and cost
- If the crop appears healthy, still provide preventive care advice
- Return ONLY the JSON object, no additional text before or after

${cropType ? `Focus specifically on common issues for ${cropType} crops.` : ''}`;

    // ✅ Call Gemini API with image
    const analysisText = await analyzeHealthWithGemini(prompt, image);

    // ✅ Parse JSON response
    let analysis;
    try {
      // Remove any markdown code blocks if present
      const cleanedText = analysisText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      analysis = JSON.parse(cleanedText);
      
      // Validate structure
      if (!analysis.healthStatus || !analysis.identifiedIssues || !analysis.treatmentRecommendations) {
        throw new Error("Invalid response structure");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      console.log("Raw response:", analysisText);
      
      // Fallback: Return formatted text response
      return res.json({
        analysis: {
          healthStatus: {
            status: "Analysis Complete",
            confidence: "Medium",
            summary: "Unable to structure the response, showing raw analysis"
          },
          identifiedIssues: [],
          treatmentRecommendations: {
            immediate: [],
            organic: [],
            chemical: [],
            preventive: []
          },
          additionalTips: [],
          rawAnalysis: analysisText
        },
        timestamp: new Date().toISOString(),
        disclaimer: "This analysis is AI-generated for informational purposes. Always consult an agricultural expert for serious issues."
      });
    }

    // ✅ Return structured response
    res.json({
      analysis,
      cropType: cropType || "Not specified",
      timestamp: new Date().toISOString(),
      disclaimer: "This analysis is AI-generated for informational purposes. Always consult an agricultural expert for serious issues."
    });

  } catch (error) {
    console.error("Error analyzing crop:", error);
    res.status(500).json({
      error: "Failed to analyze crop image",
      details: error.message,
    });
  }
});

/* --------------------------- AI SOIL REPORT ANALYSIS --------------------------- */
/* --------------------------- AI SOIL REPORT ANALYSIS --------------------------- */
app.post("/api/soil/analyze", async (req, res) => {
  try {
    const { reportText } = req.body;

    if (!reportText) {
      return res.status(400).json({ error: "Soil report content is required" });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "Gemini API key not configured. Please add GEMINI_API_KEY to your .env file",
      });
    }

    console.log("Calling Gemini AI for soil analysis...");

    const prompt = `You are an expert agricultural soil scientist and AI assistant. Analyze the following soil test report and provide comprehensive, farmer-friendly recommendations.

SOIL TEST REPORT:
${reportText}

Provide your analysis as a valid JSON object with this EXACT structure (no markdown, no extra text):

{
  "soilHealthSummary": {
    "overallHealth": "Good/Fair/Poor",
    "soilType": "Sandy/Loamy/Clay/Sandy Loam/Clay Loam",
    "summary": "Brief 2-3 sentence overview of soil condition",
    "keyIssues": ["Issue 1", "Issue 2", "Issue 3"]
  },
  "parameters": [
    {
      "name": "pH",
      "value": "6.5",
      "unit": "",
      "optimalRange": "6.0-7.5",
      "status": "Optimal/Low/High",
      "interpretation": "Brief explanation of what this value means",
      "recommendation": "Specific action if needed"
    },
    {
      "name": "Nitrogen (N)",
      "value": "180",
      "unit": "kg/ha",
      "optimalRange": "200-300",
      "status": "Low",
      "interpretation": "Nitrogen is below optimal level",
      "recommendation": "Apply 40-50 kg/ha of urea or organic compost"
    },
    {
      "name": "Phosphorus (P)",
      "value": "25",
      "unit": "kg/ha",
      "optimalRange": "20-35",
      "status": "Optimal",
      "interpretation": "Phosphorus levels are adequate for most crops",
      "recommendation": "Maintain current levels"
    },
    {
      "name": "Potassium (K)",
      "value": "150",
      "unit": "kg/ha",
      "optimalRange": "120-180",
      "status": "Optimal",
      "interpretation": "Potassium is at good levels",
      "recommendation": "Continue balanced fertilization"
    },
    {
      "name": "Organic Carbon",
      "value": "0.45",
      "unit": "%",
      "optimalRange": "0.5-1.0",
      "status": "Low",
      "interpretation": "Organic matter is below recommended level",
      "recommendation": "Add farmyard manure or compost"
    }
  ],
  "cropRecommendations": [
    {
      "name": "Rice",
      "suitability": "Highly Suitable/Suitable/Moderately Suitable",
      "season": "Kharif (June-October)",
      "reason": "Soil has adequate moisture retention and pH suitable for rice cultivation",
      "expectedYield": "40-50 quintals/hectare"
    },
    {
      "name": "Wheat",
      "suitability": "Suitable",
      "season": "Rabi (November-March)",
      "reason": "Good soil structure and nutrient availability for wheat",
      "expectedYield": "35-45 quintals/hectare"
    }
  ],
  "fertilizerRecommendations": [
    {
      "name": "Urea",
      "type": "Nitrogen Fertilizer",
      "dosage": "50 kg/hectare",
      "applicationMethod": "Split application - 25 kg at sowing, 25 kg at tillering stage",
      "timing": "Apply before rainfall or irrigation",
      "purpose": "To increase nitrogen levels for better crop growth"
    },
    {
      "name": "DAP (Di-ammonium Phosphate)",
      "type": "Phosphorus Fertilizer",
      "dosage": "30 kg/hectare",
      "applicationMethod": "Apply as basal dose at the time of sowing",
      "timing": "Pre-sowing or at sowing",
      "purpose": "Maintain phosphorus levels"
    },
    {
      "name": "Farmyard Manure (FYM)",
      "type": "Organic Fertilizer",
      "dosage": "10-15 tonnes/hectare",
      "applicationMethod": "Spread evenly and incorporate into soil",
      "timing": "2-3 weeks before sowing",
      "purpose": "Improve organic carbon and soil structure"
    }
  ],
  "soilTreatments": [
    {
      "title": "Increase Organic Matter",
      "description": "Apply 10-15 tonnes of well-decomposed farmyard manure or compost per hectare. This will improve soil structure, water retention, and nutrient availability.",
      "priority": "High"
    },
    {
      "title": "Improve Drainage",
      "description": "Create proper drainage channels if waterlogging is observed. Good drainage prevents nutrient leaching and root diseases.",
      "priority": "Medium"
    },
    {
      "title": "Regular Soil Testing",
      "description": "Conduct soil testing every 2-3 years to monitor nutrient levels and adjust fertilizer application accordingly.",
      "priority": "Low"
    }
  ],
  "seasonalCalendar": [
    {
      "season": "Summer (March-May)",
      "months": "March, April, May",
      "activities": [
        "Prepare land for Kharif crops",
        "Apply organic manure and incorporate into soil",
        "Deep plowing to improve soil aeration",
        "Consider summer crops like Green gram, Black gram if irrigation available"
      ]
    },
    {
      "season": "Kharif/Monsoon (June-October)",
      "months": "June, July, August, September, October",
      "activities": [
        "Sow rice, cotton, soybean, or other monsoon crops",
        "Apply basal fertilizers before sowing",
        "Monitor for pests and diseases",
        "Apply top-dressing of nitrogen fertilizers"
      ]
    },
    {
      "season": "Rabi/Winter (November-February)",
      "months": "November, December, January, February",
      "activities": [
        "Sow wheat, chickpea, mustard, or other winter crops",
        "Ensure proper irrigation schedule",
        "Apply fertilizers in split doses",
        "Weed management"
      ]
    }
  ]
}

ANALYSIS GUIDELINES:
1. Extract all numerical values for pH, N, P, K, Organic Carbon, EC, micronutrients (Zn, Fe, Mn, Cu, B, S)
2. For each parameter, determine if it's Low, Optimal, or High based on standard agricultural ranges
3. Recommend crops based on soil type, pH, and nutrient availability
4. Suggest specific fertilizers with exact dosages and application methods
5. Consider Indian farming conditions and local availability
6. Provide practical, cost-effective solutions
7. Include both organic and chemical fertilizer options
8. Create a seasonal calendar relevant to Indian agricultural seasons

IMPORTANT:
- Be specific with numerical values and units
- Provide realistic yield expectations
- Consider farmer budget and accessibility
- Include both immediate and long-term soil improvement plans
- Return ONLY the JSON object, no additional text

If the report data is incomplete or unclear, make reasonable assumptions based on typical Indian agricultural soil conditions and clearly state them in the summary.`;

    const analysis = await analyzeHealthWithGemini(prompt);

    // Parse JSON response
    let structuredAnalysis;
    try {
      const cleanedText = analysis
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      structuredAnalysis = JSON.parse(cleanedText);
      
      // Validate structure
      if (!structuredAnalysis.soilHealthSummary || !structuredAnalysis.parameters) {
        throw new Error("Invalid response structure");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      console.log("Raw response:", analysis);
      
      // Fallback response
      return res.json({
        analysis: {
          soilHealthSummary: {
            overallHealth: "Analysis Complete",
            soilType: "Unknown",
            summary: "Unable to structure the response. Please check the raw analysis.",
            keyIssues: []
          },
          parameters: [],
          cropRecommendations: [],
          fertilizerRecommendations: [],
          soilTreatments: [],
          seasonalCalendar: [],
          rawAnalysis: analysis
        },
        timestamp: new Date().toISOString(),
        disclaimer: "This analysis is AI-generated for informational purposes. Consult an agronomist before taking major actions."
      });
    }

    res.json({
      analysis: structuredAnalysis,
      timestamp: new Date().toISOString(),
      disclaimer: "This analysis is AI-generated for informational purposes. Consult an agronomist before taking major actions."
    });
  } catch (error) {
    console.error("Error analyzing soil report:", error);
    res.status(500).json({
      error: "Failed to analyze soil report",
      details: error.message,
    });
  }
});
/* ----------------------------------------------------------------------------------------------------------------------------- */
app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "Missing GEMINI_API_KEY in .env" });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const prompt = `
You are an intelligent Agri-Health AI Assistant. 
You help farmers and rural users with:
- Human health symptoms
- Crop diseases
- Soil analysis
- Fertilizer and diet recommendations
- General agriculture queries

Question: ${message}

Answer clearly, politely, and in simple farmer-friendly language.
    `;

    async function generateWithRetry(model, prompt, retries = 3, delay = 3000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (err) {
      if (err.status === 429 && attempt < retries) {
        console.log(`⚠️ Gemini rate limit hit. Retrying in ${delay / 1000}s...`);
        await new Promise((res) => setTimeout(res, delay));
      } else {
        throw err;
      }
    }
  }
}

const responseText = await generateWithRetry(model, prompt);

    res.json({ reply: responseText });
  } catch (error) {
    console.error("Chat API Error:", error);
    res.status(500).json({
      error: "Failed to generate AI response.",
      details: error.message,
    });
  }
});
/* ----------------------------------------------------------------------------------------------------------------------------- */

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is listening on ${PORT}`);
});

Connection();