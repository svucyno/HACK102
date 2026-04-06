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
    const estimatedSavings = Math.max(0, (user.income || 0) - (user.monthlySpending || totalSpending));
    const budgetLimit = user.monthlySpending || user.income || totalSpending * 1.2; 
    const budgetUsage = budgetLimit > 0 ? Math.min(100, Math.round((totalSpending / budgetLimit) * 100)) : 0;
    const remainingBudget = Math.max(0, budgetLimit - totalSpending);

    // 6. Return Complete Response Structure
    res.status(200).json({
      success: true,
      data: {
        totalSpending: parseFloat(totalSpending.toFixed(2)),
        savings: parseFloat(estimatedSavings.toFixed(2)), // savings potential or actual savings
        budgetUsage,
        remainingBudget,
        budgetLimit,
        income: user.income || 0,
        currency: 'INR',
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
    const { prompt } = req.body;

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ success: false, message: 'Prompt is required' });
    }

    // Always fetch live data from DB — never trust client-side context alone
    const transactions = await Transaction.find({ userId: user._id }).sort({ date: -1 }).limit(50);

    const totalSpending = transactions.reduce((sum, t) => sum + (t.type === 'expense' ? t.amount : 0), 0);

    // Build category breakdown
    const categoryMap = {};
    transactions.forEach(t => {
      if (t.type === 'expense') {
        categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
      }
    });
    const categoryBreakdown = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));

    // Build recent transactions summary (last 10)
    const recentTransactions = transactions.slice(0, 10).map(tx => ({
      date: new Date(tx.date).toLocaleDateString('en-IN'),
      description: tx.description,
      category: tx.category,
      amount: tx.amount,
      type: tx.type,
    }));

    const serverContext = {
      income: user.income || 0,
      totalSpending,
      categoryBreakdown,
      recentTransactions,
      savingsGoal: user.savingsGoal,
      hasData: transactions.length > 0,
    };

    console.log('Chat context built from DB:', {
      income: serverContext.income,
      totalSpending: serverContext.totalSpending,
      categories: categoryBreakdown.length,
      transactions: transactions.length,
    });

    const reply = await chatWithGemini(user, serverContext, prompt);

    res.status(200).json({ success: true, reply });
  } catch (error) {
    console.error('chatWithAI error:', error.message);
    next(error);
  }
};

module.exports = { getDashboard, chatWithAI };
