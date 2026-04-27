const brandElement = document.getElementById("brand");
const statusElement = document.getElementById("status");
const messageElement = document.getElementById("message");

function normalizeBrand(name) {

  return name

    .toLowerCase()

    .replace(/[’']/g, "")

    .replace(/[^\w\s]/g, "")

    .replace(/\s+/g, " ")

    .trim();

}

async function loadBrands() {
  const response = await fetch(chrome.runtime.getURL("data/brands.json"));
  return response.json();
}

function hasValidBrandData(data) {
  return Array.isArray(data?.crueltyFree) && Array.isArray(data?.notCrueltyFree);
}

function findBrandStatus(brand, data) {
  const normalizedBrand = normalizeBrand(brand);

  const crueltyFreeMatch = data.crueltyFree.find(
    (item) => normalizeBrand(item) === normalizedBrand
  );

  if (crueltyFreeMatch) {
    return {
      status: "Cruelty-Free",
      className: "cruelty-free",
      message: "This brand is listed as cruelty-free in the local database."
    };
  }

  const notCrueltyFreeMatch = data.notCrueltyFree.find(
    (item) => normalizeBrand(item) === normalizedBrand
  );

  if (notCrueltyFreeMatch) {
    return {
      status: "Not Cruelty-Free",
      className: "not-cruelty-free",
      message: "This brand is listed as not cruelty-free in the local database."
    };
  }

  return {
    status: "Unknown",
    className: "unknown",
    message: "This brand is not in the local database yet."
  };
}

async function getCurrentTabBrand() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab?.id) {
    return "";
  }

  const response = await chrome.tabs.sendMessage(tab.id, {
    type: "DETECT_BRAND"
  });

  return response?.brand || "";
}

async function init() {
  try {
    const brand = await getCurrentTabBrand();
    console.log("Detected brand:", brand);

    if (!brand) {
      brandElement.textContent = "Not detected";
      statusElement.textContent = "Unknown";
      statusElement.className = "status unknown";
      messageElement.textContent = "Could not detect a brand on this page.";
      return;
    }

    const brandsData = await loadBrands();

    if (!hasValidBrandData(brandsData)) {
      brandElement.textContent = brand;
      statusElement.textContent = "Unknown";
      statusElement.className = "status unknown";
      messageElement.textContent = "Brand data is unavailable or invalid. Please reload the extension data.";
      return;
    }

    const result = findBrandStatus(brand, brandsData);

    brandElement.textContent = brand;
    statusElement.textContent = result.status;
    statusElement.className = `status ${result.className}`;
    messageElement.textContent = result.message;
  } catch (error) {
    brandElement.textContent = "Not detected";
    statusElement.textContent = "Unknown";
    statusElement.className = "status unknown";
    messageElement.textContent = "Open a product page, then try again.";
  }
}

init();
