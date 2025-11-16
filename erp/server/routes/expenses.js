const express = require('express');
const router = express.Router();
const ExcelService = require('../services/ExcelService');
const NotificationService = require('../services/NotificationService');
const { body, query, validationResult } = require('express-validator');

const excelService = new ExcelService(
  process.env.EXCEL_FILE_PATH || './data/mysociety_data.xlsx',
  process.env.BACKUP_DIR || './backups'
);

const notificationService = new NotificationService({
  provider: process.env.WHATSAPP_PROVIDER || 'mock',
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
  twilioWhatsappFrom: process.env.TWILIO_WHATSAPP_FROM,
  whatsappGroupId: process.env.WHATSAPP_GROUP_ID
});

// Create expense
router.post('/',
  [
    body('expense_desc').notEmpty().withMessage('Expense description is required'),
    body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
    body('date').isISO8601().withMessage('Date must be a valid ISO date')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const expense = await excelService.addExpense(req.body, req.user.username);
      
      // Send notification asynchronously (don't block response)
      notificationService.notifyExpense('created', expense, req.user.username)
        .catch(err => console.error('Notification failed:', err));

      res.status(201).json(expense);
    } catch (error) {
      console.error('Error creating expense:', error);
      res.status(500).json({ error: 'Failed to create expense', details: error.message });
    }
  }
);

// Get expenses
router.get('/',
  [
    query('from').optional().isISO8601().withMessage('From date must be valid ISO date'),
    query('to').optional().isISO8601().withMessage('To date must be valid ISO date')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { from, to } = req.query;
      const expenses = await excelService.getExpenses(from, to);
      res.json(expenses);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      res.status(500).json({ error: 'Failed to fetch expenses', details: error.message });
    }
  }
);

// Get expense by ID
router.get('/:id', async (req, res) => {
  try {
    const expense = await excelService.getExpenseById(req.params.id);
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    res.json(expense);
  } catch (error) {
    console.error('Error fetching expense:', error);
    res.status(500).json({ error: 'Failed to fetch expense', details: error.message });
  }
});

// Update expense
router.put('/:id',
  [
    body('amount').optional().isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
    body('date').optional().isISO8601().withMessage('Date must be a valid ISO date')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const expense = await excelService.updateExpense(req.params.id, req.body, req.user.username);
      if (!expense) {
        return res.status(404).json({ error: 'Expense not found' });
      }

      // Send notification
      notificationService.notifyExpense('updated', expense, req.user.username)
        .catch(err => console.error('Notification failed:', err));

      res.json(expense);
    } catch (error) {
      console.error('Error updating expense:', error);
      res.status(500).json({ error: 'Failed to update expense', details: error.message });
    }
  }
);

// Delete expense
router.delete('/:id', async (req, res) => {
  try {
    const expense = await excelService.deleteExpense(req.params.id, req.user.username);
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    // Send notification
    notificationService.notifyExpense('deleted', expense, req.user.username)
      .catch(err => console.error('Notification failed:', err));

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ error: 'Failed to delete expense', details: error.message });
  }
});

module.exports = router;

