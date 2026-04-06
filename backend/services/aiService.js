const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Model cascade: try models in order of preference
const GEMINI_MODELS = [
  'gemini-2.0-flash-lite',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-2.5-flash',
];

/**
 * Try generating content with model cascade (handles quota errors gracefully)
 */
const generateWithFallback = async (prompt) => {
  let lastError = null;
  for (const modelName of GEMINI_MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      console.log(`[AI] Success with model: ${modelName}`);
      return text;
    } catch (err) {
      console.warn(`[AI] Model ${modelName} failed: ${err.message?.substring(0, 80)}`);
      lastError = err;
    }
  }
  throw lastError;
};

// ─────────────────────────────────────────────────────────────────────────────
// Smart local fallback — generates real insights from data WITHOUT Gemini
// ─────────────────────────────────────────────────────────────────────────────
const buildLocalFallback = (context, userMessage) => {
  const income = context.income || 0;
  const totalSpending = context.totalSpending || 0;
  const remaining = income - totalSpending;
  const categories = context.categoryBreakdown || [];
  const savingsPct = context.savingsGoal?.percentage || 20;
  const savingsTarget = (income * savingsPct) / 100;
  const currentSavingsRate = income > 0 ? ((remaining / income) * 100).toFixed(1) : 0;

  if (!context.hasData) {
    return '📂 Please upload your bank transactions (CSV) or add a few transactions manually so I can analyse your spending!';
  }

  // Sort categories by spend
  const sortedCats = [...categories].sort((a, b) => b.value - a.value);
  const topCat = sortedCats[0];
  const catLines = sortedCats
    .map((c) => `• **${c.name}**: ₹${Number(c.value).toLocaleString('en-IN')}`)
    .join('\n');

  const lower = userMessage.toLowerCase();

  // Goal / purchase intent
  if (lower.includes('buy') || lower.includes('purchase') || lower.includes('car') || lower.includes('bike') || lower.includes('phone')) {
    const amountMatch = userMessage.match(/₹?\s*([\d,]+)/);
    const goalAmount = amountMatch ? Number(amountMatch[1].replace(/,/g, '')) : null;
    if (goalAmount && remaining > 0) {
      const months = Math.ceil(goalAmount / remaining);
      return `## 🎯 Goal Plan\n\n- **Target Amount**: ₹${goalAmount.toLocaleString('en-IN')}\n- **Your Monthly Disposable Income**: ₹${remaining.toLocaleString('en-IN')}\n- **Estimated Time to Save**: **${months} months**\n\n## 💡 Tips to Reach Your Goal Faster\n\n- Your biggest spending category is **${topCat?.name || 'unknown'}** at ₹${Number(topCat?.value || 0).toLocaleString('en-IN')} — consider reducing it by 20%\n- That would save you ₹${Math.round((topCat?.value || 0) * 0.2).toLocaleString('en-IN')}/month extra\n- With that saving, you could reach your goal in **${Math.ceil(goalAmount / (remaining + (topCat?.value || 0) * 0.2))} months** instead`;
    }
    return `## 🎯 Purchase Plan\n\nTo plan a purchase:\n- Your current monthly savings capacity: ₹${remaining.toLocaleString('en-IN')}\n- Top spending area: **${topCat?.name || 'N/A'}** at ₹${Number(topCat?.value || 0).toLocaleString('en-IN')}\n\nReduce top spending by 20% to free up ₹${Math.round((topCat?.value || 0) * 0.2).toLocaleString('en-IN')}/month for your goal.`;
  }

  // Spending analysis
  if (lower.includes('analys') || lower.includes('review') || lower.includes('spending') || lower.includes('how am i')) {
    const status = remaining >= savingsTarget ? '✅ On track!' : '⚠️ Below target';
    return `## 📊 Your Spending Analysis\n\n- **Monthly Income**: ₹${income.toLocaleString('en-IN')}\n- **Total Spending**: ₹${totalSpending.toLocaleString('en-IN')}\n- **Remaining**: ₹${remaining.toLocaleString('en-IN')}\n- **Savings Rate**: ${currentSavingsRate}% (target: ${savingsPct}%) ${status}\n\n## 💰 Spending by Category\n\n${catLines}\n\n## 🔍 Key Insight\n\n${topCat ? `Your largest expense is **${topCat.name}** at ₹${Number(topCat.value).toLocaleString('en-IN')}. Cutting it by 15% would free up ₹${Math.round(topCat.value * 0.15).toLocaleString('en-IN')}/month.` : 'Add more transactions for deeper insights.'}`;
  }

  // Savings intent
  if (lower.includes('save') || lower.includes('saving')) {
    const gap = savingsTarget - remaining;
    return `## 💰 Savings Analysis\n\n- **Your savings target**: ₹${savingsTarget.toLocaleString('en-IN')}/month (${savingsPct}%)\n- **Your current savings**: ₹${remaining.toLocaleString('en-IN')}/month (${currentSavingsRate}%)\n${gap > 0 ? `- **Monthly gap**: ₹${gap.toLocaleString('en-IN')} — here's how to close it:\n\n` : '- ✅ You are already meeting your savings target!\n\n'}## 🎯 Action Plan\n\n${sortedCats.slice(0, 3).map((c, i) => `${i + 1}. Reduce **${c.name}** (₹${Number(c.value).toLocaleString('en-IN')}) by 15% → saves ₹${Math.round(c.value * 0.15).toLocaleString('en-IN')}/month`).join('\n')}`;
  }

  // Budget / plan intent
  if (lower.includes('budget') || lower.includes('plan') || lower.includes('allocat')) {
    const needs = Math.round(income * 0.5);
    const wants = Math.round(income * 0.3);
    const savings = Math.round(income * 0.2);
    return `## 📋 Your Monthly Budget Plan (50/30/20 Rule)\n\n- **Needs (50%)**: ₹${needs.toLocaleString('en-IN')} — rent, food, transport, utilities\n- **Wants (30%)**: ₹${wants.toLocaleString('en-IN')} — entertainment, dining, shopping\n- **Savings (20%)**: ₹${savings.toLocaleString('en-IN')} — emergency fund, SIP, investments\n\n## 📊 Your Current Split\n\n- Spending: ₹${totalSpending.toLocaleString('en-IN')} (${income > 0 ? ((totalSpending / income) * 100).toFixed(0) : 0}% of income)\n- Savings: ₹${remaining.toLocaleString('en-IN')} (${currentSavingsRate}% of income)\n\n${totalSpending > needs + wants ? '⚠️ Your spending exceeds the recommended limit. Focus on reducing discretionary expenses.' : '✅ Your spending is within a healthy range!'}`;
  }

  // Default: full summary
  return `## 📊 Financial Summary\n\n- **Income**: ₹${income.toLocaleString('en-IN')}/month\n- **Spending**: ₹${totalSpending.toLocaleString('en-IN')}/month\n- **Disposable**: ₹${remaining.toLocaleString('en-IN')}/month\n- **Savings Rate**: ${currentSavingsRate}% (target: ${savingsPct}%)\n\n## 💰 Top Spending Categories\n\n${catLines || '• No data yet'}\n\n## 💡 Quick Tip\n\n${topCat ? `Cut **${topCat.name}** spending by 20% to save ₹${Math.round(topCat.value * 0.20).toLocaleString('en-IN')} this month.` : 'Upload your bank CSV to get personalised insights.'}`;
};

