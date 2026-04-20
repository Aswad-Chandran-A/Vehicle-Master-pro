// services/cronService.js - Daily compliance refresh at midnight IST (FR-2.3, FR-8)
const cron               = require('node-cron');
const db                 = require('../utils/db');
const { daysToExpiry }   = require('./complianceService');
const { dispatchAlert }  = require('./notificationService');

const ALERT_THRESHOLDS = [30, 15, 7, 1]; // T-minus intervals (FR-8)

const DOC_MAP = {
  ins_expiry:    'Insurance',
  puc_expiry:    'PUC',
  fit_expiry:    'Fitness',
  permit_expiry: 'Permit',
  tax_expiry:    'Tax',
};

async function runDailyComplianceCheck() {
  console.log('🕛 [CRON] Running daily compliance check...');
  try {
    // Get all vehicles with manager contact info
    const [vehicles] = await db.execute(`
      SELECT v.*, u.email AS manager_email, u.phone AS manager_phone
      FROM vehicles v
      LEFT JOIN users u ON v.assigned_manager = u.id
    `);

    let alertsSent = 0;

    for (const vehicle of vehicles) {
      for (const [field, label] of Object.entries(DOC_MAP)) {
        const days = daysToExpiry(vehicle[field]);
        if (days === null) continue;

        for (const threshold of ALERT_THRESHOLDS) {
          if (days === threshold) {
            // Check if alert already sent today for this threshold (FR-8 dedup)
            const [existing] = await db.execute(
              `SELECT id FROM notification_logs
               WHERE vehicle_id=? AND doc_type=? AND days_before=? AND DATE(created_at)=CURDATE()`,
              [vehicle.id, label, threshold]
            );
            if (existing.length > 0) continue;

            await dispatchAlert(vehicle, label, days, vehicle.manager_email, vehicle.manager_phone);
            alertsSent++;
          }
        }

        // Escalation: Red for > 48 hours without action (FR-4.3)
        if (days < 0) {
          const hoursExpired = Math.abs(days) * 24;
          if (hoursExpired >= 48) {
            const [admins] = await db.execute(`SELECT email FROM users WHERE role='admin'`);
            for (const admin of admins) {
              const [existing] = await db.execute(
                `SELECT id FROM notification_logs
                 WHERE vehicle_id=? AND doc_type=? AND channel='email' AND recipient=? AND DATE(created_at)=CURDATE()`,
                [vehicle.id, `${label}_ESCALATION`, admin.email]
              );
              if (existing.length === 0) {
                const { logNotification } = require('./notificationService');
                await logNotification(vehicle.id, `${label}_ESCALATION`, 'email', admin.email,
                  `ESCALATION: ${label} for ${vehicle.reg_number} has been expired for ${Math.abs(days)} days`,
                  'sent', days);
                console.log(`🔴 [ESCALATION] ${vehicle.reg_number} ${label} → Admin ${admin.email}`);
              }
            }
          }
        }
      }
    }

    console.log(`✅ [CRON] Daily check complete. Alerts sent: ${alertsSent}`);
  } catch (err) {
    console.error('❌ [CRON] Error during compliance check:', err.message);
    try {
      await db.execute(
        `INSERT INTO system_logs (log_type, source, message, stack_trace) VALUES ('error', 'cronService', ?, ?)`,
        [err.message, err.stack]
      );
    } catch (_) {}
  }
}

function startCronJobs() {
  // Every day at 00:00 IST (Scenario 1 Logic Path)
  cron.schedule('0 0 * * *', runDailyComplianceCheck, { timezone: 'Asia/Kolkata' });
  console.log('⏰ Cron job scheduled: Daily compliance check at midnight IST');
}

module.exports = { startCronJobs, runDailyComplianceCheck };