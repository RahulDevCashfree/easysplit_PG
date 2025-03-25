const fs = require("fs");
const axios = require("axios");
const path = require("path");

// Load API Keys from JSON
const loadConfig = (filename) => {
  try {
    const filePath = path.join(__dirname, filename);
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return data;
  } catch (error) {
    console.error(`❌ Error loading ${filename}:`, error.message);
    process.exit(1);
  }
};

// Load Vendor ID from `vendor_details.json`
const loadVendorId = () => {
  try {
    const filePath = path.join(__dirname, "vendor_details.json");
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error("❌ Vendor details are missing or not in expected format.");
    }
    return data[0].vendor_id; // Extract the first vendor_id
  } catch (error) {
    console.error("❌ Error loading vendor_details.json:", error.message);
    process.exit(1);
  }
};

// Set environment (Test or Prod)
const environment = "Test"; // Change to "Prod" for live
const config = loadConfig("api_keys.json")[environment];

// Base URL
const baseURL = environment === "Prod" ? "https://api.cashfree.com/pg" : "https://sandbox.cashfree.com/pg";

// Load Vendor ID
const vendorId = loadVendorId();

// Construct Vendor Balance API URL
const getVendorBalanceURL = `${baseURL}/easy-split/vendors/${vendorId}/balances`;

// Function to Fetch Vendor Balance
const fetchVendorBalance = async () => {
  try {
    console.log(`ℹ️ Fetching balance details for Vendor ID: ${vendorId}`);

    const response = await axios.get(getVendorBalanceURL, {
      headers: {
        accept: "application/json",
        "x-api-version": "2023-08-01",
        "x-client-id": config.clientId,
        "x-client-secret": config.clientSecret,
      },
    });

    console.log("✅ Vendor Balance Fetched Successfully:", response.data);

    // Save Response to File
    const responseFilePath = path.join(__dirname, "vendor_balance_response.json");
    fs.writeFileSync(responseFilePath, JSON.stringify(response.data, null, 2), "utf8");

    console.log(`✅ Response saved to ${responseFilePath}`);
  } catch (error) {
    console.error("❌ Error Fetching Vendor Balance:", error.response?.data || error.message);
  }
};

// Call Function
fetchVendorBalance();
