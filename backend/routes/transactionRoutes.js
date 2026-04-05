const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const authMiddleware = require('../middleware/authMiddleware');
const {
  addTransaction,
  getTransactions,
  deleteTransaction,
  uploadCSV,
  loadSampleData,
  transactionValidation,
} = require('../controllers/transactionController');

// Configure multer for CSV uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `${req.user._id}-${Date.now()}${path.extname(file.originalname)}`),
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || path.extname(file.originalname) === '.csv') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

// All routes protected
router.use(authMiddleware);

// POST /api/transactions
router.post('/', transactionValidation, addTransaction);

// GET /api/transactions
router.get('/', getTransactions);

// DELETE /api/transactions/:id
router.delete('/:id', deleteTransaction);

// POST /api/transactions/upload
router.post('/upload', upload.single('file'), uploadCSV);

// POST /api/transactions/sample
router.post('/sample', loadSampleData);

module.exports = router;
