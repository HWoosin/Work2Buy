
import * as SQLite from 'expo-sqlite';

let db;

export async function getDatabase() {
  if (db) return db;

  db = await SQLite.openDatabaseAsync('work2buy.db');

  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS user_settings (
      id INTEGER PRIMARY KEY NOT NULL,
      monthly_salary INTEGER NOT NULL DEFAULT 0,
      daily_work_hours REAL NOT NULL DEFAULT 0,
      monthly_work_days INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS purchase_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_name TEXT NOT NULL,
      price INTEGER NOT NULL,
      required_hours REAL NOT NULL,
      purchase_date TEXT NOT NULL
    );
  `);

  await db.runAsync(`
    INSERT OR IGNORE INTO user_settings (id)
    VALUES (1);
  `);

  return db;
}

export async function getUserSettings() {
  const database = await getDatabase();

  const result = await database.getFirstAsync(
    'SELECT * FROM user_settings WHERE id = 1'
  );

  return result;
}

export async function saveUserSettings(
  monthlySalary,
  dailyWorkHours,
  monthlyWorkDays
) {
  const database = await getDatabase();

  await database.runAsync(
    `UPDATE user_settings
     SET monthly_salary = ?,
         daily_work_hours = ?,
         monthly_work_days = ?
     WHERE id = 1`,
    monthlySalary,
    dailyWorkHours,
    monthlyWorkDays
  );
}

