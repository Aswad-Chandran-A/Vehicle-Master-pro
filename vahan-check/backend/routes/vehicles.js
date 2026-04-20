// routes/vehicles.js - Vehicle management endpoints
const router   = require('express').Router();
const { body, param, query, validationResult } = require('express-validator');
const db       = require('../utils/db');
const { authenticate, authorize, minRole } = require('../middleware/auth');
const { getVehicleDetails }  = require('../services/vahanApi');
const { enrichVehicle, computeKPIs, expiryForecast } = require('../services/complianceService');

// Regex: Indian registration number (FR-1.2)
const REG_REGEX = /^[A-Z]{2}[0-9]{2}[A-Z]{1,3}[0-9]{4}$/;

// ---- GET /api/vehicles (list with compliance) ----
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, search, page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let sql    = `SELECT v.*, u.name AS manager_name FROM vehicles v LEFT JOIN users u ON v.assigned_manager=u.id WHERE 1=1`;
    const args = [];
    if (search) { sql += ` AND (v.reg_number LIKE ? OR v.make LIKE ? OR v.model LIKE ?)`; args.push(`%${search}%`, `%${search}%`, `%${search}%`); }
    sql += ` ORDER BY v.created_at DESC LIMIT ? OFFSET ?`;
    args.push(parseInt(limit), offset);

    const [vehicles] = await db.execute(sql, args);
    const [countRes] = await db.execute(`SELECT COUNT(*) AS total FROM vehicles WHERE 1=1`);
    const enriched   = vehicles.map(enrichVehicle);

    // Client-side status filter after enrichment
    const filtered = status ? enriched.filter(v => v.compliance.overall === status) : enriched;

    const [allVehicles] = await db.execute('SELECT * FROM vehicles');
    const kpis          = computeKPIs(allVehicles);
    const forecast      = expiryForecast(allVehicles);

    res.json({ success: true, data: filtered, total: countRes[0].total, kpis, forecast, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.error('Vehicles list error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch vehicles' });
  }
});

// ---- GET /api/vehicles/:id ----
router.get('/:id', authenticate, async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT v.*, u.name AS manager_name, u.email AS manager_email
       FROM vehicles v LEFT JOIN users u ON v.assigned_manager=u.id
       WHERE v.id=?`, [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Vehicle not found' });
    const [docs]  = await db.execute(`SELECT * FROM compliance_documents WHERE vehicle_id=? ORDER BY created_at DESC`, [req.params.id]);
    const [maint] = await db.execute(`SELECT * FROM maintenance_logs WHERE vehicle_id=? ORDER BY service_date DESC LIMIT 10`, [req.params.id]);
    res.json({ success: true, data: { ...enrichVehicle(rows[0]), documents: docs, maintenance: maint } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch vehicle' });
  }
});

// ---- POST /api/vehicles (create) ----
router.post('/', authenticate, minRole('fleet_manager'), [
  body('reg_number').matches(REG_REGEX).withMessage('Invalid Indian registration number format (e.g., MH01AB1234)'),
  body('make').notEmpty().trim(),
  body('model').notEmpty().trim(),
  body('ins_expiry').isDate(),
  body('puc_expiry').isDate(),
  body('fit_expiry').isDate(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  try {
    const reg = req.body.reg_number.toUpperCase().replace(/\s+/g, '');

    // Duplicate check (FR-1.5)
    const [existing] = await db.execute('SELECT id FROM vehicles WHERE reg_number=?', [reg]);
    if (existing.length) {
      return res.status(409).json({ success: false, message: 'Vehicle already exists in your fleet. Would you like to view its details instead?', existing_id: existing[0].id });
    }

    const { make, model, fuel_type, vehicle_type, chassis_number, engine_number,
            owner_name, owner_contact, ins_expiry, puc_expiry, fit_expiry,
            rc_expiry, permit_expiry, tax_expiry, assigned_manager } = req.body;

    const [result] = await db.execute(`
      INSERT INTO vehicles
        (reg_number, make, model, fuel_type, vehicle_type, chassis_number, engine_number,
         owner_name, owner_contact, ins_expiry, puc_expiry, fit_expiry, rc_expiry,
         permit_expiry, tax_expiry, assigned_manager, created_by)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [reg, make, model, fuel_type||'Diesel', vehicle_type||'HCV', chassis_number, engine_number,
       owner_name, owner_contact, ins_expiry, puc_expiry, fit_expiry, rc_expiry||null,
       permit_expiry||null, tax_expiry||null, assigned_manager||req.user.id, req.user.id]
    );

    await db.execute(
      `INSERT INTO audit_logs (vehicle_id, user_id, action, field_name, new_value) VALUES (?,?,'CREATE','vehicle',?)`,
      [result.insertId, req.user.id, reg]
    );

    const [newVehicle] = await db.execute('SELECT * FROM vehicles WHERE id=?', [result.insertId]);
    res.status(201).json({ success: true, message: 'Vehicle added successfully', data: enrichVehicle(newVehicle[0]) });
  } catch (err) {
    console.error('Create vehicle error:', err);
    res.status(500).json({ success: false, message: 'Failed to create vehicle' });
  }
});

