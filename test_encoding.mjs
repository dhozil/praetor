import { toHex, toRlp } from './node_modules/genlayer-js/node_modules/viem/_esm/index.js';

const BITS_IN_TYPE = 3;
const TYPE_SPECIAL = 0, TYPE_PINT = 1, TYPE_NINT = 2, TYPE_STR = 4, TYPE_ARR = 5, TYPE_MAP = 6;
const SPECIAL_NULL = 0, SPECIAL_TRUE = 1<<BITS_IN_TYPE|TYPE_SPECIAL, SPECIAL_FALSE = 2<<BITS_IN_TYPE|TYPE_SPECIAL;

function writeNum(to, d) { if (d===0n) {to.push(0);return;} while(d>0n){let c=Number(d&0x7fn);d>>=7n;if(d>0n)c|=128;to.push(c);} }
function eNumType(to, d, t) { writeNum(to, d << 3n | BigInt(t)); }
function eNum(to, d) { if (d>=0n) eNumType(to,d,TYPE_PINT); else eNumType(to,-d-1n,TYPE_NINT); }
function eImpl(to, d) {
  if (d===null||d===void 0) {to.push(0);return;}
  if (d===true) {to.push(10);return;}
  if (d===false) {to.push(8);return;}
  if (typeof d==='number') {eNum(to,BigInt(d));return;}
  if (typeof d==='bigint') {eNum(to,d);return;}
  if (typeof d==='string') {const s=new TextEncoder().encode(d);eNumType(to,BigInt(s.length),TYPE_STR);for(const c of s)to.push(c);return;}
  if (d instanceof Array) {eNumType(to,BigInt(d.length),TYPE_ARR);for(const c of d)eImpl(to,c);return;}
  if (Object.getPrototypeOf(d)===Object.prototype) {
    const en=Object.entries(d).sort((a,b)=>a[0].localeCompare(b[0]));
    eNumType(to,BigInt(en.length),TYPE_MAP);
    for(const[k,v]of en){const kb=new TextEncoder().encode(k);writeNum(to,BigInt(kb.length));for(const c of kb)to.push(c);eImpl(to,v);}
    return;
  }
  throw Error('unknown');
}
function encode(d) {const a=[];eImpl(a,d);return new Uint8Array(a);}
function serialize(d) {return toRlp(d.map(p=>toHex(p)));}

const amountWei = BigInt(500000000000000000n);
const args = ['Test','Test','0x589C7B1f74f10437A4E3C0F947eeBB2D9EbF3108',['MS1'],['MS1 D'],[amountWei],['Github']];
const serialized = serialize([encode({method:'create_escrow',args}), false]);

const rpcUrl='https://rpc-bradbury.genlayer.com';
const tx={from:'0x589C7B1f74f10437A4E3C0F947eeBB2D9EbF3108',to:'0x4a0B2A2FA38e7F368452E8C8f345b9ADD9CC2b95',data:serialized,value:'0x6f05b59d3b20000'};

const est=await fetch(rpcUrl,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'eth_estimateGas',params:[tx]})}).then(r=>r.json());
console.log('estimateGas:', JSON.stringify(est, null, 2));
