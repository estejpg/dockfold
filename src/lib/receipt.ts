export type Receipt = { id: string; deletionKey: string };
const keyFor = (id: string) => `dockfold:receipt:${id}`;
export function saveReceipt(receipt: Receipt) {
  try { localStorage.setItem(keyFor(receipt.id), receipt.deletionKey); }
  catch { throw new Error('Allow storage for this site before sharing, so your deletion key can be saved safely.'); }
}
export function readReceiptKey(id: string) {
  try { return localStorage.getItem(keyFor(id)) ?? ''; } catch { return ''; }
}
export function forgetReceipt(id: string) { try { localStorage.removeItem(keyFor(id)); } catch { /* storage may be unavailable */ } }
export function receiptURL(receipt: Receipt) { return `${location.origin}/manage/${receipt.id}#key=${receipt.deletionKey}`; }