// ---- PUT /api/vehicles/:id (update with audit - BR-3) ----
router.put('/:id', authenticate, minRole('fleet_manager'), async (req, res) => {
  try {
    const [existing] = await db.execute('SELECT * FROM vehicles WHERE id=?', [req.params.id]);
    if (!existing.length) return res.status(404).json({ success: false, message: 'Vehicle not found' });

    const dateFields = ['ins_expiry', 'puc_expiry', 'fit_expiry', 'rc_expiry', 'permit_expiry', 'tax_expiry'];
    const vehicle    = existing[0];
    const updates    = req.body;
    const auditEntries = [];

    for (const field of dateFields) {
      if (updates[field] && updates[field] !== vehicle[field]?.toISOString?.()?.split('T')[0]) {
        auditEntries.push([vehicle.id, req.user.id, 'DATE_OVERRIDE', field,
          vehicle[field], updates[field], req.ip]);
      }
    }

    const allowed = ['make','model','fuel_type','vehicle_type','chassis_number','engine_number',
                     'owner_name','owner_contact','ins_expiry','puc_expiry','fit_expiry',
                     'rc_expiry','permit_expiry','tax_expiry','assigned_manager','is_blacklisted'];
    const setClauses = [], values = [];
    for (const key of allowed) {
      if (updates[key] !== undefined) { setClauses.push(`${key}=?`); values.push(updates[key]); }
    }
    if (!setClauses.length) return res.status(400).json({ success: false, message: 'No valid fields to update' });

    values.push(req.params.id);
    await db.execute(`UPDATE vehicles SET ${setClauses.join(', ')} WHERE id=?`, values);

    // Audit log all overrides (BR-3)
    for (const entry of auditEntries) {
      await db.execute(
        `INSERT INTO audit_logs (vehicle_id, user_id, action, field_name, old_value, new_value, ip_address) VALUES (?,?,?,?,?,?,?)`,
        entry
      );
    }

    const [updated] = await db.execute('SELECT * FROM vehicles WHERE id=?', [req.params.id]);
    res.json({ success: true, message: 'Vehicle updated successfully', data: enrichVehicle(updated[0]) });
  } catch (err) {
    console.error('Update vehicle error:', err);
    res.status(500).json({ success: false, message: 'Failed to update vehicle' });
  }
});

// ---- DELETE /api/vehicles/:id (admin only) ----
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const [existing] = await db.execute('SELECT id, reg_number FROM vehicles WHERE id=?', [req.params.id]);
    if (!existing.length) return res.status(404).json({ success: false, message: 'Vehicle not found' });
    await db.execute('DELETE FROM vehicles WHERE id=?', [req.params.id]);
    await db.execute(
      `INSERT INTO audit_logs (vehicle_id, user_id, action, field_name, old_value) VALUES (?,?,'DELETE','vehicle',?)`,
      [req.params.id, req.user.id, existing[0].reg_number]
    );
    res.json({ success: true, message: 'Vehicle deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete vehicle' });
  }
});

