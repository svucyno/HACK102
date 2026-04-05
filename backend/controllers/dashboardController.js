const Transaction = require('../models/Transaction');
const { getAIRecommendations, chatWithGemini } = require('../services/aiService');

// @desc   Get full dashboard data
// @route  GET /api/dashboard
// @access Private
const getDashboard = async (req, res, next) => {
  try {
    const user = req.user;
    
    // 1. Fetch all user transactions
    const transactions = await Transaction.find({ userId: user._id }).sort({ date: -1 });

    // 2. Calculate Total Spending
    const totalSpending = transactions.reduce((sum, t) => sum + (t.type === 'expense' ? t.amount : 0), 0);

    // 3. Category Breakdown
    const categoryMap = {};
    transactions.forEach(t => {
      if (t.type === 'expense') {
        if (!categoryMap[t.category]) {
          categoryMap[t.category] = 0;
        }
        categoryMap[t.category] += t.amount;
      }
    });

    const categoryBreakdown = Object.keys(categoryMap).map(key => ({
      name: key, // Recharts uses 'name' and 'value' usually, tracking mapping requirements
      value: categoryMap[key]
    }));

    // 4. Monthly Trend
    const monthlyMap = {};
    const reversedTransactions = [...transactions].reverse(); // oldest to newest for chronological trend
    reversedTransactions.forEach(t => {
      if (t.type === 'expense') {
        const d = new Date(t.date);
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthKey = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
        
        if (!monthlyMap[monthKey]) {
          monthlyMap[monthKey] = 0;
        }
        monthlyMap[monthKey] += t.amount;
      }
    });

    const trends = Object.keys(monthlyMap).map(month => ({
      month,
      expenses: monthlyMap[month]
    }));

    // 5. Connect AI (Gemini)
    console.log("Analyzing dashboard data: ", { totalSpending, categories: categoryMap }); // 10. Debug logs

    const recommendations = await getAIRecommendations(user, categoryMap, trends, totalSpending);

    // Filter properties for the response
    const savings = Math.max(0, (user.income || 0) - totalSpending);
    const budgetLimit = user.income || totalSpending * 1.2; 
    const budgetUsage = budgetLimit > 0 ? Math.min(100, Math.round((totalSpending / budgetLimit) * 100)) : 0;

    // 6. Return Complete Response Structure
    res.status(200).json({
      success: true,
      data: {
        totalSpending: parseFloat(totalSpending.toFixed(2)),
        savings: parseFloat(savings.toFixed(2)),
        budgetUsage,
        income: user.income || 0,
        currency: user.currency || 'USD',
        categoryData: categoryBreakdown,
        trendData: trends,
        aiRecommendations: recommendations,
        transactions: transactions.slice(0, 10).map(tx => ({
          id: tx._id,
          date: new Date(tx.date).toLocaleDateString(),
          description: tx.description,
          category: tx.category,
          amount: tx.amount
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc   Handle AI chat queries
// @route  POST /api/dashboard/chat
// @access Private
const chatWithAI = async (req, res, next) => {
  try {
    const user = req.user;
    const { context, prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ success: false, message: 'Prompt is required' });
    }

    const reply = await chatWithGemini(user, context || {}, prompt);

    res.status(200).json({
      success: true,
      reply
    });
  } catch (error) {
    res.status(500).json({ message: "AI error" });
  }
};

module.exports = { getDashboard, chatWithAI };
