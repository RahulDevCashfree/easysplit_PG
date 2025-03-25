const axios = require('axios');
const fs = require('fs'); // Import file system module

// Configuration for environments
const environments = {
  test: {
    baseURL: 'https://sandbox.cashfree.com/pg',
    clientId: '11123595750e973ecc95c94ec5532111',
    clientSecret: 'TEST307e06bddd583cc3f86edf02f410fa8a69653d7d',
  },
  production: {
    baseURL: 'https://api.cashfree.com/pg',
    clientId: '145084e43c71b20eab47a2a4b80541',
    clientSecret: '4fd43d83c9728bcd520f6018dea066d68cdc41d',
  },
};

// Select environment: 'test' or 'production'
const selectedEnv = 'test'; // Change to 'production' for production environment
const config = environments[selectedEnv];

// Common headers for APIs
const headers = {
  'x-client-id': config.clientId,
  'x-client-secret': config.clientSecret,
  'x-api-version': '2022-09-01',
  'Content-Type': 'application/json',
};

// Function to read vendor details from a JSON file
const getVendorFromFile = () => {
  try {
    const data = fs.readFileSync('vendor_details.json', 'utf8'); // Read vendor_details.json
    const vendors = JSON.parse(data); // Parse JSON data
    return vendors[0]; // Return the first vendor (you can modify this as needed)
  } catch (error) {
    console.error('Error reading vendor details file:', error.message);
    return null;
  }
};

// Update Vendor Function
const updateVendor = async () => {
  const vendor = getVendorFromFile(); // Fetch vendor details from the file
  if (!vendor) {
    console.error('No vendor details found in the file.');
    return;
  }

  const url = `${config.baseURL}/easy-split/vendors/${vendor.vendor_id}`;

  // Payload for updating vendor
  const data = {
    vendor_id: vendor.vendor_id,
    status: 'BLOCKED', // Update status
    name: 'Customer',
    email: 'johndoe@cashfree.com',
    phone: '9876543210',
    verify_account: true,
    dashboard_access: true,
    schedule_option: 2,
    bank: {
      account_number: '000890289871772',
      account_holder: 'John Doe',
      ifsc: 'SCBL0036078',
    },
    kyc_details: {
      account_type: 'Individual',
      business_type: 'Insurance',
      uidai: '655675523712',
      gst: '45XYZLMN2345G3W',
      cin: 'L00000Aa0000AaA000000',
      pan: 'XYZP4321W',
      passport_number: 'L6892603',
    },
  };

  try {
    const response = await axios.patch(url, data, { headers });
    console.log('Vendor Updated Successfully:', response.data);

    // Automatically fetch the updated vendor details
    await getVendorDetails(vendor.vendor_id);
  } catch (error) {
    console.error(
      'Error Updating Vendor:',
      error.response ? error.response.data : error.message
    );
  }
};

// Get Vendor Details Function
const getVendorDetails = async (vendorId) => {
  const url = `${config.baseURL}/easy-split/vendors/${vendorId}`;
  try {
    const response = await axios.get(url, { headers });
    console.log('Vendor Details:', response.data);
  } catch (error) {
    console.error(
      'Error Fetching Vendor Details:',
      error.response ? error.response.data : error.message
    );
  }
};

// Call updateVendor function
updateVendor();