// ─────────────────────────────────────────────────────────────────────────────
// Build prompt for AI recommendations panel
// ─────────────────────────────────────────────────────────────────────────────
const buildPrompt = (user, categoryTotals, monthlyTrend, totalSpending) => {
  const categoryLines = Object.entries(categoryTotals)
    .map(([cat, amt]) => `  - ${cat}: ₹${amt.toFixed(2)}`)
    .join('\n');

  const trendLines = monthlyTrend
    .map((m) => `  - ${m.month}: ₹${(m.total || m.expenses || 0).toFixed(2)}`)
    .join('\n');

  return `You are a financial advisor for an Indian user.

IMPORTANT RULES:
- Always use Indian Rupees (₹). Never use $.
- Format numbers like ₹10,000 or ₹1,50,000.
- Keep advice practical for Indian users.

USER PROFILE:
- Monthly Income: ₹${user.income || 0}
- Savings Goal: ${user.savingsGoal?.percentage || 20}% of income (₹${((user.income || 0) * (user.savingsGoal?.percentage || 20)) / 100}/month)

SPENDING ANALYSIS (Last 30 days):
- Total Spending: ₹${totalSpending.toFixed(2)}
- Remaining After Spending: ₹${((user.income || 0) - totalSpending).toFixed(2)}

CATEGORY BREAKDOWN:
${categoryLines || '  - No transactions recorded yet'}

MONTHLY TREND:
${trendLines || '  - No trend data available'}

INSTRUCTIONS:
Return ONLY a valid JSON array with 3-5 recommendations. No extra text. Each object must have:
- "title": Short recommendation title (max 5 words)
- "suggestion": Specific actionable advice (1-2 sentences, include ₹ numbers)
- "priority": One of ["High", "Medium", "Low"]
- "potentialSavings": Estimated monthly savings as a number (0 if unknown)

Example: [{"title":"...","suggestion":"...","priority":"High","potentialSavings":1500}]`;
};

