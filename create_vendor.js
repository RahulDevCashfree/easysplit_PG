const fs = require("fs");
const axios = require("axios");

// Load API Keys from JSON
const loadConfig = () => {
  try {
    const data = fs.readFileSync("api_keys.json", "utf8");
    return JSON.parse(data)["Test"]; // Change to ["Prod"] for production
  } catch (error) {
    console.error("Error loading api_keys.json:", error.message);
    process.exit(1);
  }
};

// Set Environment and Config
const environment = "Test"; // Change to "Prod" as needed
const config = loadConfig();

// Construct API Request Config
const baseURL =
  environment === "Prod"
    ? "https://api.cashfree.com/pg"
    : "https://sandbox.cashfree.com/pg";

const headers = {
  "x-client-id": config.clientId, // Fetching dynamically
  "x-client-secret": config.clientSecret, // Fetching dynamically
  "x-api-version": "2023-08-01",
  "Content-Type": "application/json",
};

// Function to generate vendor_id
const generateVendorId = () => `PGVENDOR_${Date.now()}`;

// Function to generate properly formatted cURL command
const generateCurlCommand = (url, method, headers, data = null) => {
  let curlCommand = `curl -X ${method} '${url}' \\\n`;

  // Append headers
  Object.entries(headers).forEach(([key, value]) => {
    curlCommand += `  -H '${key}: ${value}' \\\n`;
  });

  // Append data payload if present
  if (data) {
    const jsonData = JSON.stringify(data).replace(/"/g, '\\"'); // Escape quotes
    curlCommand += `  -d "${jsonData}" \\\n`;
  }

  curlCommand += "  -i -v"; // Append verbose flag for debugging
  return curlCommand;
};

// Create Vendor Function
const createVendor = async () => {
  const url = `${baseURL}/easy-split/vendors`;
  const vendorId = generateVendorId();

  const data = {
    vendor_id: vendorId,
    status: "ACTIVE",
    name: "John Doe",
    email: "johndoe@cashfree.com",
    phone: "9876543210",
    verify_account: true,
    dashboard_access: true,
    schedule_option: 8,
    bank: {
      account_number: "000890289871772",
      account_holder: "John Doe",
      ifsc: "SCBL0036078",
    },
    kyc_details: {
      account_type: "Individual",
      business_type: "Insurance",
      uidai: "655675523712",
      gst: "45XYZLMN2345G3W",
      cin: "L00000Aa0000AaA000000",
      pan: "AZJPG7110R",
      passport_number: "L6892603",
    },
  };

  // Generate and print the cURL request
  const curlRequest = generateCurlCommand(url, "POST", headers, data);
  console.log("\nGenerated cURL Request:\n", curlRequest, "\n");

  try {
    const response = await axios.post(url, data, { headers });
    console.log("Vendor Created Successfully:", response.data);

    // Save vendor details to vendor_details.json
    const vendorRecord = {
      vendor_id: vendorId,
      name: data.name,
      account_number: data.bank.account_number,
      ifsc: data.bank.ifsc,
      remarks: "Success",
    };

    saveVendorDetails(vendorRecord);

    // Fetch the vendor details
    await getVendorDetails(vendorId);
  } catch (error) {
    console.error(
      "Error Creating Vendor:",
      error.response ? error.response.data : error.message
    );
  }
};

// Get Vendor Details Function
const getVendorDetails = async (vendorId) => {
  const url = `${baseURL}/easy-split/vendors/${vendorId}`;

  // Generate and print the cURL command for GET request
  const curlRequest = generateCurlCommand(url, "GET", headers);
  console.log("\nGenerated cURL Request:\n", curlRequest, "\n");

  try {
    const response = await axios.get(url, { headers });
    console.log("Vendor Details:", response.data);
  } catch (error) {
    console.error(
      "Error Fetching Vendor Details:",
      error.response ? error.response.data : error.message
    );
  }
};

// Function to Save Vendor Data to vendor_details.json
const saveVendorDetails = (vendorRecord) => {
  const filePath = "vendor_details.json";

  // Check if the file exists and read its content
  fs.readFile(filePath, "utf8", (err, data) => {
    let vendorDataArray = [];

    if (!err && data) {
      try {
        vendorDataArray = JSON.parse(data); // Parse existing vendor data
      } catch (parseError) {
        console.error("Error parsing existing vendor_details.json:", parseError);
      }
    }

    // Append the new vendor record to the array
    vendorDataArray.push(vendorRecord);

    // Write the updated data back to vendor_details.json
    fs.writeFile(filePath, JSON.stringify(vendorDataArray, null, 2), (writeErr) => {
      if (writeErr) {
        console.error("Error saving vendor data:", writeErr);
      } else {
        console.log("Vendor data saved successfully to vendor_details.json");
      }
    });
  });
};

// Call createVendor function
createVendor();
