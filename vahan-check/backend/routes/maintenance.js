// routes/maintenance.js - Maintenance logging (FR-10, FR-11)
const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const db     = require('../utils/db');
const { authenticate, minRole } = require('../middleware/auth');

// GET /api/maintenance/vehicle/:vehicleId
router.get('/vehicle/:vehicleId', authenticate, async (req, res) => {
  try {
    const [logs] = await db.execute(
      `SELECT m.*, u.name AS logged_by_name FROM maintenance_logs m
       LEFT JOIN users u ON m.logged_by=u.id
       WHERE m.vehicle_id=? ORDER BY m.service_date DESC`,
      [req.params.vehicleId]
    );
    res.json({ success: true, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch maintenance logs' });
  }
});

// POST /api/maintenance (FR-10 - log entry with odometer validation)
router.post('/', authenticate, minRole('fleet_manager'), [
  body('vehicle_id').isInt(),
  body('odometer_reading').isInt({ min: 0 }),
  body('service_date').isDate(),
  body('service_type').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  try {
    const { vehicle_id, odometer_reading, service_date, service_type, parts_replaced, total_cost, notes, service_interval_km = 10000 } = req.body;

    // Regressive odometer check (Scenario 6 Negative Path)
    const [lastLog] = await db.execute(
      `SELECT odometer_reading FROM maintenance_logs WHERE vehicle_id=? ORDER BY service_date DESC LIMIT 1`,
      [vehicle_id]
    );
    if (lastLog.length && parseInt(odometer_reading) <= lastLog[0].odometer_reading) {
      return res.status(400).json({
        success: false,
        message: `Odometer reading (${odometer_reading} km) cannot be less than or equal to the previous reading (${lastLog[0].odometer_reading} km). Please verify.`,
      });
    }

    // Calculate next service (FR-11)
    const nextServiceKm   = parseInt(odometer_reading) + parseInt(service_interval_km);
    const nextServiceDate = new Date(service_date);
    nextServiceDate.setMonth(nextServiceDate.getMonth() + 6); // 6-month OR 10,000 km (whichever first)

    const [result] = await db.execute(`
      INSERT INTO maintenance_logs
        (vehicle_id, odometer_reading, service_type, parts_replaced, total_cost, notes, service_date, next_service_km, next_service_date, logged_by)
      VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [vehicle_id, odometer_reading, service_type, parts_replaced||null,
       total_cost||0, notes||null, service_date,
       nextServiceKm, nextServiceDate.toISOString().split('T')[0], req.user.id]
    );

    res.status(201).json({
      success: true,
      message: 'Maintenance log saved successfully',
      data: { id: result.insertId, next_service_km: nextServiceKm, next_service_date: nextServiceDate },
    });
  } catch (err) {
    console.error('Maintenance log error:', err);
    res.status(500).json({ success: false, message: 'Failed to save maintenance log' });
  }
});

// GET /api/maintenance/due - vehicles due for service
router.get('/due', authenticate, async (req, res) => {
  try {
    const [logs] = await db.execute(`
      SELECT m.*, v.reg_number, v.make, v.model
      FROM maintenance_logs m
      JOIN vehicles v ON m.vehicle_id = v.id
      WHERE m.id IN (
        SELECT MAX(id) FROM maintenance_logs GROUP BY vehicle_id
      )
      AND (m.next_service_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY))
      ORDER BY m.next_service_date ASC
    `);
    res.json({ success: true, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch due maintenance' });
  }
});

module.exports = router;