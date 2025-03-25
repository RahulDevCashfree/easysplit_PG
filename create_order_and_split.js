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

// Load Vendor Details from JSON
const loadVendorDetails = () => {
  try {
    const data = fs.readFileSync("vendor_details.json", "utf-8");
    const vendorList = JSON.parse(data);

    if (!Array.isArray(vendorList) || vendorList.length === 0) {
      throw new Error("Vendor details are missing or not in expected format.");
    }

    return vendorList;
  } catch (error) {
    console.error("Error reading vendor_details.json:", error.message);
    process.exit(1);
  }
};

// Set Environment and Config
const environment = "Test"; // Change to "Prod" as needed
const config = loadConfig();
const vendorDetails = loadVendorDetails();

// Construct API Request Config
const baseURL =
  environment === "Prod"
    ? "https://api.cashfree.com/pg/orders"
    : "https://sandbox.cashfree.com/pg/orders";

const headers = {
  "x-client-id": config.clientId, // Fetching dynamically
  "x-client-secret": config.clientSecret, // Fetching dynamically
  "x-api-version": "2023-08-01",
  "Content-Type": "application/json",
};

// Generate Order Expiry Time (7 days from now)
const getExpiryTime = () => {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 7); // Add 7 days
  return expiryDate.toISOString(); // Convert to ISO string
};

// Parameters for Creating an Order
const orderAmount = 56785;
const splitAmount = orderAmount * 0.5;

const cashFreeParams = {
  customer_details: {
    customer_id: "7112AAA812234",
    customer_phone: "9908734801",
    customer_email: "john@cashfree.com",
  },
  order_meta: {
    return_url: "https://www.google.com",
    notify_url: "",
    payment_methods: "",
  },
  order_id: `order_${Date.now()}`,
  order_amount: orderAmount,
  order_currency: "INR",
  order_expiry_time: getExpiryTime(), // Use dynamic expiry time
  order_note: "Test order with splits",
  order_splits: vendorDetails.map((vendor) => ({
    vendor_id: vendor.vendor_id, // Pass the vendor_id here
    amount: splitAmount,
  })),
};

console.log("Order Payload:", cashFreeParams);

// Debugging the order_splits data
console.log("Order Splits:", cashFreeParams.order_splits);

// Create Order Function
const createOrder = async () => {
  try {
    const response = await axios.post(baseURL, cashFreeParams, { headers });

    console.log("Order Created Successfully:", response.data);

    const { payment_session_id } = response.data;
    fs.writeFileSync(
      "order_data.json",
      JSON.stringify({ order_id: cashFreeParams.order_id, status: "created" }, null, 2)
    );
    fs.writeFileSync(
      "payment_session_data.json",
      JSON.stringify({ payment_session_id, created_at: new Date().toISOString() }, null, 2)
    );

    console.log("Order and payment session details saved.");
  } catch (error) {
    console.error(
      "Error Creating Order:",
      error.response ? error.response.data : error.message
    );
  }
};

// Call Function
createOrder();