// ─────────────────────────────────────────────────────────────────────────────
// Get AI Recommendations (for dashboard panel)
// ─────────────────────────────────────────────────────────────────────────────
const getAIRecommendations = async (user, categoryTotals, monthlyTrend, totalSpending) => {
  try {
    const prompt = buildPrompt(user, categoryTotals, monthlyTrend, totalSpending);
    const text = await generateWithFallback(prompt);

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error('Gemini did not return a valid JSON array');

    const recommendations = JSON.parse(jsonMatch[0]);
    return recommendations.map((rec, idx) => ({
      id: idx + 1,
      title: rec.title || 'Recommendation',
      suggestion: rec.suggestion || 'Review your spending habits.',
      priority: ['High', 'Medium', 'Low'].includes(rec.priority) ? rec.priority : 'Medium',
      potentialSavings: Number(rec.potentialSavings) || 0,
    }));
  } catch (error) {
    console.error('[AI] getAIRecommendations failed:', error.message);
    // Smart local fallback for recommendations
    const cats = Object.entries(categoryTotals).sort(([, a], [, b]) => b - a);
    return [
      {
        id: 1,
        title: cats[0] ? `Reduce ${cats[0][0]} Spend` : 'Track Daily Expenses',
        suggestion: cats[0]
          ? `Your top spend is ${cats[0][0]} at ₹${Number(cats[0][1]).toLocaleString('en-IN')}. Reducing it by 20% saves ₹${Math.round(cats[0][1] * 0.2).toLocaleString('en-IN')}/month.`
          : 'Log every transaction daily to stay aware of your spending patterns.',
        priority: 'High',
        potentialSavings: cats[0] ? Math.round(cats[0][1] * 0.2) : 0,
      },
      {
        id: 2,
        title: 'Build Emergency Fund',
        suggestion: `Save ₹${Math.round(((user.income || 0) * 0.1)).toLocaleString('en-IN')}/month (10% of income) until you have 3–6 months of expenses as emergency fund.`,
        priority: 'Medium',
        potentialSavings: 0,
      },
      {
        id: 3,
        title: 'Start a SIP',
        suggestion: `Invest ₹${Math.round(((user.income || 0) * 0.1)).toLocaleString('en-IN')}/month in a diversified equity mutual fund SIP for long-term wealth creation.`,
        priority: 'Medium',
        potentialSavings: 0,
      },
    ];
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Detect user intent from message
// ─────────────────────────────────────────────────────────────────────────────
const detectIntent = (message) => {
  const lower = message.toLowerCase();
  if (lower.includes('buy') || lower.includes('purchase') || lower.includes('car') || lower.includes('bike') || lower.includes('phone')) return 'goal_purchase';
  if (lower.includes('save') || lower.includes('saving') || lower.includes('savings')) return 'goal_saving';
  if (lower.includes('plan') || lower.includes('budget') || lower.includes('allocat')) return 'goal_planning';
  if (lower.includes('invest') || lower.includes('sip') || lower.includes('mutual fund') || lower.includes('stock')) return 'goal_invest';
  if (lower.includes('reduc') || lower.includes('cut') || lower.includes('spend less')) return 'goal_reduce';
  if (lower.includes('analys') || lower.includes('analyse') || lower.includes('review') || lower.includes('how am i') || lower.includes('spending')) return 'goal_analyze';
  return 'general';
};

// ─────────────────────────────────────────────────────────────────────────────
// Chat with Gemini AI
// ─────────────────────────────────────────────────────────────────────────────
const chatWithGemini = async (user, dashboardContext, userMessage) => {
  const intent = detectIntent(userMessage);
  const income = dashboardContext.income || 0;
  const totalSpending = dashboardContext.totalSpending || 0;
  const remaining = income - totalSpending;
  const categoryBreakdown = dashboardContext.categoryBreakdown || [];
  const recentTransactions = dashboardContext.recentTransactions || [];
  const hasData = dashboardContext.hasData !== undefined
    ? dashboardContext.hasData
    : (recentTransactions.length > 0 || totalSpending > 0);

  const savingsPct = user?.savingsGoal?.percentage || 20;
  const savingsTarget = (income * savingsPct) / 100;
  const currentSavings = Math.max(0, remaining);
  const savingsRatePct = income > 0 ? ((currentSavings / income) * 100).toFixed(1) : 0;

  const categoryLines = categoryBreakdown.length > 0
    ? [...categoryBreakdown]
        .sort((a, b) => b.value - a.value)
        .map((c) => `  - ${c.name}: ₹${Number(c.value).toLocaleString('en-IN')}`)
        .join('\n')
    : '  - No category data available';

  const txLines = recentTransactions.length > 0
    ? recentTransactions
        .map((tx) => `  [${tx.date}] ${tx.description} | ${tx.category} | ₹${Number(tx.amount).toLocaleString('en-IN')}`)
        .join('\n')
    : '  - No recent transactions';

  const intentGuidance = {
    goal_purchase: `The user wants to buy something. Extract the target amount if mentioned. Calculate: monthly savings needed, months to reach the goal from their disposable income of ₹${remaining.toLocaleString('en-IN')}, which spending categories to cut, and whether EMI makes sense.`,
    goal_saving: `The user wants to save more. Current savings rate: ${savingsRatePct}%, target: ${savingsPct}%. Identify top 2-3 spending categories to cut, suggest a monthly savings amount, give a 3-step action plan with ₹ numbers.`,
    goal_planning: `Create a monthly budget plan using the 50/30/20 rule for Indian context. Assign ₹ amounts to essentials, discretionary, savings, investments based on income of ₹${income.toLocaleString('en-IN')}.`,
    goal_invest: `The user has ₹${remaining.toLocaleString('en-IN')} disposable. Suggest SIP amounts, equity/debt/gold split for Indian markets, mention ELSS, PPF, or NPS for tax saving.`,
    goal_reduce: `Look at their highest category. Pick top 2-3, suggest specific ₹ cuts, project total monthly savings.`,
    goal_analyze: `Give full spending analysis: income vs spending, savings rate (${savingsRatePct}%), top categories, 3 specific improvements. Reference actual transaction data.`,
    general: `Answer using their real financial data. Be specific with ₹ amounts and give at least one actionable next step.`,
  };

  const fullPrompt = `You are an intelligent financial advisor for an Indian user. You have their FULL financial data. Give specific, personalised advice — NEVER generic responses.

CRITICAL RULES:
- ALWAYS use ₹ (Indian Rupees). NEVER use $.
- Reference ACTUAL numbers from their data.
- Use bullet points or headers for structure.
- 150–300 words max.
- Never say "I don't have enough data" — the data is provided below.

═══════════════════════════════
USER FINANCIAL PROFILE
═══════════════════════════════
Monthly Income:         ₹${income.toLocaleString('en-IN')}
Total Spending:         ₹${totalSpending.toLocaleString('en-IN')}
Disposable / Remaining: ₹${remaining.toLocaleString('en-IN')}
Current Savings Rate:   ${savingsRatePct}%
Savings Goal:           ${savingsPct}% = ₹${savingsTarget.toLocaleString('en-IN')}/month

SPENDING BY CATEGORY (highest → lowest):
${categoryLines}

RECENT TRANSACTIONS (last 10):
${txLines}

═══════════════════════════════
INTENT: ${intent}
TASK: ${intentGuidance[intent] || intentGuidance.general}
═══════════════════════════════

USER MESSAGE: "${userMessage}"

Generate a personalised response using the REAL data above.`;

  console.log(`[AI Chat] intent=${intent} | income=₹${income} | spending=₹${totalSpending} | cats=${categoryBreakdown.length} | txns=${recentTransactions.length}`);

  try {
    const text = await generateWithFallback(fullPrompt);
    const cleaned = text.replace(/\$/g, '₹');
    console.log('[AI Chat] Response preview:', cleaned.substring(0, 150));
    return cleaned;
  } catch (error) {
    console.error('[AI Chat] All Gemini models failed, using local fallback:', error.message?.substring(0, 100));
    // Use smart local fallback when ALL Gemini models fail (quota exhausted)
    return buildLocalFallback({ income, totalSpending, categoryBreakdown, savingsGoal: user?.savingsGoal, hasData }, userMessage);
  }
};

module.exports = { getAIRecommendations, chatWithGemini };
