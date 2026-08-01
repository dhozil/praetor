/**
 * GenLayer Studionet Configuration
 */

export const GENLAYER_STUDIO = {
  id: 61999,
  name: "Genlayer Studio Network",
  nativeCurrency: {
    name: "GEN Token",
    symbol: "GEN",
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ["https://studio.genlayer.com/api"] },
  },
  blockExplorers: {
    default: { name: "GenLayer Explorer", url: "https://explorer-studio.genlayer.com" },
  },
} as const;

export const GENLAYER_STUDIO_HEX = "0xf22f";

export const ADD_STUDIO_TO_WALLET = {
  chainId: GENLAYER_STUDIO_HEX,
  chainName: GENLAYER_STUDIO.name,
  rpcUrls: GENLAYER_STUDIO.rpcUrls.default.http,
  nativeCurrency: GENLAYER_STUDIO.nativeCurrency,
  blockExplorerUrls: [GENLAYER_STUDIO.blockExplorers.default.url],
};

export const FAUCET_URL = ""; // Built-in faucet in Studio account selector

/**
 * Contract addresses on Studionet
 * Deploy via: genlayer deploy --contract contracts/praetor.py --rpc https://studio.genlayer.com/api --args 2
 */
export const CONTRACTS = {
  praetor: "0xC8D35b84b4A17E9CEbACaBE0b2c5a489d10CEF7e" as `0x${string}`,
} as const;
