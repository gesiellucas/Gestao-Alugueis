
const Database = require('better-sqlite3');
const path = require('path');
const os = require('os');

const defaultDbPath = path.join(
  os.homedir(),
  'AppData', 'Roaming', 'Electron', 'gc-loca-moto.sqlite'
);

const dbPath = process.env.SQLITE_DB_PATH ?? defaultDbPath;
console.log(`Checking database at: ${dbPath}`);

try {
    const db = new Database(dbPath, { readonly: true });
    
    console.log('\n--- Supabase Config ---');
    const config = db.prepare("SELECT * FROM config").all();
    config.forEach(c => {
        if (c.key.includes('KEY')) {
            console.log(`${c.key}: [REDACTED]`);
        } else {
            console.log(`${c.key}: ${c.value}`);
        }
    });

    const tables = [
        'workshops', 'vehicle_statuses', 'vehicle_models', 'customers', 
        'vehicles', 'rentals', 'contracts', 'maintenance_records', 'documents'
    ];

    console.log('\n--- Dirty Records Count ---');
    tables.forEach(table => {
        try {
            const count = db.prepare(`SELECT COUNT(*) as count FROM ${table} WHERE dirty = 1`).get();
            console.log(`${table}: ${count.count}`);
        } catch (e) {
            console.log(`${table}: Table or column missing`);
        }
    });

    console.log('\n--- Sync Metadata ---');
    try {
        const metadata = db.prepare("SELECT * FROM sync_metadata").all();
        metadata.forEach(m => console.log(`${m.table_name}: ${m.last_sync_at}`));
    } catch (e) {
        console.log('Sync metadata table missing');
    }

    db.close();
} catch (err) {
    console.error(`Error opening database: ${err.message}`);
}
