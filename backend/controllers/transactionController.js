const Transaction = require('../models/Transaction');
const { body, validationResult } = require('express-validator');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

// @desc   Add a transaction
// @route  POST /api/transactions
// @access Private
const addTransaction = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { amount, category, description, date, type } = req.body;

    const transaction = await Transaction.create({
      userId: req.user._id,
      amount,
      category,
      description,
      date: date || Date.now(),
      type: type || 'expense',
    });

    res.status(201).json({ success: true, message: 'Transaction added.', transaction });
  } catch (error) {
    next(error);
  }
};

// @desc   Get all transactions for current user
// @route  GET /api/transactions
// @access Private
const getTransactions = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, category, startDate, endDate } = req.query;

    const filter = { userId: req.user._id };
    if (category) filter.category = category;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const total = await Transaction.countDocuments(filter);
    const transactions = await Transaction.find(filter)
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      transactions,
    });
  } catch (error) {
    next(error);
  }
};

// @desc   Delete a transaction
// @route  DELETE /api/transactions/:id
// @access Private
const deleteTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found.' });
    }

    res.status(200).json({ success: true, message: 'Transaction deleted.' });
  } catch (error) {
    next(error);
  }
};

// @desc   Upload transactions via CSV
// @route  POST /api/transactions/upload
// @access Private
const uploadCSV = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No CSV file uploaded.' });
    }

    const results = [];
    const filePath = req.file.path;

    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          // Expect CSV columns: amount, category, description, date, type
          if (row.amount && row.category) {
            results.push({
              userId: req.user._id,
              amount: Number(row.amount),
              category: row.category.trim(),
              description: row.description || '',
              date: row.date ? new Date(row.date) : new Date(),
              type: row.type || 'expense',
            });
          }
        })
        .on('end', resolve)
        .on('error', reject);
    });

    // Clean up temp file
    fs.unlinkSync(filePath);

    if (results.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid rows found in CSV. Required columns: amount, category.' });
    }

    const inserted = await Transaction.insertMany(results);

    res.status(201).json({
      success: true,
      message: `${inserted.length} transactions imported from CSV.`,
      count: inserted.length,
    });
  } catch (error) {
    next(error);
  }
};

// Validation
const transactionValidation = [
  body('amount').isNumeric().withMessage('Amount must be a number').custom((v) => v > 0).withMessage('Amount must be positive'),
  body('category').trim().notEmpty().withMessage('Category is required'),
];

// @desc   Load sample/demo transactions
// @route  POST /api/transactions/sample
// @access Private
const loadSampleData = async (req, res, next) => {
  try {
    const now = new Date();
    const months = [-2, -1, 0]; // last 3 months

    const samples = [];
    months.forEach((mOffset) => {
      const d = (day) => {
        const date = new Date(now);
        date.setMonth(date.getMonth() + mOffset);
        date.setDate(day);
        return date;
      };
      samples.push(
        { userId: req.user._id, amount: 1200, category: 'Housing',       description: 'Rent payment',          date: d(1),  type: 'expense' },
        { userId: req.user._id, amount: 320,  category: 'Food',          description: 'Groceries',             date: d(5),  type: 'expense' },
        { userId: req.user._id, amount: 85,   category: 'Food',          description: 'Restaurants & dining',  date: d(12), type: 'expense' },
        { userId: req.user._id, amount: 150,  category: 'Transport',     description: 'Fuel & Uber',           date: d(8),  type: 'expense' },
        { userId: req.user._id, amount: 60,   category: 'Entertainment', description: 'Netflix & Spotify',     date: d(3),  type: 'expense' },
        { userId: req.user._id, amount: 200,  category: 'Utilities',     description: 'Electric & Internet',   date: d(7),  type: 'expense' },
        { userId: req.user._id, amount: 90,   category: 'Personal',      description: 'Gym & Personal care',   date: d(15), type: 'expense' },
        { userId: req.user._id, amount: 500,  category: 'Saving Tools',  description: 'SIP Investment',        date: d(1),  type: 'income'  },
      );
    });

    // Remove existing sample data to avoid duplicates, then insert fresh
    await Transaction.deleteMany({ userId: req.user._id, description: { $in: ['Rent payment', 'Groceries', 'Restaurants & dining', 'Fuel & Uber', 'Netflix & Spotify', 'Electric & Internet', 'Gym & Personal care', 'SIP Investment'] } });
    const inserted = await Transaction.insertMany(samples);

    res.status(201).json({
      success: true,
      message: `${inserted.length} sample transactions loaded.`,
      count: inserted.length,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { addTransaction, getTransactions, deleteTransaction, uploadCSV, loadSampleData, transactionValidation };
