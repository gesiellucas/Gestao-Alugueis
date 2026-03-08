const Database = require('better-sqlite3');
const path = require('path');
const os = require('os');

// Path to the SQLite database
const dbPath = path.join(os.homedir(), 'AppData', 'Roaming', 'gc-loca-moto', 'gc-loca-moto.sqlite');

try {
    console.log(`[SQLite] Conectando ao banco em: ${dbPath}`);
    const db = new Database(dbPath);

    // Checking current columns
    const columns = db.prepare('PRAGMA table_info(vehicles)').all();
    const hasBrand = columns.some(c => c.name === 'brand');
    const hasModel = columns.some(c => c.name === 'model');

    if (hasBrand) {
        db.exec('ALTER TABLE vehicles DROP COLUMN brand;');
        console.log('[SQLite] Coluna "brand" removida com sucesso de vehicles.');
    } else {
        console.log('[SQLite] A coluna "brand" já não existe mais na tabela vehicles.');
    }

    if (hasModel) {
        db.exec('ALTER TABLE vehicles DROP COLUMN model;');
        console.log('[SQLite] Coluna "model" removida com sucesso de vehicles.');
    } else {
        console.log('[SQLite] A coluna "model" já não existe mais na tabela vehicles.');
    }

    db.close();
    console.log('[SQLite] Operação finalizada.');

} catch (error) {
    console.error('[SQLite] Erro ao alterar tabela. Detalhes:', error.message);
    console.log('---');
    console.log('NOTA: Caso o SQLite da máquina não suporte o comando DROP COLUMN (versões muito antigas), a tabela vehicles precisaria ser recriada sem essas colunas.');
}

// Comandos equivalentes pro Supabase (Painel):
console.log('');
console.log('====== COMANDOS PARA EXECUTAR NO SUPABASE (SQL EDITOR) ======');
console.log(`
-- Remove a coluna model se existir
ALTER TABLE vehicles DROP COLUMN IF EXISTS model;

-- Remove a coluna brand se existir
ALTER TABLE vehicles DROP COLUMN IF EXISTS brand;
`);
console.log('===============================================================');
