const User = require('../models/User');

// @desc   Get current user profile
// @route  GET /api/user/profile
// @access Private
const getProfile = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc   Update user profile (income, currency, goals, categories)
// @route  PUT /api/user/profile
// @access Private
const updateProfile = async (req, res, next) => {
  try {
    const { name, income, currency, categories, savingsGoal, monthlySpending, categoryBudgets } = req.body;

    const fieldsToUpdate = {};
    if (name) fieldsToUpdate.name = name;
    if (income !== undefined) fieldsToUpdate.income = income;
    if (currency) fieldsToUpdate.currency = currency;
    if (categories) fieldsToUpdate.categories = categories;
    if (savingsGoal) fieldsToUpdate.savingsGoal = savingsGoal;
    if (monthlySpending !== undefined) fieldsToUpdate.monthlySpending = monthlySpending;
    if (categoryBudgets !== undefined) fieldsToUpdate.categoryBudgets = categoryBudgets;

    const user = await User.findByIdAndUpdate(req.user._id, fieldsToUpdate, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getProfile, updateProfile };
