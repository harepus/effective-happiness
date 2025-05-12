const API_URL = "http://127.0.0.1:8000";

// Transaction methods
export async function uploadTransactionFile(file) {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch(`${API_URL}/transactions/upload`, {
      method: "POST",
      body: formData,
    });

    return await response.json();
  } catch (error) {
    console.error("Error uploading file:", error);
    return { error: "Failed to upload file" };
  }
}

// Trumf methods
export async function fetchTrumfTransactions(token, limit = 100) {
  try {
    const response = await fetch(
      `${API_URL}/trumf/transactions?limit=${limit}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return await response.json();
  } catch (error) {
    console.error("Error fetching Trumf transactions:", error);
    return { error: "Failed to fetch Trumf data" };
  }
}

export async function fetchTrumfReceipt(token, batchId) {
  try {
    const response = await fetch(`${API_URL}/trumf/receipts/${batchId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    console.log(`Receipt data for batch ${batchId}:`, data);
    return data;
  } catch (error) {
    console.error(`Error fetching Trumf receipt for batch ${batchId}:`, error);
    return { error: "Failed to fetch receipt data: " + error.message };
  }
}

export async function testDirectTrumfAccess(token, batchId) {
  try {
    // Test direct access to Trumf API (bypassing our backend)
    const directResponse = await fetch(
      `https://platform-rest-prod.ngdata.no/trumf/medlemskap/transaksjoner/digitalkvittering/${batchId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      }
    );

    console.log("Direct Trumf API Response Status:", directResponse.status);

    if (directResponse.status === 200) {
      const data = await directResponse.json();
      console.log("Direct Trumf Receipt Data:", data);

      // If you don't see the items array in the console log, log the structure
      console.log("Receipt data structure:", Object.keys(data));

      // Try to find the items - they might be nested in a different property
      let items = [];
      if (data.items) {
        items = data.items;
      } else if (data.receipt && data.receipt.items) {
        items = data.receipt.items;
      } else if (data.kvittering && data.kvittering.varer) {
        // Norwegian API might use different property names
        items = data.kvittering.varer;
      } else if (data.varelinjer || data.varer) {
        // Other possible property names
        items = data.varelinjer || data.varer;
      }

      console.log("Found items:", items);

      return {
        success: true,
        data: data,
        items: items,
      };
    } else {
      console.error("Direct Trumf API Error Status:", directResponse.status);
      return {
        success: false,
        status: directResponse.status,
        statusText: directResponse.statusText,
      };
    }
  } catch (error) {
    console.error("Error testing direct Trumf access:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

export async function fetchTrumfReceiptViaWebAPI(token, batchId) {
  try {
    // Try the web frontend API endpoint
    const response = await fetch(
      `https://www.trumf.no/api/digitalkvittering/${batchId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        credentials: "include", // This might be important for cookies
      }
    );

    console.log("Web API response status:", response.status);

    if (response.status === 200) {
      const data = await response.json();
      return data;
    } else {
      // Try alternative endpoint format
      const altResponse = await fetch(
        `https://www.trumf.no/api/medlem/kvitteringer/${batchId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          credentials: "include",
        }
      );

      if (altResponse.status === 200) {
        return await altResponse.json();
      }

      return { error: `Failed with status: ${response.status}` };
    }
  } catch (error) {
    console.error("Error fetching receipt via web API:", error);
    return { error: error.message };
  }
}

export async function monitorKassalappTrumfRequests() {
  console.log(
    "Please navigate to Kassalapp and open a receipt. This will log API calls to help us understand their approach."
  );

  // Monitor fetch requests
  const originalFetch = window.fetch;
  window.fetch = function (url, options) {
    if (url && (url.includes("trumf") || url.includes("kvittering"))) {
      console.log("KASSALAPP FETCH:", { url, options });
    }
    return originalFetch.apply(this, arguments);
  };

  // Monitor XHR requests
  const originalXHR = window.XMLHttpRequest.prototype.open;
  window.XMLHttpRequest.prototype.open = function () {
    this.addEventListener("load", function () {
      if (
        arguments[1] &&
        (arguments[1].includes("trumf") || arguments[1].includes("kvittering"))
      ) {
        console.log("KASSALAPP XHR:", arguments);
        console.log("Response:", this.responseText);
      }
    });
    return originalXHR.apply(this, arguments);
  };

  console.log(
    "API monitoring active - navigate to a Kassalapp receipt to see the API calls"
  );
}
