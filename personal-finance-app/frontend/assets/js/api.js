/**
 * API helper functions for communicating with the backend
 */

// Base API URL - dynamically detect URL or use default
const API_BASE_URL =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:8000"
    : "http://192.168.1.235:8000";

// Default headers
const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json",
};

/**
 * Make an API request with error handling
 *
 * @param {string} endpoint - API endpoint to call
 * @param {Object} options - Request options (method, headers, body)
 * @returns {Promise<Object>} - Response data
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  console.log(`Making API request to: ${url}`, options.method || "GET");

  // Set up default options
  const requestOptions = {
    method: options.method || "GET",
    headers: {
      ...DEFAULT_HEADERS,
      ...options.headers,
    },
    // Only include body for non-GET requests
    ...(options.method !== "GET" && options.body ? { body: options.body } : {}),
    // Mode for CORS
    mode: "cors",
    // Omit credentials for now as it can cause preflight CORS issues
    credentials: "omit",
  };

  try {
    console.log("Request options:", requestOptions);
    const response = await fetch(url, requestOptions);

    // Handle non-2xx responses
    if (!response.ok) {
      let errorMessage = `API Error: ${response.status} ${response.statusText}`;

      // Try to parse error response
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch (e) {
        // Ignore if we can't parse the error message
      }

      throw new Error(errorMessage);
    }

    // Parse JSON response
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`API request to ${endpoint} failed:`, error);
    throw error;
  }
}

/**
 * Upload a file to the API
 *
 * @param {File} file - The file to upload
 * @returns {Promise<Object>} - Response data
 */
async function uploadFile(file) {
  const formData = new FormData();
  formData.append("file", file);

  return apiRequest("/upload", {
    method: "POST",
    headers: {
      // Let the browser set content type with boundary for multipart form data
      Accept: "application/json",
    },
    body: formData,
  });
}

/**
 * Upload a file directly to test endpoint
 *
 * @param {File} file - The file to upload
 * @returns {Promise<Object>} - Response data
 */
async function uploadFileDirect(file) {
  const formData = new FormData();
  formData.append("file", file);

  return apiRequest("/direct-upload", {
    method: "POST",
    headers: {
      // Let the browser set content type with boundary for multipart form data
      Accept: "application/json",
    },
    body: formData,
  });
}

/**
 * Analyze transactions
 *
 * @param {Array} transactions - List of transactions to analyze
 * @returns {Promise<Object>} - Analysis report
 */
async function analyzeTransactions(transactions) {
  return apiRequest("/analyze", {
    method: "POST",
    body: JSON.stringify(transactions),
  });
}

/**
 * Get Trumf transactions
 *
 * @param {string} token - Trumf authorization token
 * @returns {Promise<Object>} - Trumf transactions
 */
async function getTrumfTransactions(token) {
  return apiRequest("/trumf/transactions", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

/**
 * Get detailed Trumf receipt
 *
 * @param {string} batchId - Receipt batch ID
 * @param {string} token - Trumf authorization token
 * @returns {Promise<Object>} - Detailed receipt data
 */
async function getTrumfReceipt(batchId, token) {
  return apiRequest(`/trumf/receipts/${batchId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

/**
 * Debug Trumf API connection
 *
 * @param {string} batchId - Receipt batch ID for testing
 * @param {string} token - Trumf authorization token
 * @returns {Promise<Object>} - Debug information
 */
async function debugTrumfConnection(batchId, token) {
  return apiRequest(`/trumf/direct-debug/${batchId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export {
  apiRequest,
  uploadFile,
  uploadFileDirect,
  analyzeTransactions,
  getTrumfTransactions,
  getTrumfReceipt,
  debugTrumfConnection,
};
