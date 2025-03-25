const axios = require("axios");
const fs = require("fs");

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

// Load Order ID from order_data.json
const loadOrderId = () => {
  try {
    const orderData = fs.readFileSync("order_data.json", "utf8");
    return JSON.parse(orderData).order_id;
  } catch (error) {
    console.error("Error loading order_data.json:", error.message);
    process.exit(1);
  }
};

// Set Environment and Config
const environment = "Test"; // Change to "Prod" as needed
const config = loadConfig();
const orderId = loadOrderId();

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

// Function to Fetch Order Details
const fetchOrderDetails = async () => {
  const url = `${baseURL}/easy-split/orders/${orderId}`;

  try {
    const response = await axios.get(url, { headers });
    console.log("Order Details:", response.data);
  } catch (error) {
    console.error(
      "Error Fetching Order Details:",
      error.response ? error.response.data : error.message
    );
  }
};

// Call Function
fetchOrderDetails();
