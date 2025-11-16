const express = require('express');
const router = express.Router();
const ExcelService = require('../services/ExcelService');
const fs = require('fs').promises;
const path = require('path');

const excelService = new ExcelService(
  process.env.EXCEL_FILE_PATH || './data/mysociety_data.xlsx',
  process.env.BACKUP_DIR || './backups'
);

// Download Excel file
router.get('/file/download', async (req, res) => {
  try {
    const fileBuffer = await excelService.getFileStream();
    const fileName = path.basename(process.env.EXCEL_FILE_PATH || './data/mysociety_data.xlsx');
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(fileBuffer);
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ error: 'Failed to download file', details: error.message });
  }
});

// Create backup
router.post('/backup', async (req, res) => {
  try {
    const backupPath = await excelService.createBackup();
    if (!backupPath) {
      return res.status(404).json({ error: 'No file to backup' });
    }
    res.json({ message: 'Backup created', path: backupPath });
  } catch (error) {
    console.error('Error creating backup:', error);
    res.status(500).json({ error: 'Failed to create backup', details: error.message });
  }
});

// List backups
router.get('/backups', async (req, res) => {
  try {
    const backupDir = process.env.BACKUP_DIR || './backups';
    const files = await fs.readdir(backupDir);
    const backups = files
      .filter(f => f.endsWith('.xlsx'))
      .map(f => ({
        filename: f,
        path: path.join(backupDir, f)
      }))
      .sort()
      .reverse();
    
    res.json(backups);
  } catch (error) {
    console.error('Error listing backups:', error);
    res.status(500).json({ error: 'Failed to list backups', details: error.message });
  }
});

module.exports = router;

