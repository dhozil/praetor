/**
 * GenLayer Bradbury Testnet Configuration
 *
 * Network details: https://docs.genlayer.com/developers/networks
 */

export const GENLAYER_BRADBURY = {
  id: 4221,
  name: "GenLayer Bradbury",
  nativeCurrency: {
    name: "GEN Token",
    symbol: "GEN",
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ["https://rpc-bradbury.genlayer.com"] },
    genLayer: { http: ["https://rpc-bradbury.genlayer.com"] },
    chain: { http: ["https://rpc.testnet-chain.genlayer.com"] },
  },
  blockExplorers: {
    default: { name: "GenLayer Explorer", url: "https://explorer-bradbury.genlayer.com" },
    chain: { name: "GenLayer Chain Explorer", url: "https://explorer.testnet-chain.genlayer.com" },
  },
} as const;

export const GENLAYER_BRADBURY_HEX = "0x107d";

export const ADD_BRADBURY_TO_WALLET = {
  chainId: GENLAYER_BRADBURY_HEX,
  chainName: GENLAYER_BRADBURY.name,
  rpcUrls: GENLAYER_BRADBURY.rpcUrls.default.http,
  nativeCurrency: GENLAYER_BRADBURY.nativeCurrency,
  blockExplorerUrls: [GENLAYER_BRADBURY.blockExplorers.default.url],
};

export const FAUCET_URL = "https://testnet-faucet.genlayer.foundation";

/**
 * Contract addresses on Bradbury testnet
 * Update these after deploying contracts via GenLayer Studio or CLI
 */
export const CONTRACTS = {
  // Deploy PraetorV2 via: genlayer deploy --contract contracts/praetor_v2.py --rpc https://rpc-bradbury.genlayer.com --args 2
  praetor: "0x75E095CC5820e989Ffa3E17bF7cF6db3ea593980" as `0x${string}`,
} as const;
