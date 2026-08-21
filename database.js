const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, 'langate.db');

const dbPromise = open({
  filename: dbPath,
  driver: sqlite3.Database,
}).then(async (db) => {
  await db.exec(`
  CREATE TABLE IF NOT EXISTS server_config (
    guild_id TEXT PRIMARY KEY,
    main_language TEXT NOT NULL DEFAULT 'en'
  )
  `);
  return db;
});

async function getMainLanguage(guildId) {
  const db = await dbPromise;
  const row = await db.get('SELECT main_language FROM server_config WHERE guild_id = ?', String(guildId));
  return row ? row.main_language : 'en';
}

async function setMainLanguage(guildId, langCode) {
  const db = await dbPromise;
  await db.run(`
    INSERT INTO server_config (guild_id, main_language)
    VALUES (?, ?)
    ON CONFLICT(guild_id) DO UPDATE SET main_language = excluded.main_language
  `, String(guildId), langCode.toLowerCase().trim());
}

module.exports = { getMainLanguage, setMainLanguage };