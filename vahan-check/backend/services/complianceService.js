// services/complianceService.js - Core compliance logic (FR-2.1, FR-2.2, BR-2, BR-4)

const DOC_FIELDS = ['ins_expiry', 'puc_expiry', 'fit_expiry', 'rc_expiry', 'permit_expiry', 'tax_expiry'];

/**
 * Calculates days to expiry from today (IST)
 */
function daysToExpiry(expiryDateStr) {
  if (!expiryDateStr) return null;
  const now    = new Date();
  const expiry = new Date(expiryDateStr);
  const diff   = Math.floor((expiry - now) / (1000 * 60 * 60 * 24));
  return diff;
}

/**
 * Returns status for a single document (FR-2.2, BR-2)
 * Red:    <= 0  (expired)
 * Yellow: 1–15  (expiring soon) OR within 48hrs counts as yellow even if technically valid
 * Green:  > 15
 */
function getDocStatus(days) {
  if (days === null || days === undefined) return 'unknown';
  if (days <= 0)  return 'red';
  if (days <= 1)  return 'yellow'; // BR-2: 48-hour grace period
  if (days <= 15) return 'yellow';
  return 'green';
}

/**
 * Computes overall vehicle compliance status (minimum-state logic from Scenario 2 Logic Path)
 * If ANY doc is red  → vehicle = red
 * If ANY doc is yellow → vehicle = yellow
 * All green → vehicle = green
 * Blacklisted → always flashing red (BR-4)
 */
function getVehicleCompliance(vehicle) {
  if (vehicle.is_blacklisted) {
    return { overall: 'blacklisted', docs: {}, daysMap: {} };
  }

  const docs    = {};
  const daysMap = {};
  let   overall = 'green';

  for (const field of DOC_FIELDS) {
    const days    = daysToExpiry(vehicle[field]);
    const status  = getDocStatus(days);
    const docName = field.replace('_expiry', '').toUpperCase();
    docs[docName]    = status;
    daysMap[docName] = days;

    if (status === 'red')    overall = 'red';
    else if (status === 'yellow' && overall !== 'red') overall = 'yellow';
  }

  return { overall, docs, daysMap };
}

/**
 * Enriches a vehicle row with compliance metadata
 */
function enrichVehicle(vehicle) {
  const compliance = getVehicleCompliance(vehicle);
  return { ...vehicle, compliance };
}

/**
 * Dashboard KPIs (Section 7.1)
 */
function computeKPIs(vehicles) {
  const total   = vehicles.length;
  let green     = 0, yellow = 0, red = 0, blacklisted = 0;

  for (const v of vehicles) {
    const { overall } = getVehicleCompliance(v);
    if (overall === 'green')       green++;
    else if (overall === 'yellow') yellow++;
    else if (overall === 'red')    red++;
    else if (overall === 'blacklisted') { blacklisted++; red++; }
  }

  const compliancePct = total > 0 ? Math.round((green / total) * 100) : 0;

  return {
    total, green, yellow, red, blacklisted,
    compliance_pct: compliancePct,
  };
}

/**
 * 30-day expiry forecast (Section 7.2)
 */
function expiryForecast(vehicles) {
  const weeks = { week1: 0, week2: 0, week3: 0, week4: 0 };

  for (const v of vehicles) {
    for (const field of DOC_FIELDS) {
      const days = daysToExpiry(v[field]);
      if (days === null) continue;
      if (days >= 0 && days <= 7)   weeks.week1++;
      else if (days <= 14)          weeks.week2++;
      else if (days <= 21)          weeks.week3++;
      else if (days <= 30)          weeks.week4++;
    }
  }

  return weeks;
}

module.exports = {
  daysToExpiry,
  getDocStatus,
  getVehicleCompliance,
  enrichVehicle,
  computeKPIs,
  expiryForecast,
  DOC_FIELDS,
};