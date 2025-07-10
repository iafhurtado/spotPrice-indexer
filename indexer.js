const { ethers } = require("ethers");
const axios = require("axios");
const dotenv = require("dotenv");
const lpManagerAbi = require("./abis/lpmanager-abi.json"); // Import your ABI here
dotenv.config();

// ---- CONFIG ----
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const CHAIN_ID = process.env.CHAIN_ID || "42161";
const TOKEN1_ADDRESS = "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9";
const TOKEN0_ADDRESS = "0xF197FFC28c23E0309B5559e7a166f2c6164C80aA";
const TOKEN0_DECIMALS = 6;
const TOKEN1_DECIMALS = 6;
const AMOUNT_IN_SMALL = BigInt(10 ** TOKEN0_DECIMALS);

const supabase = axios.create({
  baseURL: `${process.env.SUPABASE_URL}/rest/v1`,
  headers: {
    apikey: process.env.SUPABASE_KEY,
    Authorization: `Bearer ${process.env.SUPABASE_KEY}`,
    "Content-Type": "application/json",
    Prefer: "return=minimal"
  }
});

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

async function fetchSpotPrice() {
  const contract = new ethers.Contract(CONTRACT_ADDRESS, lpManagerAbi, provider);
  const spotAmountOut = await contract.fetchSpot(
    TOKEN1_ADDRESS,
    TOKEN0_ADDRESS,
    AMOUNT_IN_SMALL
  );
  // Price = amountOut / 10^TOKEN1_DECIMALS (e.g., 1 MXNb worth of USDT)
  const price = Number(spotAmountOut) / 10 ** TOKEN1_DECIMALS;
  return price;
}

async function main() {
  try {
    const spotPrice = await fetchSpotPrice();
    const payload = [{
      chain_id: CHAIN_ID,
      spot_price: spotPrice,
      timestamp: new Date().toISOString(),
    }];
    console.log("Saving spot price:", payload);

    await supabase.post("/price_history", payload); // Update table name if needed
    console.log("✅ Spot price saved!");
  } catch (err) {
    console.error("❌ Error:", err);
  }
}

main();
