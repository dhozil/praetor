/**
 * Deploy PraetorV2 marketplace contract to Bradbury.
 *
 * Usage:
 *   node scripts/deploy.mjs
 *
 * Requires genlayer-js v1.2.0 and a funded account on Bradbury.
 * The private key is read from GENLAYER_PRIVATE_KEY env var (without 0x prefix).
 */

import { createClient, createAccount } from "genlayer-js";
import { testnetBradbury } from "genlayer-js/chains";
import { readFileSync, writeFileSync } from "fs";

const PRIVATE_KEY = process.env.GENLAYER_PRIVATE_KEY;
if (!PRIVATE_KEY) {
  console.error("❌ Set GENLAYER_PRIVATE_KEY env var (64 hex chars, no 0x prefix)");
  process.exit(1);
}

async function main() {
  const account = createAccount(`0x${PRIVATE_KEY}`);
  console.log(`Deploying from: ${account.address}`);

  const client = createClient({
    chain: testnetBradbury,
    account,
  });

  const code = readFileSync("contracts/praetor_v2.py", "utf8");

  console.log("Deploying PraetorV2...");
  const txHash = await client.deployContract({
    code,
    args: [2], // platform_fee_percent = 2%
  });

  console.log(`TX hash: ${txHash}`);

  // Wait for receipt
  let receipt;
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 3000));
    try {
      receipt = await client.waitForTransactionReceipt({ hash: txHash });
      if (receipt) break;
    } catch {
      // not ready yet
    }
  }

  if (!receipt) {
    console.error("❌ Timed out waiting for deployment receipt");
    process.exit(1);
  }

  // The contract address should be in the receipt
  const contractAddress = receipt.contractAddress;
  if (!contractAddress) {
    console.error("❌ No contract address in receipt");
    console.log("Receipt:", JSON.stringify(receipt, null, 2));
    process.exit(1);
  }

  console.log(`✅ Deployed at: ${contractAddress}`);

  // Update the frontend config
  const networkPath = "src/lib/genlayer-network.ts";
  let network = readFileSync(networkPath, "utf8");
  network = network.replace(
    /praetor: "0x[a-fA-F0-9]+"/,
    `praetor: "${contractAddress}"`,
  );
  writeFileSync(networkPath, network);
  console.log(`✅ Updated ${networkPath} with new address`);
}

main().catch((err) => {
  console.error("Deploy failed:", err);
  process.exit(1);
});
