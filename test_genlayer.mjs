import { createClient } from './node_modules/genlayer-js/dist/index.js';

const chain = {
  id: 4221, name: 'GenLayer Bradbury',
  nativeCurrency: { name: 'GEN', symbol: 'GEN', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc-bradbury.genlayer.com'] } },
  blockExplorers: { default: { name: 'Explorer', url: 'https://explorer-bradbury.genlayer.com' } },
};

// Create client and override request to use fetch
const client = createClient({ chain });
const origRequest = client.request.bind(client);
client.request = async ({ method, params }) => {
  const rpcUrl = 'https://rpc-bradbury.genlayer.com';
  const body = JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method, params });
  const res = await fetch(rpcUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
  const json = await res.json();
  if (json.error) throw new Error(json.error.message || JSON.stringify(json.error));
  return json.result;
};

try {
  const r1 = await client.readContract({
    address: '0x4a0B2A2FA38e7F368452E8C8f345b9ADD9CC2b95',
    functionName: 'get_escrow_status',
    args: [BigInt(0)]
  });
  console.log('Status(0):', r1);
} catch(e) {
  console.log('Read error:', e.message);
}

// Now try write - we can't send but we can inspect what it produces
// Let's monkey-patch again to capture the encoded data
const methods = [];
client.request = async ({ method, params }) => {
  methods.push({ method, params: JSON.parse(JSON.stringify(params, (k,v) => typeof v === 'bigint' ? v.toString() : v)) });
  const rpcUrl = 'https://rpc-bradbury.genlayer.com';
  const body = JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method, params });
  const res = await fetch(rpcUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
  const json = await res.json();
  if (json.error) throw new Error(json.error.message || JSON.stringify(json.error));
  return json.result;
};

// Monkey-patch writeContract temporarily
const origWrite = client.writeContract;
client.writeContract = async (args) => {
  console.log('writeContract args:', JSON.stringify({
    ...args,
    args: args.args.map(a => typeof a === 'bigint' ? a.toString() : a)
  }));
  const result = await origWrite.call(client, args);
  return result;
};

try {
  const r2 = await client.readContract({
    address: '0x4a0B2A2FA38e7F368452E8C8f345b9ADD9CC2b95',
    functionName: 'get_praetor_score',
    args: ['0x589C7B1f74f10437A4E3C0F947eeBB2D9EbF3108']
  });
  console.log('Score:', r2);
  console.log('Methods called:', methods.map(m => m.method));
} catch(e) {
  console.log('Read error:', e.message);
}
