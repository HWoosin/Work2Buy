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

      // 기존 테이블에 구매 당시 기록 컬럼이 없으면 추가
      const columns = await connection.getAllAsync(
        'PRAGMA table_info(wishlist_items);'
      );
      const existing = new Set(columns.map((column) => column.name));

      const migrations = [
        ['purchased_at', 'TEXT'],
        ['snapshot_salary', 'REAL'],
        ['snapshot_daily_hours', 'REAL'],
        ['snapshot_monthly_days', 'REAL'],
        ['snapshot_required_hours', 'REAL'],
      ];

      for (const [name, type] of migrations) {
        if (!existing.has(name)) {
          await connection.execAsync(
            `ALTER TABLE wishlist_items ADD COLUMN ${name} ${type};`
          );
        }
      }

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

// 구매 완료 시점의 근무조건과 노동시간을 함께 저장
export async function updateWishlistStatus(id, status, snapshot = null) {
  const database = await getDB();

  if (status === 'purchased' && snapshot) {
    await database.runAsync(
      `UPDATE wishlist_items
       SET status = ?,
           purchased_at = ?,
           snapshot_salary = ?,
           snapshot_daily_hours = ?,
           snapshot_monthly_days = ?,
           snapshot_required_hours = ?
       WHERE id = ?`,
      [
        status,
        snapshot.purchasedAt,
        snapshot.salary,
        snapshot.dailyHours,
        snapshot.monthlyDays,
        snapshot.requiredHours,
        id,
      ]
    );
  } else {
    await database.runAsync(
      `UPDATE wishlist_items SET status = ? WHERE id = ?`,
      [status, id]
    );
  }
}

export async function deleteWishlistItem(id) {
  const database = await getDB();

  await database.runAsync(
    'DELETE FROM wishlist_items WHERE id = ?;',
    [id]
  );
}
