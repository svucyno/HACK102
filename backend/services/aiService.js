const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Build a structured financial prompt from user data
 */
const buildPrompt = (user, categoryTotals, monthlyTrend, totalSpending) => {
  const categoryLines = Object.entries(categoryTotals)
    .map(([cat, amt]) => `  - ${cat}: ₹${amt.toFixed(2)}`)
    .join('\n');

  const trendLines = monthlyTrend
    .map((m) => `  - ${m.month}: ₹${m.total.toFixed(2)}`)
    .join('\n');

  return `You are a financial advisor for an Indian user.

IMPORTANT RULES:
- Always use Indian Rupees (₹)
- Never use dollars ($)
- Format numbers like ₹10,000 or ₹1,50,000
- Keep advice practical for Indian users

USER PROFILE:
- Monthly Income: ₹${user.income || 0}
- Currency: ₹
- Savings Goal: ${user.savingsGoal?.percentage || 20}% of income (₹${((user.income || 0) * (user.savingsGoal?.percentage || 20)) / 100}/month)

SPENDING ANALYSIS (Last 30 days):
- Total Spending: ₹${totalSpending.toFixed(2)}
- Remaining After Spending: ₹${((user.income || 0) - totalSpending).toFixed(2)}

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
 * Detect user intent from their message
 */
const detectIntent = (message) => {
  const lower = message.toLowerCase();
  if (lower.includes('buy') || lower.includes('purchase') || lower.includes('want')) return 'goal_purchase';
  if (lower.includes('save') || lower.includes('saving') || lower.includes('savings')) return 'goal_saving';
  if (lower.includes('plan') || lower.includes('budget') || lower.includes('allocat')) return 'goal_planning';
  if (lower.includes('invest') || lower.includes('sip') || lower.includes('mutual fund')) return 'goal_invest';
  if (lower.includes('reduc') || lower.includes('cut') || lower.includes('spend less')) return 'goal_reduce';
  if (lower.includes('analyz') || lower.includes('analyse') || lower.includes('review') || lower.includes('how am i')) return 'goal_analyze';
  return 'general';
};

/**
 * Handle custom chat queries to Gemini AI
 */
const chatWithGemini = async (user, dashboardContext, userMessage) => {
  try {
    const intent = detectIntent(userMessage);
    const income = dashboardContext.income || 0;
    const totalSpending = dashboardContext.totalSpending || 0;
    const remaining = income - totalSpending;
    const categoryBreakdown = dashboardContext.categoryBreakdown || {};

    // Build a category summary string
    const categoryLines = Array.isArray(categoryBreakdown)
      ? categoryBreakdown.map(c => `  - ${c.name}: ₹${(c.value || 0).toLocaleString('en-IN')}`).join('\n')
      : Object.entries(categoryBreakdown).map(([k, v]) => `  - ${k}: ₹${Number(v).toLocaleString('en-IN')}`).join('\n');

    const intentGuidance = {
      goal_purchase: `The user wants to buy something. Extract the target amount if mentioned. Create a step-by-step savings plan: monthly savings needed, number of months to reach the goal, which spending categories to cut, and whether EMI is a better option. Be specific with ₹ amounts and months.`,
      goal_saving: `The user wants to save money. Analyse their income vs spending, identify the top 2-3 categories they can reduce, suggest a monthly savings target with ₹ amount, and give a practical 3-step action plan.`,
      goal_planning: `The user wants a financial plan or budget. Create a simple monthly budget allocation: essentials, discretionary, savings, and investments. Use the 50/30/20 rule adapted to Indian context. Include concrete ₹ amounts.`,
      goal_invest: `The user wants to invest. Based on their remaining income (₹${remaining.toLocaleString('en-IN')}), suggest SIP amounts, recommend categories (equity, debt, gold) suited for Indian markets, and mention tax-saving options like ELSS or PPF.`,
      goal_reduce: `The user wants to reduce spending. Identify their highest-spending categories, suggest specific cuts with ₹ amounts, and project how much they will save monthly if they follow the advice.`,
      goal_analyze: `The user wants a spending analysis. Give a clear breakdown: income vs spending, savings rate percentage, best and worst performing categories, and 3 specific improvements they should make this month.`,
      general: `Answer the user's question using their financial data. Be specific, concise, and always include ₹ amounts and actionable next steps.`,
    };

    const fullPrompt = `You are an intelligent, empathetic financial advisor for an Indian user. You have access to their real financial data.

CRITICAL RULES:
- ALWAYS use ₹ (Indian Rupees). NEVER use $.
- Format numbers in Indian style: ₹10,000 / ₹1,50,000.
- Be specific — include real ₹ amounts and timeframes in every response.
- Avoid generic advice. Tailor every response to THIS user's data.
- Structure your response clearly with headers or bullet points.
- Keep responses concise but complete (150–300 words max).

USER FINANCIAL PROFILE:
- Monthly Income: ₹${income.toLocaleString('en-IN')}
- Total Spending This Month: ₹${totalSpending.toLocaleString('en-IN')}
- Remaining / Disposable: ₹${remaining.toLocaleString('en-IN')}
- Savings Goal: ${user?.savingsGoal?.percentage || 20}% of income = ₹${((income * (user?.savingsGoal?.percentage || 20)) / 100).toLocaleString('en-IN')}/month

SPENDING BY CATEGORY:
${categoryLines || '  - No category data available yet'}

DETECTED USER INTENT: ${intent}

INSTRUCTION FOR THIS INTENT:
${intentGuidance[intent] || intentGuidance.general}

USER MESSAGE:
"${userMessage}"

Now generate a personalised, helpful, and specific response. Format it nicely with bullet points or sections where appropriate.`;

    console.log('User message:', userMessage);
    console.log('Detected intent:', intent);

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(fullPrompt);
    let text = result.response.text().trim();
    // Safety: replace any stray dollar signs
    text = text.replace(/\$/g, '₹');

    console.log('AI response:', text.substring(0, 120) + '...');
    return text;
  } catch (error) {
    console.error('Gemini Chat error:', error.message);
    return "I couldn't fully analyze that. Try asking about your savings, spending breakdown, or a financial goal.";
  }
};

module.exports = { getAIRecommendations, chatWithGemini };
