const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const env = fs.readFileSync('.env.local', 'utf8');
const url = env.split('\n').find(l => l.startsWith('NEXT_PUBLIC_SUPABASE_URL=')).split('=')[1].trim();
const key = env.split('\n').find(l => l.startsWith('SUPABASE_SERVICE_ROLE_KEY=')).split('=')[1].trim();

const sb = createClient(url, key);

async function check() {
    const p1 = sb.from('invoices').select('*').limit(1).then(r => console.log('INVOICES:', Object.keys(r.data[0] || {})));
    const p2 = sb.from('clients').select('*').limit(1).then(r => console.log('CLIENTS:', Object.keys(r.data[0] || {})));
    const p3 = sb.from('users').select('*').limit(1).then(r => console.log('USERS:', Object.keys(r.data[0] || {})));
    await Promise.all([p1, p2, p3]);
}
check();
