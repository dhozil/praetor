import { createClient } from './node_modules/genlayer-js/dist/index.js';

const chain = {
  id: 4221, name: 'GenLayer Bradbury',
  nativeCurrency: { name: 'GEN', symbol: 'GEN', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc-bradbury.genlayer.com'] } },
};

const client = createClient({ chain });

// Capture exactly what data readContract passes to eth_call
const origRequest = client.request.bind(client);
client.request = async ({ method, params }) => {
  console.log('REQ method:', method);
  console.log('REQ params:', JSON.stringify(params, (k,v) => typeof v === 'bigint' ? v.toString() : v).slice(0, 500));
  
  const rpcUrl = 'https://rpc-bradbury.genlayer.com';
  const body = JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method, params });
  const res = await fetch(rpcUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
  const json = await res.json();
  console.log('RESP:', JSON.stringify(json).slice(0, 200));
  if (json.error) throw new Error(json.error.message || JSON.stringify(json.error));
  return json.result;
};

try {
  const r = await client.readContract({
    address: '0x4a0B2A2FA38e7F368452E8C8f345b9ADD9CC2b95',
    functionName: 'get_escrow_status',
    args: [BigInt(0)]
  });
  console.log('RESULT:', r);
} catch(e) {
  console.log('ERROR:', e.message);
}
