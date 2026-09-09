import { getWICMessage } from "./lib/wic-translator";

console.log("\n--- WIC Voice Test ---\n");

console.log("1. Rate Locked:");
console.log(getWICMessage("QUOTE_CREATED"));

console.log("\n2. Slippage Aborted (The Magic):");
console.log(getWICMessage("SLIPPAGE_ABORTED"));

console.log("\n3. Success:");
console.log(getWICMessage("CONVERSION_SUCCESS", { amount: 100, from: "USD", converted: 15000, to: "KES" }));