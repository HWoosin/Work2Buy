import * as SQLite from "expo-sqlite";

let db;

export async function getDatabase() {
  if (db) return db;

  db = await SQLite.openDatabaseAsync("work2buy.db");

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

    CREATE TABLE IF NOT EXISTS app_preferences (
      id INTEGER PRIMARY KEY NOT NULL,
      theme TEXT NOT NULL DEFAULT 'light',
      language TEXT NOT NULL DEFAULT 'ko',
      currency TEXT NOT NULL DEFAULT 'KRW'
    );

    CREATE TABLE IF NOT EXISTS work_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      monthly_salary INTEGER NOT NULL,
      daily_work_hours REAL NOT NULL,
      monthly_work_days INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const columns = await db.getAllAsync("PRAGMA table_info(app_preferences)");

  if (!columns.some((column) => column.name === "currency")) {
    await db.execAsync(`
      ALTER TABLE app_preferences
      ADD COLUMN currency TEXT NOT NULL DEFAULT 'KRW';
    `);
  }

  await db.runAsync(`
    INSERT OR IGNORE INTO user_settings (id)
    VALUES (1);
  `);

  await db.runAsync(`
    INSERT OR IGNORE INTO app_preferences (id)
    VALUES (1);
  `);

  return db;
}

// 이전 근무 조건 불러오기
export async function getUserSettings() {
  const database = await getDatabase();

  return await database.getFirstAsync(
    "SELECT * FROM user_settings WHERE id = 1",
  );
}

// 근무 조건 저장
export async function saveUserSettings(
  monthlySalary,
  dailyWorkHours,
  monthlyWorkDays,
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
    monthlyWorkDays,
  );
}

// 앱 설정 불러오기
export async function getAppPreferences() {
  const database = await getDatabase();

  return await database.getFirstAsync(
    "SELECT * FROM app_preferences WHERE id = 1",
  );
}

// 앱 설정 저장
export async function saveAppPreferences(theme, language, currency) {
  const database = await getDatabase();

  await database.runAsync(
    `UPDATE app_preferences
     SET theme = ?,
         language = ?,
         currency = ?
     WHERE id = 1`,
    theme,
    language,
    currency,
  );
}

// 저장된 근무조건 전체 조회
export async function getWorkProfiles() {
  const database = await getDatabase();

  return await database.getAllAsync(
    `SELECT *
     FROM work_profiles
     ORDER BY created_at DESC, id DESC`
  );
}

// 근무조건 저장
export async function saveWorkProfile(
  name,
  monthlySalary,
  dailyWorkHours,
  monthlyWorkDays
) {
  const database = await getDatabase();

  await database.runAsync(
    `INSERT INTO work_profiles (
      name,
      monthly_salary,
      daily_work_hours,
      monthly_work_days
    ) VALUES (?, ?, ?, ?)`,
    name,
    monthlySalary,
    dailyWorkHours,
    monthlyWorkDays
  );
}

// 근무조건 삭제
export async function deleteWorkProfile(id) {
  const database = await getDatabase();

  await database.runAsync(
    'DELETE FROM work_profiles WHERE id = ?',
    id
  );
}
