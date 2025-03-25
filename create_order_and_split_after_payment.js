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
    console.error(`Error loading ${filename}:`, error.message);
    process.exit(1);
  }
};

// Load Vendor ID from `vendor_details.json`
const loadVendorId = () => {
  try {
    const filePath = path.join(__dirname, "vendor_details.json");
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error("Vendor details are missing or not in expected format.");
    }
    return data[0].vendor_id; // Extract the first vendor_id
  } catch (error) {
    console.error("Error loading vendor_details.json:", error.message);
    process.exit(1);
  }
};

// Set environment (Test or Prod)
const environment = "Test"; // Change to "Prod" for live
const config = loadConfig("api_keys.json")[environment];

// Base URLs
const baseURL = environment === "Prod" ? "https://api.cashfree.com/pg" : "https://sandbox.cashfree.com/pg";
const createOrderURL = `${baseURL}/orders`;
const getOrderStatusURL = (orderId) => `${baseURL}/orders/${orderId}`;
const splitAfterPaymentURL = (orderId) => `${baseURL}/easy-split/orders/${orderId}/split`;

// Generate Order Expiry Time (7 days from now)
const getExpiryTime = () => {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 7);
  return expiryDate.toISOString();
};

// Create Order Payload
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
  order_amount: 56785,
  order_currency: "INR",
  order_expiry_time: getExpiryTime(),
  order_note: "Test order",
};

// Create Order Function
const createOrder = async () => {
  try {
    const response = await axios.post(createOrderURL, cashFreeParams, {
      headers: {
        "X-Client-Id": config.clientId,
        "X-Client-Secret": config.clientSecret,
        "x-api-version": "2023-08-01",
        "Content-Type": "application/json",
      },
    });

    console.log("✅ Order Created Successfully:", response.data);

    const orderId = cashFreeParams.order_id;
    const { payment_session_id } = response.data;

    // Save Order & Payment Session Data
    fs.writeFileSync("order_data.json", JSON.stringify({ order_id: orderId, status: "created" }, null, 2));
    fs.writeFileSync("payment_session_data.json", JSON.stringify({ payment_session_id, created_at: new Date().toISOString() }, null, 2));

    console.log("✅ Order and Payment Session ID saved.");

    // Start checking order status
    checkOrderStatus(orderId);

  } catch (error) {
    console.error("❌ Error Creating Order:", error.response?.data || error.message);
  }
};

// Function to Fetch Order Status
const checkOrderStatus = async (orderId) => {
  try {
    const response = await axios.get(getOrderStatusURL(orderId), {
      headers: {
        accept: "application/json",
        "x-api-version": "2023-08-01",
        "x-client-id": config.clientId,
        "x-client-secret": config.clientSecret,
      },
    });

    const status = response.data.order_status;
    console.log(`ℹ️ Order Status: ${status}`);

    if (status === "PAID") {
      console.log("✅ Order is PAID. Waiting 2 min 30 sec before calling Split API...");
      
      let timeLeft = 150; // 2 min 30 sec countdown
      const countdown = setInterval(() => {
        process.stdout.write(`\r⏳ Time remaining to create Split After Payment API: ${timeLeft} sec `);
        timeLeft -= 1;
        if (timeLeft < 0) {
          clearInterval(countdown);
          console.log("\n⏳ Time completed. Calling Split API...");
          triggerSplitAfterPayment(orderId);
        }
      }, 1000); // Update every 1 second

    } else {
      console.log("🔄 Order not PAID yet. Checking again in 15 sec...");
      setTimeout(() => checkOrderStatus(orderId), 15000); // Retry every 15 sec
    }
  } catch (error) {
    console.error("❌ Error fetching order status:", error.response?.data || error.message);
    setTimeout(() => checkOrderStatus(orderId), 15000); // Retry in case of failure
  }
};

// Function to Trigger Split After Payment API
const triggerSplitAfterPayment = async (orderId) => {
  const vendorId = loadVendorId();

  const splitData = {
    split: [
      {
        vendor_id: vendorId,
        amount: 2000,
        tags: {
          product: "My_Product",
          size: "XL",
          Type: "Tshirt",
        },
      },
    ],
    disable_split: true,
  };

  try {
    const response = await axios.post(splitAfterPaymentURL(orderId), splitData, {
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "x-api-version": "2023-08-01",
        "x-client-id": config.clientId,
        "x-client-secret": config.clientSecret,
      },
    });

    console.log("✅ Split After Payment Success:", response.data);

    // Save response to split_data.json
    fs.writeFileSync("split_data.json", JSON.stringify(response.data, null, 2), "utf8");
    console.log("✅ Response saved to split_data.json");

  } catch (error) {
    console.error("❌ Error in Split After Payment API:", error.response?.data || error.message);
  }
};

// Start Order Creation Process
createOrder();
