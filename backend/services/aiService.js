const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Build a structured financial prompt from user data
 */
const buildPrompt = (user, categoryTotals, monthlyTrend, totalSpending) => {
  const categoryLines = Object.entries(categoryTotals)
    .map(([cat, amt]) => `  - ${cat}: $${amt.toFixed(2)}`)
    .join('\n');

  const trendLines = monthlyTrend
    .map((m) => `  - ${m.month}: $${m.total.toFixed(2)}`)
    .join('\n');

  return `You are an expert financial advisor AI. Analyze this user's spending data and provide 3-5 specific, actionable savings recommendations.

USER PROFILE:
- Monthly Income: $${user.income || 0}
- Currency: ${user.currency || 'USD'}
- Savings Goal: ${user.savingsGoal?.percentage || 20}% of income ($${((user.income || 0) * (user.savingsGoal?.percentage || 20)) / 100}/month)

SPENDING ANALYSIS (Last 30 days):
- Total Spending: $${totalSpending.toFixed(2)}
- Remaining After Spending: $${((user.income || 0) - totalSpending).toFixed(2)}

CATEGORY BREAKDOWN:
${categoryLines || '  - No transactions recorded yet'}

MONTHLY TREND (Last 3 months):
${trendLines || '  - No trend data available'}

INSTRUCTIONS:
Return ONLY a valid JSON array with 3-5 recommendations. No extra text. Each object must have:
- "title": Short recommendation title (max 5 words)
- "suggestion": Specific actionable advice (1-2 sentences, include numbers if possible)
- "priority": One of ["High", "Medium", "Low"]
- "potentialSavings": Estimated monthly savings amount as a number (0 if unknown)

Example format:
[{"title":"...","suggestion":"...","priority":"High","potentialSavings":150}]`;
};

/**
 * Get AI recommendations using Google Gemini
 */
const getAIRecommendations = async (user, categoryTotals, monthlyTrend, totalSpending) => {
  try {
    const prompt = buildPrompt(user, categoryTotals, monthlyTrend, totalSpending);

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    // Safely extract JSON array from the response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('Gemini did not return a valid JSON array');

    const recommendations = JSON.parse(jsonMatch[0]);

    // Validate and normalize structure to match frontend expectations
    return recommendations.map((rec, idx) => ({
      id: idx + 1,
      title: rec.title || 'Recommendation',
      suggestion: rec.suggestion || 'Review your spending habits.',
      priority: ['High', 'Medium', 'Low'].includes(rec.priority) ? rec.priority : 'Medium',
      potentialSavings: Number(rec.potentialSavings) || 0,
    }));

  } catch (error) {
    console.error('Gemini AI Service error:', error.message);

    // Fallback recommendations if Gemini fails or key is not set yet
    return [
      {
        id: 1,
        title: 'Track Daily Expenses',
        suggestion: 'Log every transaction daily to maintain awareness of your spending patterns.',
        priority: 'High',
        potentialSavings: 0,
      },
      {
        id: 2,
        title: 'Review Subscriptions',
        suggestion: "Audit all recurring subscriptions and cancel any you haven't used in the past month.",
        priority: 'Medium',
        potentialSavings: 50,
      },
      {
        id: 3,
        title: 'Set a Monthly Budget',
        suggestion: `Aim to save ${user.savingsGoal?.percentage || 20}% of your income each month by reducing discretionary spending.`,
        priority: 'Medium',
        potentialSavings: 0,
      },
    ];
  }
};

/**
 * Handle custom chat queries to Gemini AI
 */
const chatWithGemini = async (user, dashboardContext, prompt) => {
  try {
    const systemInstruction = `You are a helpful and professional financial advisor AI for the app SmartSpend. 
Context for the user:
- Income: $${dashboardContext.income || 0}
- Total Spending: $${dashboardContext.totalSpending || 0}
- Categories: ${JSON.stringify(dashboardContext.categoryBreakdown || {})}
- Trend: ${JSON.stringify(dashboardContext.trends || {})}

Keep responses concise, actionable, and formatted well. Treat the user respectfully. 
Answer the user's specific query based on their financial data.`;

    console.log("Incoming message:", prompt);

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash"
    });

    // gemini-pro doesn't support systemInstruction property directly in the SDK, so we prepend it to the prompt
    const fullPrompt = systemInstruction + '\n\nUser Query: ' + prompt;
    const result = await model.generateContent(fullPrompt);
    return result.response.text().trim();
  } catch (error) {
    console.error('Gemini Chat error:', error.message);
    return "Try reducing unnecessary expenses this month.";
  }
};

module.exports = { getAIRecommendations, chatWithGemini };
