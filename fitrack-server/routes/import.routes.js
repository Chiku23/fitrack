import express from 'express';
import multer from 'multer';
import { importCsv, importExcel, importPdf, parseUploadedFile, confirmImport } from '../controllers/import.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// Store files in memory as Buffer (no disk writes needed)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowed = ['text/csv', 'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/pdf', 'text/plain'];
    if (allowed.includes(file.mimetype) || file.originalname.match(/\.(csv|xlsx|xls|pdf|txt)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type. Please upload CSV, XLSX, PDF, or TXT.'));
    }
  }
});

router.post('/csv', authenticateToken, upload.single('file'), importCsv);
router.post('/excel', authenticateToken, upload.single('file'), importExcel);
router.post('/pdf', authenticateToken, upload.single('file'), importPdf);

router.post('/parse', authenticateToken, upload.single('file'), parseUploadedFile);
router.post('/confirm', authenticateToken, confirmImport);

export default router;
