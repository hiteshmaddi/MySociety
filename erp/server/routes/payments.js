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

// Create payment
router.post('/',
  [
    body('villa_no').notEmpty().withMessage('Villa number is required'),
    body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
    body('date').isISO8601().withMessage('Date must be a valid ISO date')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const payment = await excelService.addPayment(req.body, req.user.username);
      
      // Send notification
      notificationService.notifyPayment('created', payment, req.user.username)
        .catch(err => console.error('Notification failed:', err));

      res.status(201).json(payment);
    } catch (error) {
      console.error('Error creating payment:', error);
      res.status(500).json({ error: 'Failed to create payment', details: error.message });
    }
  }
);

// Get payments
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
      const payments = await excelService.getPayments(from, to);
      res.json(payments);
    } catch (error) {
      console.error('Error fetching payments:', error);
      res.status(500).json({ error: 'Failed to fetch payments', details: error.message });
    }
  }
);

// Get payment by ID
router.get('/:id', async (req, res) => {
  try {
    const payment = await excelService.getPaymentById(req.params.id);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    res.json(payment);
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({ error: 'Failed to fetch payment', details: error.message });
  }
});

// Update payment
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
      const payment = await excelService.updatePayment(req.params.id, req.body, req.user.username);
      if (!payment) {
        return res.status(404).json({ error: 'Payment not found' });
      }

      // Send notification
      notificationService.notifyPayment('updated', payment, req.user.username)
        .catch(err => console.error('Notification failed:', err));

      res.json(payment);
    } catch (error) {
      console.error('Error updating payment:', error);
      res.status(500).json({ error: 'Failed to update payment', details: error.message });
    }
  }
);

// Delete payment
router.delete('/:id', async (req, res) => {
  try {
    const payment = await excelService.deletePayment(req.params.id, req.user.username);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Send notification
    notificationService.notifyPayment('deleted', payment, req.user.username)
      .catch(err => console.error('Notification failed:', err));

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting payment:', error);
    res.status(500).json({ error: 'Failed to delete payment', details: error.message });
  }
});

module.exports = router;

