import { json } from '@/lib/server/http';
import { storageConfigured } from '@/lib/server/storage';
export const dynamic = 'force-dynamic';
export function GET() { const ready = storageConfigured(); return json({ service: 'dockfold', sharing: ready ? 'configured' : 'unavailable' }, ready ? 200 : 503); }
