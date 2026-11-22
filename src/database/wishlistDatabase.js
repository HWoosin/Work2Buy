
import * as SQLite from 'expo-sqlite';

let db = null;
let initializing = null;

async function getDB() {
  if (db) return db;

  if (!initializing) {
    initializing = (async () => {
      const connection = await SQLite.openDatabaseAsync('work2buy.db');

      await connection.execAsync(`
        CREATE TABLE IF NOT EXISTS wishlist_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          price REAL NOT NULL,
          hold_days INTEGER NOT NULL DEFAULT 7,
          created_at TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending'
        );
      `);

      db = connection;
      return connection;
    })().catch((error) => {
      initializing = null;
      throw error;
    });
  }

  return initializing;
}

export async function initWishlistDatabase() {
  await getDB();
}

export async function getWishlistItems() {
  const database = await getDB();

  return await database.getAllAsync(`
    SELECT *
    FROM wishlist_items
    ORDER BY
      CASE status WHEN 'pending' THEN 0 ELSE 1 END,
      created_at DESC,
      id DESC;
  `);
}

export async function addWishlistItem(name, price, holdDays) {
  const database = await getDB();

  const createdAt = new Date().toISOString();

  const result = await database.runAsync(
    `INSERT INTO wishlist_items
      (name, price, hold_days, created_at, status)
     VALUES (?, ?, ?, ?, 'pending');`,
    [name.trim(), price, holdDays, createdAt]
  );

  return result.lastInsertRowId;
}

export async function updateWishlistStatus(id, status) {
  const database = await getDB();

  await database.runAsync(
    'UPDATE wishlist_items SET status = ? WHERE id = ?;',
    [status, id]
  );
}

export async function deleteWishlistItem(id) {
  const database = await getDB();

  await database.runAsync(
    'DELETE FROM wishlist_items WHERE id = ?;',
    [id]
  );
}
