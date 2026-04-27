function detectBrand() {
  const possibleSelectors = [
    '[data-testid="brand"]',
    '.brand',
    '.product-brand',
    '[itemprop="brand"]',
    'meta[property="og:brand"]'
  ];

  for (const selector of possibleSelectors) {
    const element = document.querySelector(selector);

    if (!element) continue;

    const value =
      element.getAttribute("content") ||
      element.textContent ||
      "";

    if (value.trim()) {
      return value.trim();
    }
  }

  const amazonStoreLink = Array.from(document.querySelectorAll("a")).find((link) => {
    const text = link.textContent?.trim() || "";
    return /^Visit the .+ Store$/i.test(text);
  });

  if (amazonStoreLink) {
    const match = amazonStoreLink.textContent.trim().match(/^Visit the (.+) Store$/i);

    if (match?.[1]?.trim()) {
      return match[1].trim();
    }
  }

  const metadataSelectors = [
    'meta[name="brand"]',
    'meta[property="product:brand"]'
  ];

  for (const selector of metadataSelectors) {
    const element = document.querySelector(selector);
    const value = element?.getAttribute("content") || "";

    if (value.trim()) {
      return value.trim();
    }
  }

  const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');

  for (const script of jsonLdScripts) {
    try {
      const data = JSON.parse(script.textContent || "");
      const items = Array.isArray(data) ? data : [data];

      for (const item of items) {
        const brand = item?.brand;
        const value =
          typeof brand === "string"
            ? brand
            : brand?.name || "";

        if (value.trim()) {
          return value.trim();
        }
      }
    } catch (error) {
      continue;
    }
  }

  const title = document.title || "";
  return title.split("|")[0].split("-")[0].trim();
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "DETECT_BRAND") {
    sendResponse({ brand: detectBrand() });
  }
});
