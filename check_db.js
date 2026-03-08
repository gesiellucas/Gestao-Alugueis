const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.join(process.env.APPDATA || (process.platform === 'darwin' ? process.env.HOME + '/Library/Application Support' : process.env.HOME + '/.config'), 'gc-loca-moto', 'gc-loca-moto.sqlite');
console.log("DB Path checking:", dbPath);
try {
    const db = new Database(dbPath);
    db.exec(`
    CREATE TABLE IF NOT EXISTS roles (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      permissions TEXT NOT NULL,
      created_at  TEXT NOT NULL,
      updated_at  TEXT NOT NULL,
      deleted_at  TEXT
    );

    CREATE TABLE IF NOT EXISTS app_users (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      email       TEXT UNIQUE NOT NULL,
      password    TEXT NOT NULL,
      role_id     TEXT NOT NULL,
      created_at  TEXT NOT NULL,
      updated_at  TEXT NOT NULL,
      deleted_at  TEXT,
      FOREIGN KEY (role_id) REFERENCES roles(id)
    );
  `);
    console.log("Success creating tables manually");
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log("Tables:", tables);
} catch (e) {
    console.error("Error:", e);
}