// ---- POST /api/vehicles/vahan-fetch (Mock Vahan API) ----
router.post('/vahan-fetch', authenticate, async (req, res) => {
  const { reg_number } = req.body;
  const reg = (reg_number || '').toUpperCase().replace(/\s+/g, '');

  if (!REG_REGEX.test(reg)) {
    return res.status(400).json({ success: false, message: 'Invalid Format. Please enter a valid Indian Plate Number (e.g., MH01AB1234).' });
  }

  try {
    const result = await getVehicleDetails(reg);
    if (!result.success) {
      if (result.error === 'NOT_FOUND') {
        return res.status(404).json({ success: false, message: 'Vehicle not found in RTO database. Please check the number or enter manually.' });
      }
      return res.status(422).json({ success: false, message: result.message });
    }

    // Log sync time
    await db.execute('UPDATE vehicles SET last_sync=NOW() WHERE reg_number=?', [reg]).catch(() => {});

    res.json({ success: true, data: result.data });
  } catch (err) {
    await db.execute(
      `INSERT INTO system_logs (log_type, source, message) VALUES ('error', 'vahanApi', ?)`,
      [`API fetch failed for ${reg}: ${err.message}`]
    ).catch(() => {});
    res.status(503).json({ success: false, message: 'Vahan Servers are busy. You can enter details manually or try again in a minute.' });
  }
});

// ---- POST /api/vehicles/bulk-import ----
router.post('/bulk-import', authenticate, minRole('fleet_manager'), async (req, res) => {
  const { vehicles } = req.body;
  if (!Array.isArray(vehicles) || !vehicles.length) {
    return res.status(400).json({ success: false, message: 'No vehicles data provided' });
  }

  const results = { success: [], failed: [] };

  for (const v of vehicles) {
    const reg = (v.reg_number || '').toUpperCase().replace(/\s+/g, '');
    if (!REG_REGEX.test(reg)) {
      results.failed.push({ reg_number: v.reg_number, reason: 'Invalid registration number format' });
      continue;
    }
    try {
      const [existing] = await db.execute('SELECT id FROM vehicles WHERE reg_number=?', [reg]);
      if (existing.length) {
        results.failed.push({ reg_number: reg, reason: 'Duplicate: Vehicle already exists' });
        continue;
      }
      await db.execute(`
        INSERT INTO vehicles (reg_number, make, model, fuel_type, vehicle_type, ins_expiry, puc_expiry, fit_expiry, created_by)
        VALUES (?,?,?,?,?,?,?,?,?)`,
        [reg, v.make||'Unknown', v.model||'Unknown', v.fuel_type||'Diesel', v.vehicle_type||'HCV',
         v.ins_expiry||null, v.puc_expiry||null, v.fit_expiry||null, req.user.id]
      );
      results.success.push({ reg_number: reg });
    } catch (err) {
      results.failed.push({ reg_number: reg, reason: err.message });
    }
  }

  res.json({ success: true, message: `Import complete: ${results.success.length} added, ${results.failed.length} failed`, results });
});

// ---- POST /api/vehicles/:id/send-alert (manual alert - FR-4.4) ----
router.post('/:id/send-alert', authenticate, minRole('fleet_manager'), async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT v.*, u.email AS manager_email, u.phone AS manager_phone
      FROM vehicles v LEFT JOIN users u ON v.assigned_manager=u.id WHERE v.id=?`, [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Vehicle not found' });
    const vehicle = rows[0];
    const { dispatchAlert } = require('../services/notificationService');
    const { daysToExpiry }  = require('../services/complianceService');
    const results = {};
    for (const [field, label] of Object.entries({ ins_expiry:'Insurance', puc_expiry:'PUC', fit_expiry:'Fitness' })) {
      const days = daysToExpiry(vehicle[field]);
      if (days !== null && days <= 30) {
        results[label] = await dispatchAlert(vehicle, label, days, vehicle.manager_email, vehicle.manager_phone);
      }
    }
    res.json({ success: true, message: 'Manual alerts dispatched', results });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to send alerts' });
  }
});

module.exports = router;