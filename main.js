const { processScript } = require("./parser");

try {
  const script = `
    x = 10;
    y = sma();
    z = ema();
  `;
  const output = processScript(script);
  console.log("✅ Generated JS:");
  console.log(output);

  console.log("✅ This will throw an error JS:");
  const script2 = `
    x = 10;
    let y = sma();
    let z = ema();
  `;
  processScript(script2);
} catch (err) {
  console.error("❌ Error:", err.message);
}
