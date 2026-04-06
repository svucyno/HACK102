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
    const categoryBreakdown = dashboardContext.categoryBreakdown || [];
    const recentTransactions = dashboardContext.recentTransactions || [];
    const hasData = dashboardContext.hasData !== undefined
      ? dashboardContext.hasData
      : (recentTransactions.length > 0 || totalSpending > 0);

    // Guard: truly no transaction data at all
    if (!hasData) {
      return "Please upload your bank transactions (CSV) or add a few transactions manually so I can analyse your spending and give you personalised advice!";
    }

    // Build category summary sorted high → low
    const categoryLines = Array.isArray(categoryBreakdown) && categoryBreakdown.length > 0
      ? [...categoryBreakdown]
          .sort((a, b) => b.value - a.value)
          .map(c => `  - ${c.name}: \u20b9${Number(c.value).toLocaleString('en-IN')}`)
          .join('\n')
      : '  - No category breakdown available';

    // Build recent transactions table
    const txLines = recentTransactions.length > 0
      ? recentTransactions
          .map(tx => `  [${tx.date}] ${tx.description} | ${tx.category} | \u20b9${Number(tx.amount).toLocaleString('en-IN')}`)
          .join('\n')
      : '  - No recent transactions';

    const savingsPct = user?.savingsGoal?.percentage || 20;
    const savingsTarget = (income * savingsPct) / 100;
    const currentSavings = Math.max(0, income - totalSpending);
    const savingsRatePct = income > 0 ? ((currentSavings / income) * 100).toFixed(1) : 0;

    const intentGuidance = {
      goal_purchase: `The user wants to buy something. Extract the target amount if mentioned. Calculate: monthly savings needed, months to reach the goal from their disposable income of \u20b9${remaining.toLocaleString('en-IN')}, which spending categories to cut, and whether EMI makes sense. Be specific with \u20b9 amounts and timelines.`,
      goal_saving: `The user wants to save more. Their current savings rate is ${savingsRatePct}% vs the target of ${savingsPct}%. Identify the top 2-3 spending categories to cut, suggest a concrete monthly savings amount, and give a 3-step action plan with \u20b9 numbers.`,
      goal_planning: `Create a monthly budget plan. Use the 50/30/20 rule adapted to Indian context. Assign \u20b9 amounts to: essentials, discretionary, savings, investments. Base it on their income of \u20b9${income.toLocaleString('en-IN')}.`,
      goal_invest: `The user wants to invest. They have \u20b9${remaining.toLocaleString('en-IN')} disposable. Suggest SIP amounts, recommend equity/debt/gold split for Indian markets, and mention tax-saving options like ELSS, PPF, or NPS.`,
      goal_reduce: `The user wants to cut spending. Look at their highest categories below. Pick the top 2-3, suggest specific \u20b9 cuts, and project total monthly savings if they follow through.`,
      goal_analyze: `Give a full spending analysis: income vs spending, current savings rate (${savingsRatePct}%), top spending categories, and 3 specific improvements for this month. Reference actual transaction data.`,
      general: `Answer the user's question using their real financial data. Be specific, include \u20b9 amounts, and give at least one actionable next step.`,
    };

    const fullPrompt = `You are an intelligent financial advisor for an Indian user. You have FULL ACCESS to their real financial data below. Use it to give specific, personalised advice — never generic answers.

CRITICAL RULES:
- ALWAYS use \u20b9 (Indian Rupees). NEVER use $.
- Format numbers in Indian style: \u20b910,000 / \u20b91,50,000.
- Reference ACTUAL numbers from their data in your answer.
- Structure response with bullet points or short sections.
- Keep response concise: 150-300 words.
- Do NOT say "I don't have enough data" — you have their full history below.

\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
USER FINANCIAL PROFILE
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
- Monthly Income:         \u20b9${income.toLocaleString('en-IN')}
- Total Spending (All):   \u20b9${totalSpending.toLocaleString('en-IN')}
- Disposable / Remaining: \u20b9${remaining.toLocaleString('en-IN')}
- Current Savings Rate:   ${savingsRatePct}%
- Savings Goal:           ${savingsPct}% = \u20b9${savingsTarget.toLocaleString('en-IN')}/month

SPENDING BY CATEGORY (highest to lowest):
${categoryLines}

RECENT TRANSACTIONS (last 10):
${txLines}

\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
DETECTED INTENT: ${intent}
TASK: ${intentGuidance[intent] || intentGuidance.general}
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550

USER MESSAGE: "${userMessage}"

Generate a personalised, insightful response grounded in the REAL data above.`;

    console.log('User message:', userMessage);
    console.log('Detected intent:', intent);
    console.log(`Data: income=\u20b9${income} | spending=\u20b9${totalSpending} | categories=${categoryBreakdown.length} | txns=${recentTransactions.length}`);

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(fullPrompt);
    let text = result.response.text().trim();

    // Safety: replace any stray dollar signs
    text = text.replace(/\$/g, '\u20b9');

    console.log('AI RAW RESPONSE:', text.substring(0, 200) + (text.length > 200 ? '...' : ''));
    return text;
  } catch (error) {
    console.error('Gemini Chat error:', error.message);
    return "I couldn't fully analyse that right now. Try asking about your spending, savings plan, or a financial goal.";
  }
};

module.exports = { getAIRecommendations, chatWithGemini };

