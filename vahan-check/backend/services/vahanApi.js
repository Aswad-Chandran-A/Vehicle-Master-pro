// services/vahanApi.js - Mock Vahan API Integration
// Simulates RTO API responses as per FR-4, FR-5, FR-6

const mockDatabase = {
    'MH01AB1234': {
      reg_number: 'MH01AB1234', make: 'Tata Motors', model: 'Prima 4028.S',
      fuel_type: 'Diesel', vehicle_type: 'HCV',
      chassis_number: 'MAT447121N2A00001', engine_number: 'GNX50001',
      owner_name: 'LogiCorp India', owner_contact: '+919001112221',
      ins_expiry: futureDate(45), puc_expiry: futureDate(10),
      fit_expiry: futureDate(200), rc_expiry: futureDate(1095),
      permit_expiry: futureDate(365), tax_expiry: futureDate(365),
      is_blacklisted: false,
    },
    'DL01GB5678': {
      reg_number: 'DL01GB5678', make: 'Ashok Leyland', model: 'Dost Strong',
      fuel_type: 'Diesel', vehicle_type: 'LCV',
      chassis_number: 'MAT452600N1B00002', engine_number: 'H6CR50002',
      owner_name: 'FastMove Logistics', owner_contact: '+919001112222',
      ins_expiry: futureDate(5), puc_expiry: futureDate(60),
      fit_expiry: futureDate(-10), rc_expiry: futureDate(1095),
      permit_expiry: futureDate(180), tax_expiry: futureDate(180),
      is_blacklisted: false,
    },
    'KA01MJ1234': {
      reg_number: 'KA01MJ1234', make: 'Tata Motors', model: 'Prima 4028.S',
      fuel_type: 'Diesel', vehicle_type: 'HCV',
      chassis_number: 'MAT447121N3C00003', engine_number: 'GNX50003',
      owner_name: 'KarnatakaFleet', owner_contact: '+919001112223',
      ins_expiry: futureDate(90), puc_expiry: futureDate(80),
      fit_expiry: futureDate(300), rc_expiry: futureDate(1095),
      permit_expiry: futureDate(730), tax_expiry: futureDate(730),
      is_blacklisted: false,
    },
    'TN22CD9012': {
      reg_number: 'TN22CD9012', make: 'Mahindra', model: 'Blazo X 35',
      fuel_type: 'Diesel', vehicle_type: 'Trailer',
      chassis_number: 'MAT455300N2D00004', engine_number: 'M2D150004',
      owner_name: 'SunTransport', owner_contact: '+919001112224',
      ins_expiry: futureDate(-5), puc_expiry: futureDate(-2),
      fit_expiry: futureDate(100), rc_expiry: futureDate(730),
      permit_expiry: futureDate(90), tax_expiry: futureDate(90),
      is_blacklisted: false,
    },
    'GJ05EF3456': {
      reg_number: 'GJ05EF3456', make: 'Volvo', model: 'FH16 750',
      fuel_type: 'Diesel', vehicle_type: 'HCV',
      chassis_number: 'YV2RT58B5HA001005', engine_number: 'D16G0005',
      owner_name: 'GujaratCargo', owner_contact: '+919001112225',
      ins_expiry: futureDate(120), puc_expiry: futureDate(25),
      fit_expiry: futureDate(400), rc_expiry: futureDate(1095),
      permit_expiry: futureDate(365), tax_expiry: futureDate(365),
      is_blacklisted: false,
    },
    'HR26BK0001': {
      reg_number: 'HR26BK0001', make: 'BharatBenz', model: '3523R',
      fuel_type: 'Diesel', vehicle_type: 'HCV',
      chassis_number: 'MB4Y16C0049000011', engine_number: 'OM457LA0011',
      owner_name: 'HaryanaTruck', owner_contact: '+919001112226',
      ins_expiry: futureDate(30), puc_expiry: futureDate(30),
      fit_expiry: futureDate(180), rc_expiry: futureDate(1000),
      permit_expiry: futureDate(200), tax_expiry: futureDate(200),
      is_blacklisted: true, // Blacklisted test case - BR-4
    },
  };
  
  function futureDate(daysFromNow) {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    return d.toISOString().split('T')[0];
  }
  
  /**
   * Validate response data from Mock API (FR-6)
   */
  function validateApiResponse(data) {
    const errors = [];
    if (data.fit_expiry && data.ins_expiry) {
      if (new Date(data.fit_expiry) < new Date('2000-01-01')) {
        errors.push('Fitness expiry date is logically invalid');
      }
    }
    if (!data.make || !data.model) errors.push('Missing make or model from API');
    return errors;
  }
  
  /**
   * Simulate API call with delay (FR-4)
   */
  async function getVehicleDetails(regNumber) {
    // Simulate network delay (500ms–2s)
    const delay = Math.floor(Math.random() * 1500) + 500;
    await new Promise(resolve => setTimeout(resolve, delay));
  
    const reg = regNumber.toUpperCase().replace(/\s+/g, '');
    const data = mockDatabase[reg];
  
    if (!data) {
      return { success: false, error: 'NOT_FOUND', message: 'Vehicle not found in RTO database' };
    }
  
    const validationErrors = validateApiResponse(data);
    if (validationErrors.length > 0) {
      return { success: false, error: 'INVALID_DATA', message: validationErrors.join(', ') };
    }
  
    return { success: true, data };
  }
  
  module.exports = { getVehicleDetails };