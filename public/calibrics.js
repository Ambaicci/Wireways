/**
 * Wireways Calibrics Widget v1.0
 * Usage:
 *   <script src="https://your-wireways-domain.com/calibrics.js" data-api="https://your-wireways-domain.com/api/calibrics"></script>
 *   <span class="wireways-price" data-base="245" data-currency="ETB">245 ETB</span>
 */
(function () {
  "use strict";

  // 1. Find our own script tag to read the API URL
  var script = document.currentScript;
  var apiUrl = (script && script.getAttribute("data-api")) || "";

  if (!apiUrl) {
    console.warn("[Wireways Calibrics] Missing data-api attribute on script tag.");
    return;
  }

  // 2. Detect visitor's local currency from browser settings
  var visitorCurrency = "USD"; // Fallback
  try {
    visitorCurrency = new Intl.NumberFormat(navigator.language, {
      style: "currency",
      currency: "USD",
    }).resolvedOptions().currency;
  } catch (e) {
    // Silent fallback to USD
  }

  // 3. Currency symbol helper
  var symbols = { USD: "$", EUR: "\u20AC", GBP: "\u00A3", JPY: "\u00A5", CNY: "\u00A5", KES: "KSh ", ETB: "Br " };
  function getSymbol(code) {
    return symbols[code] || code + " ";
  }

  // 4. Find all tagged price elements on the page
  var priceElements = document.querySelectorAll(".wireways-price");

  priceElements.forEach(function (el) {
    var baseAmount = parseFloat(el.getAttribute("data-base"));
    var baseCurrency = (el.getAttribute("data-currency") || "USD").toUpperCase();

    // Skip if base currency already matches visitor's currency
    if (baseCurrency === visitorCurrency) return;

    if (isNaN(baseAmount)) return;

    // 5. Call the live Calibrics API
    fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: baseAmount,
        baseCurrency: baseCurrency,
        targetCurrency: visitorCurrency,
      }),
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data.success) {
          // 6. Replace the price on screen
          var symbol = getSymbol(data.calibrated.currency);
          el.textContent = symbol + data.calibrated.amount.toLocaleString();
          el.title = "Calibrated from " + baseAmount + " " + baseCurrency + " by Wireways Calibrics";
          el.setAttribute("data-calibrated", "true");
        }
      })
      .catch(function (err) {
        console.warn("[Wireways Calibrics] Failed to calibrate:", err);
      });
  });
})();