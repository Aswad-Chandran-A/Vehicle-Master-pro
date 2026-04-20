// routes/documents.js - Document Vault (Module 3: FR-3.1 to FR-3.4)
const router  = require('express').Router();
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const db      = require('../utils/db');
const { authenticate, minRole } = require('../middleware/auth');

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = process.env.UPLOAD_DIR || './uploads';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1E6)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

// File validation (FR-3.1)
const fileFilter = (req, file, cb) => {
  const allowed = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file format. Only PDF, PNG, and JPG are supported.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 }, // 5MB
});

// POST /api/documents/upload (FR-3.1, FR-3.2, FR-3.3)
router.post('/upload', authenticate, minRole('fleet_manager'), upload.single('document'), async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

  const { vehicle_id, doc_type } = req.body;
  if (!vehicle_id || !doc_type) {
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ success: false, message: 'vehicle_id and doc_type are required' });
  }

  try {
    // Version control: archive old document (FR-3.3)
    await db.execute(
      `UPDATE compliance_documents SET is_active=0 WHERE vehicle_id=? AND doc_type=? AND is_active=1`,
      [vehicle_id, doc_type]
    );

    const [result] = await db.execute(`
      INSERT INTO compliance_documents (vehicle_id, doc_type, file_name, file_path, file_size, mime_type, uploaded_by)
      VALUES (?,?,?,?,?,?,?)`,
      [vehicle_id, doc_type, req.file.originalname, req.file.filename,
       req.file.size, req.file.mimetype, req.user.id]
    );

    res.json({
      success: true,
      message: 'File Uploaded Successfully',
      data: { id: result.insertId, file_name: req.file.originalname, file_path: req.file.filename, doc_type },
    });
  } catch (err) {
    fs.unlinkSync(req.file.path);
    res.status(500).json({ success: false, message: 'Failed to save document' });
  }
});

// GET /api/documents/vehicle/:vehicleId
router.get('/vehicle/:vehicleId', authenticate, async (req, res) => {
  try {
    const [docs] = await db.execute(
      `SELECT * FROM compliance_documents WHERE vehicle_id=? ORDER BY created_at DESC`,
      [req.params.vehicleId]
    );
    res.json({ success: true, data: docs });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch documents' });
  }
});

// GET /api/documents/view/:filename (FR-3.4 - inline viewer)
router.get('/view/:filename', authenticate, (req, res) => {
  const uploadDir = process.env.UPLOAD_DIR || './uploads';
  const filePath  = path.join(uploadDir, req.params.filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, message: 'File not found' });
  }
  // Serve inline (not as attachment) for in-app viewing
  res.setHeader('Content-Disposition', 'inline');
  res.sendFile(path.resolve(filePath));
});

// DELETE /api/documents/:id
router.delete('/:id', authenticate, minRole('fleet_manager'), async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM compliance_documents WHERE id=?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Document not found' });
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    const filePath  = path.join(uploadDir, rows[0].file_path);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    await db.execute('DELETE FROM compliance_documents WHERE id=?', [req.params.id]);
    res.json({ success: true, message: 'Document deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete document' });
  }
});

// Multer error handler
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: 'File too large! Please upload a document smaller than 5MB.' });
    }
  }
  if (err) return res.status(400).json({ success: false, message: err.message });
  next();
});

module.exports = router;