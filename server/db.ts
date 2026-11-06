import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import pg from 'pg';

const { Pool } = pg;

let dbInstance: Database | null = null;
let pgPoolInstance: pg.Pool | null = null;
let activeEngine: 'sqlite' | 'supabase' = 'sqlite';

const DB_FILE = path.resolve(process.cwd(), 'data', 'railway.sqlite');

export interface QueryResultRow {
  [key: string]: any;
}

// Convert SQLite '?' parameter placeholders to PostgreSQL '$1, $2, ...'
function convertPlaceholdersToPg(sql: string): string {
  let paramIndex = 1;
  return sql.replace(/\?/g, () => `$${paramIndex++}`);
}

export async function getDb(): Promise<Database | pg.Pool> {
  const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

  if (dbUrl && !pgPoolInstance) {
    try {
      console.log('Connecting to Supabase PostgreSQL database...');
      const pool = new Pool({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000,
      });

      // Test connection
      const testRes = await pool.query('SELECT NOW() AS connected_time;');
      console.log('Successfully connected to Supabase PostgreSQL! Server time:', testRes.rows[0]?.connected_time);
      pgPoolInstance = pool;
      activeEngine = 'supabase';
      return pool;
    } catch (err) {
      console.warn('Failed to connect to Supabase PostgreSQL. Falling back to local SQLite engine.', err);
      pgPoolInstance = null;
      activeEngine = 'sqlite';
    }
  }

  if (dbInstance) return dbInstance;

  const SQL = await initSqlJs();
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  let db: Database;
  if (fs.existsSync(DB_FILE)) {
    try {
      const fileBuffer = fs.readFileSync(DB_FILE);
      db = new SQL.Database(fileBuffer);
      dbInstance = db;
      return db;
    } catch (e) {
      console.warn('Existing DB file corrupted or unreadable, re-initializing...', e);
      db = new SQL.Database();
    }
  } else {
    db = new SQL.Database();
  }

  dbInstance = db;
  await initializeSchemaAndSeed(db);
  saveDb();
  activeEngine = 'sqlite';
  return db;
}

export function saveDb(): void {
  if (activeEngine !== 'sqlite' || !dbInstance) return;
  try {
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DB_FILE, buffer);
  } catch (err) {
    console.error('Failed to persist database to disk:', err);
  }
}

export async function executeQuery(sql: string, params: any[] = []): Promise<QueryResultRow[]> {
  await getDb();

  if (activeEngine === 'supabase' && pgPoolInstance) {
    const pgSql = convertPlaceholdersToPg(sql);
    const result = await pgPoolInstance.query(pgSql, params);
    return result.rows;
  }

  const db = dbInstance!;
  const stmt = db.prepare(sql);
  if (params && params.length > 0) {
    stmt.bind(params);
  }
  const results: QueryResultRow[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

export async function executeGet(sql: string, params: any[] = []): Promise<QueryResultRow | null> {
  const rows = await executeQuery(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

export async function executeRun(sql: string, params: any[] = []): Promise<{ lastInsertId: number; changes: number }> {
  await getDb();

  if (activeEngine === 'supabase' && pgPoolInstance) {
    // For inserts, try to append RETURNING id if not present to capture generated key
    let pgSql = convertPlaceholdersToPg(sql);
    const isInsert = /^\s*INSERT\s+INTO/i.test(pgSql);
    if (isInsert && !/RETURNING/i.test(pgSql)) {
      pgSql += ' RETURNING *';
    }

    const result = await pgPoolInstance.query(pgSql, params);
    const firstRow = result.rows[0];
    let lastInsertId = 0;
    if (firstRow) {
      lastInsertId = Number(
        firstRow.Booking_ID ||
        firstRow.User_ID ||
        firstRow.Train_ID ||
        firstRow.Station_ID ||
        firstRow.Stop_ID ||
        firstRow.Passenger_ID ||
        firstRow.Payment_ID ||
        firstRow.Inventory_ID ||
        firstRow.Fare_ID ||
        firstRow.id ||
        0
      );
    }
    return { lastInsertId, changes: result.rowCount || 0 };
  }

  const db = dbInstance!;
  db.run(sql, params);
  const idResult = db.exec("SELECT last_insert_rowid() AS id, changes() AS changes;");
  const lastInsertId = idResult.length > 0 && idResult[0].values.length > 0 ? (idResult[0].values[0][0] as number) : 0;
  const changes = idResult.length > 0 && idResult[0].values.length > 0 ? (idResult[0].values[0][1] as number) : 0;
  saveDb();
  return { lastInsertId, changes };
}

export async function executeTransaction<T>(work: () => Promise<T>): Promise<T> {
  await getDb();

  if (activeEngine === 'supabase' && pgPoolInstance) {
    const client = await pgPoolInstance.connect();
    try {
      await client.query('BEGIN;');
      const result = await work();
      await client.query('COMMIT;');
      return result;
    } catch (err) {
      await client.query('ROLLBACK;');
      throw err;
    } finally {
      client.release();
    }
  }

  const db = dbInstance!;
  db.run('BEGIN TRANSACTION;');
  try {
    const result = await work();
    db.run('COMMIT;');
    saveDb();
    return result;
  } catch (err) {
    db.run('ROLLBACK;');
    throw err;
  }
}

async function initializeSchemaAndSeed(db: Database) {
  // SQLite Relational Schema mirroring MySQL RailwayDB
  db.run(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS User (
      User_ID INTEGER PRIMARY KEY AUTOINCREMENT,
      Name TEXT NOT NULL,
      Email TEXT NOT NULL UNIQUE,
      Phone TEXT,
      Password TEXT NOT NULL,
      Role TEXT NOT NULL CHECK(Role IN ('Passenger', 'Admin')),
      Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS Station (
      Station_ID INTEGER PRIMARY KEY AUTOINCREMENT,
      Station_Name TEXT NOT NULL,
      Station_Code TEXT NOT NULL UNIQUE,
      City TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS Train (
      Train_ID INTEGER PRIMARY KEY AUTOINCREMENT,
      Train_Number TEXT NOT NULL UNIQUE,
      Train_Name TEXT NOT NULL,
      Train_Type TEXT NOT NULL,
      Total_Seats INTEGER NOT NULL DEFAULT 400,
      Is_Active BOOLEAN NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS Train_Stop (
      Stop_ID INTEGER PRIMARY KEY AUTOINCREMENT,
      Train_ID INTEGER NOT NULL REFERENCES Train(Train_ID) ON DELETE CASCADE,
      Station_ID INTEGER NOT NULL REFERENCES Station(Station_ID) ON DELETE CASCADE,
      Stop_Number INTEGER NOT NULL,
      Arrival_Time TEXT,
      Departure_Time TEXT,
      Distance_From_Source REAL NOT NULL DEFAULT 0.00,
      UNIQUE(Train_ID, Stop_Number)
    );

    CREATE TABLE IF NOT EXISTS Booking (
      Booking_ID INTEGER PRIMARY KEY AUTOINCREMENT,
      PNR TEXT NOT NULL UNIQUE,
      User_ID INTEGER NOT NULL REFERENCES User(User_ID),
      Train_ID INTEGER NOT NULL REFERENCES Train(Train_ID),
      Source_Station_ID INTEGER NOT NULL REFERENCES Station(Station_ID),
      Destination_Station_ID INTEGER NOT NULL REFERENCES Station(Station_ID),
      Journey_Date TEXT NOT NULL,
      Booking_Date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      Total_Amount REAL NOT NULL,
      Status TEXT NOT NULL CHECK(Status IN ('Confirmed', 'Cancelled', 'Pending'))
    );

    CREATE TABLE IF NOT EXISTS Passenger (
      Passenger_ID INTEGER PRIMARY KEY AUTOINCREMENT,
      Passenger_Name TEXT NOT NULL,
      Age INTEGER NOT NULL,
      Gender TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS Booking_Passenger (
      Booking_ID INTEGER NOT NULL REFERENCES Booking(Booking_ID) ON DELETE CASCADE,
      Passenger_ID INTEGER NOT NULL REFERENCES Passenger(Passenger_ID),
      Seat_Number TEXT NOT NULL,
      Coach_Number TEXT NOT NULL,
      Travel_Class TEXT NOT NULL,
      PRIMARY KEY (Booking_ID, Passenger_ID)
    );

    CREATE TABLE IF NOT EXISTS Payment (
      Payment_ID INTEGER PRIMARY KEY AUTOINCREMENT,
      Booking_ID INTEGER NOT NULL UNIQUE REFERENCES Booking(Booking_ID) ON DELETE CASCADE,
      Amount REAL NOT NULL,
      Payment_Method TEXT NOT NULL,
      Payment_Status TEXT NOT NULL,
      Payment_Date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS Seat_Inventory (
      Inventory_ID INTEGER PRIMARY KEY AUTOINCREMENT,
      Train_ID INTEGER NOT NULL REFERENCES Train(Train_ID) ON DELETE CASCADE,
      Journey_Date TEXT NOT NULL,
      Travel_Class TEXT NOT NULL,
      Seat_Number TEXT NOT NULL,
      Coach_Number TEXT NOT NULL,
      Seat_Status TEXT NOT NULL CHECK(Seat_Status IN ('Available', 'Booked')),
      Booking_ID INTEGER REFERENCES Booking(Booking_ID),
      UNIQUE(Train_ID, Journey_Date, Travel_Class, Seat_Number, Coach_Number)
    );

    CREATE TABLE IF NOT EXISTS Fare (
      Fare_ID INTEGER PRIMARY KEY AUTOINCREMENT,
      Train_ID INTEGER NOT NULL REFERENCES Train(Train_ID) ON DELETE CASCADE,
      Source_Station_ID INTEGER NOT NULL REFERENCES Station(Station_ID),
      Destination_Station_ID INTEGER NOT NULL REFERENCES Station(Station_ID),
      Travel_Class TEXT NOT NULL,
      Fare_Amount REAL NOT NULL,
      UNIQUE(Train_ID, Source_Station_ID, Destination_Station_ID, Travel_Class)
    );

    CREATE INDEX IF NOT EXISTS idx_booking_pnr ON Booking(PNR);
    CREATE INDEX IF NOT EXISTS idx_booking_user ON Booking(User_ID);
    CREATE INDEX IF NOT EXISTS idx_stop_train ON Train_Stop(Train_ID, Stop_Number);
    CREATE INDEX IF NOT EXISTS idx_seat_inventory ON Seat_Inventory(Train_ID, Journey_Date, Travel_Class, Seat_Status);

    -- Views
    CREATE VIEW IF NOT EXISTS Booking_Details AS
    SELECT 
        b.Booking_ID,
        b.PNR,
        u.Name AS Passenger_Account_Name,
        u.Email AS Passenger_Email,
        u.Phone AS Passenger_Phone,
        t.Train_Number,
        t.Train_Name,
        t.Train_Type,
        s_src.Station_Name AS Source_Station,
        s_src.Station_Code AS Source_Code,
        s_dest.Station_Name AS Destination_Station,
        s_dest.Station_Code AS Destination_Code,
        b.Journey_Date,
        b.Booking_Date,
        b.Total_Amount,
        b.Status AS Booking_Status,
        p.Payment_Method,
        p.Payment_Status
    FROM Booking b
    JOIN User u ON b.User_ID = u.User_ID
    JOIN Train t ON b.Train_ID = t.Train_ID
    JOIN Station s_src ON b.Source_Station_ID = s_src.Station_ID
    JOIN Station s_dest ON b.Destination_Station_ID = s_dest.Station_ID
    LEFT JOIN Payment p ON b.Booking_ID = p.Booking_ID;

    CREATE VIEW IF NOT EXISTS Train_Route_Details AS
    SELECT 
        t.Train_ID,
        t.Train_Number,
        t.Train_Name,
        t.Train_Type,
        ts.Stop_Number,
        s.Station_Name,
        s.Station_Code,
        s.City,
        ts.Arrival_Time,
        ts.Departure_Time,
        ts.Distance_From_Source
    FROM Train t
    JOIN Train_Stop ts ON t.Train_ID = ts.Train_ID
    JOIN Station s ON ts.Station_ID = s.Station_ID
    ORDER BY t.Train_ID, ts.Stop_Number;

    CREATE VIEW IF NOT EXISTS Passenger_Booking_Details AS
    SELECT 
        b.PNR,
        b.Journey_Date,
        t.Train_Number,
        t.Train_Name,
        p.Passenger_Name,
        p.Age,
        p.Gender,
        bp.Coach_Number,
        bp.Seat_Number,
        bp.Travel_Class,
        b.Status AS Ticket_Status
    FROM Booking_Passenger bp
    JOIN Booking b ON bp.Booking_ID = b.Booking_ID
    JOIN Passenger p ON bp.Passenger_ID = p.Passenger_ID
    JOIN Train t ON b.Train_ID = t.Train_ID;
  `);

  // Check if data already exists
  const countCheck = db.exec('SELECT COUNT(*) AS cnt FROM Station;');
  if (countCheck.length > 0 && Number(countCheck[0].values[0][0]) > 0) {
    return;
  }

  console.log('Seeding relational RailwayDB with Indian Railways synthetic dataset...');
  await seedDatabase(db);
}

async function seedDatabase(db: Database) {
  // 15 Stations
  const stations = [
    { id: 1, name: 'Mumbai Central', code: 'MMCT', city: 'Mumbai' },
    { id: 2, name: 'Pune Junction', code: 'PUNE', city: 'Pune' },
    { id: 3, name: 'Kalyan Junction', code: 'KYN', city: 'Kalyan' },
    { id: 4, name: 'Thane', code: 'TNA', city: 'Thane' },
    { id: 5, name: 'Nagpur Junction', code: 'NGP', city: 'Nagpur' },
    { id: 6, name: 'Nashik Road', code: 'NK', city: 'Nashik' },
    { id: 7, name: 'Ahmedabad Junction', code: 'ADI', city: 'Ahmedabad' },
    { id: 8, name: 'Surat', code: 'ST', city: 'Surat' },
    { id: 9, name: 'Bhopal Junction', code: 'BPL', city: 'Bhopal' },
    { id: 10, name: 'New Delhi', code: 'NDLS', city: 'New Delhi' },
    { id: 11, name: 'Jaipur Junction', code: 'JP', city: 'Jaipur' },
    { id: 12, name: 'Chennai Central', code: 'MAS', city: 'Chennai' },
    { id: 13, name: 'Bengaluru City (KSR)', code: 'SBC', city: 'Bengaluru' },
    { id: 14, name: 'Hyderabad Deccan', code: 'HYB', city: 'Hyderabad' },
    { id: 15, name: 'Howrah Junction', code: 'HWH', city: 'Kolkata' },
    { id: 16, name: 'Vadodara Junction', code: 'BRC', city: 'Vadodara' },
    { id: 17, name: 'Kota Junction', code: 'KOTA', city: 'Kota' },
    { id: 18, name: 'Agra Cantt', code: 'AGC', city: 'Agra' },
  ];

  for (const s of stations) {
    db.run(
      'INSERT INTO Station (Station_ID, Station_Name, Station_Code, City) VALUES (?, ?, ?, ?);',
      [s.id, s.name, s.code, s.city]
    );
  }

  // 10 Trains
  const trains = [
    { id: 1, number: '22221', name: 'Mumbai CSMT - Hazrat Nizamuddin Rajdhani', type: 'Rajdhani', seats: 520 },
    { id: 2, number: '20901', name: 'Mumbai Central - Gandhinagar Vande Bharat', type: 'Vande Bharat', seats: 450 },
    { id: 3, number: '12951', name: 'Mumbai Central - New Delhi Tejas Rajdhani', type: 'Rajdhani', seats: 550 },
    { id: 4, number: '12123', name: 'Deccan Queen Superfast Express', type: 'Superfast', seats: 600 },
    { id: 5, number: '12009', name: 'Mumbai Central - Ahmedabad Shatabdi', type: 'Shatabdi', seats: 480 },
    { id: 6, number: '12261', name: 'Mumbai CSMT - Howrah Duronto Express', type: 'Superfast', seats: 500 },
    { id: 7, number: '12627', name: 'Karnataka Express (SBC - NDLS)', type: 'Superfast', seats: 650 },
    { id: 8, number: '12615', name: 'Grand Trunk Express (MAS - NDLS)', type: 'Superfast', seats: 620 },
    { id: 9, number: '12953', name: 'August Kranti Tejas Rajdhani', type: 'Rajdhani', seats: 530 },
    { id: 10, number: '20903', name: 'Ekta Nagar - Varanasi Mahamana Express', type: 'Express', seats: 580 },
  ];

  for (const t of trains) {
    db.run(
      'INSERT INTO Train (Train_ID, Train_Number, Train_Name, Train_Type, Total_Seats, Is_Active) VALUES (?, ?, ?, ?, ?, 1);',
      [t.id, t.number, t.name, t.type, t.seats]
    );
  }

  // Train Stops (6 to 8 stops per train)
  const trainStops = [
    // Train 1: Mumbai to Delhi Rajdhani (Stops: MMCT -> KYN -> NK -> BPL -> AGC -> NDLS)
    { trainId: 1, seq: 1, stationId: 1, arr: null, dep: '16:00', dist: 0 },
    { trainId: 1, seq: 2, stationId: 3, arr: '16:53', dep: '16:55', dist: 54 },
    { trainId: 1, seq: 3, stationId: 6, arr: '19:18', dep: '19:20', dist: 188 },
    { trainId: 1, seq: 4, stationId: 9, arr: '02:00', dep: '02:05', dist: 835 },
    { trainId: 1, seq: 5, stationId: 18, arr: '07:15', dep: '07:17', dist: 1344 },
    { trainId: 1, seq: 6, stationId: 10, arr: '09:55', dep: null, dist: 1538 },

    // Train 2: Vande Bharat Mumbai Central -> Surat -> Vadodara -> Ahmedabad
    { trainId: 2, seq: 1, stationId: 1, arr: null, dep: '06:00', dist: 0 },
    { trainId: 2, seq: 2, stationId: 8, arr: '08:50', dep: '08:53', dist: 263 },
    { trainId: 2, seq: 3, stationId: 16, arr: '10:05', dep: '10:08', dist: 392 },
    { trainId: 2, seq: 4, stationId: 7, arr: '11:25', dep: null, dist: 491 },

    // Train 3: Tejas Rajdhani (MMCT -> ST -> BRC -> KOTA -> NDLS)
    { trainId: 3, seq: 1, stationId: 1, arr: null, dep: '17:00', dist: 0 },
    { trainId: 3, seq: 2, stationId: 8, arr: '19:35', dep: '19:38', dist: 263 },
    { trainId: 3, seq: 3, stationId: 16, arr: '21:03', dep: '21:06', dist: 392 },
    { trainId: 3, seq: 4, stationId: 17, arr: '03:15', dep: '03:20', dist: 920 },
    { trainId: 3, seq: 5, stationId: 10, arr: '08:32', dep: null, dist: 1386 },

    // Train 4: Deccan Queen (MMCT -> TNA -> KYN -> PUNE)
    { trainId: 4, seq: 1, stationId: 1, arr: null, dep: '17:10', dist: 0 },
    { trainId: 4, seq: 2, stationId: 4, arr: '17:45', dep: '17:47', dist: 34 },
    { trainId: 4, seq: 3, stationId: 3, arr: '18:10', dep: '18:12', dist: 54 },
    { trainId: 4, seq: 4, stationId: 2, arr: '20:25', dep: null, dist: 192 },

    // Train 5: Shatabdi Express (MMCT -> ST -> BRC -> ADI)
    { trainId: 5, seq: 1, stationId: 1, arr: null, dep: '06:20', dist: 0 },
    { trainId: 5, seq: 2, stationId: 8, arr: '09:22', dep: '09:25', dist: 263 },
    { trainId: 5, seq: 3, stationId: 16, arr: '10:48', dep: '10:51', dist: 392 },
    { trainId: 5, seq: 4, stationId: 7, arr: '12:45', dep: null, dist: 491 },

    // Train 6: Duronto Express (MMCT -> KYN -> NK -> NGP -> HWH)
    { trainId: 6, seq: 1, stationId: 1, arr: null, dep: '17:15', dist: 0 },
    { trainId: 6, seq: 2, stationId: 3, arr: '18:08', dep: '18:10', dist: 54 },
    { trainId: 6, seq: 3, stationId: 6, arr: '20:30', dep: '20:33', dist: 188 },
    { trainId: 6, seq: 4, stationId: 5, arr: '04:15', dep: '04:20', dist: 837 },
    { trainId: 6, seq: 5, stationId: 15, arr: '16:15', dep: null, dist: 1968 },

    // Train 7: Karnataka Express (SBC -> HYB -> BPL -> AGC -> NDLS)
    { trainId: 7, seq: 1, stationId: 13, arr: null, dep: '19:20', dist: 0 },
    { trainId: 7, seq: 2, stationId: 14, arr: '08:10', dep: '08:20', dist: 650 },
    { trainId: 7, seq: 3, stationId: 5, arr: '15:20', dep: '15:25', dist: 1150 },
    { trainId: 7, seq: 4, stationId: 9, arr: '21:40', dep: '21:50', dist: 1540 },
    { trainId: 7, seq: 5, stationId: 18, arr: '03:50', dep: '03:55', dist: 2190 },
    { trainId: 7, seq: 6, stationId: 10, arr: '06:40', dep: null, dist: 2400 },

    // Train 8: Grand Trunk Express (MAS -> HYB -> NGP -> BPL -> AGC -> NDLS)
    { trainId: 8, seq: 1, stationId: 12, arr: null, dep: '19:00', dist: 0 },
    { trainId: 8, seq: 2, stationId: 14, arr: '05:30', dep: '05:40', dist: 710 },
    { trainId: 8, seq: 3, stationId: 5, arr: '13:10', dep: '13:15', dist: 1210 },
    { trainId: 8, seq: 4, stationId: 9, arr: '19:25', dep: '19:35', dist: 1600 },
    { trainId: 8, seq: 5, stationId: 18, arr: '02:30', dep: '02:35', dist: 2010 },
    { trainId: 8, seq: 6, stationId: 10, arr: '06:35', dep: null, dist: 2185 },

    // Train 9: August Kranti Tejas (MMCT -> ST -> BRC -> KOTA -> JP -> NDLS)
    { trainId: 9, seq: 1, stationId: 1, arr: null, dep: '17:40', dist: 0 },
    { trainId: 9, seq: 2, stationId: 8, arr: '20:15', dep: '20:18', dist: 263 },
    { trainId: 9, seq: 3, stationId: 16, arr: '21:42', dep: '21:45', dist: 392 },
    { trainId: 9, seq: 4, stationId: 17, arr: '04:00', dep: '04:05', dist: 920 },
    { trainId: 9, seq: 5, stationId: 11, arr: '07:25', dep: '07:35', dist: 1160 },
    { trainId: 9, seq: 6, stationId: 10, arr: '11:00', dep: null, dist: 1468 },

    // Train 10: Mahamana Express (ADI -> ST -> BPL -> NDLS)
    { trainId: 10, seq: 1, stationId: 7, arr: null, dep: '21:15', dist: 0 },
    { trainId: 10, seq: 2, stationId: 16, arr: '22:30', dep: '22:35', dist: 100 },
    { trainId: 10, seq: 3, stationId: 8, arr: '23:55', dep: '23:58', dist: 228 },
    { trainId: 10, seq: 4, stationId: 9, arr: '08:20', dep: '08:30', dist: 840 },
    { trainId: 10, seq: 5, stationId: 10, arr: '16:50', dep: null, dist: 1540 },
  ];

  for (const stop of trainStops) {
    db.run(
      'INSERT INTO Train_Stop (Train_ID, Station_ID, Stop_Number, Arrival_Time, Departure_Time, Distance_From_Source) VALUES (?, ?, ?, ?, ?, ?);',
      [stop.trainId, stop.stationId, stop.seq, stop.arr, stop.dep, stop.dist]
    );
  }

  // 50 Users (1 admin + 49 passengers)
  const defaultPasswordHash = bcrypt.hashSync('password123', 8);
  const adminPasswordHash = bcrypt.hashSync('admin123', 8);

  const users = [
    { id: 1, name: 'Chief Railway Admin', email: 'admin@railconnect.com', phone: '+91 9820011223', role: 'Admin', password: adminPasswordHash },
    { id: 2, name: 'Rahul Sharma', email: 'rahul.sharma@example.com', phone: '+91 9876543210', role: 'Passenger', password: defaultPasswordHash },
    { id: 3, name: 'Priya Patel', email: 'priya.patel@example.com', phone: '+91 9812345678', role: 'Passenger', password: defaultPasswordHash },
    { id: 4, name: 'Amitabh Sen', email: 'amitabh.sen@example.com', phone: '+91 9823456789', role: 'Passenger', password: defaultPasswordHash },
    { id: 5, name: 'Sneha Deshmukh', email: 'sneha.d@example.com', phone: '+91 9834567890', role: 'Passenger', password: defaultPasswordHash },
    { id: 6, name: 'Rohan Verma', email: 'rohan.v@example.com', phone: '+91 9845678901', role: 'Passenger', password: defaultPasswordHash },
    { id: 7, name: 'Ananya Iyer', email: 'ananya.iyer@example.com', phone: '+91 9856789012', role: 'Passenger', password: defaultPasswordHash },
    { id: 8, name: 'Vikram Malhotra', email: 'vikram.m@example.com', phone: '+91 9867890123', role: 'Passenger', password: defaultPasswordHash },
    { id: 9, name: 'Deepika Nair', email: 'deepika.n@example.com', phone: '+91 9878901234', role: 'Passenger', password: defaultPasswordHash },
    { id: 10, name: 'Kunal Kapoor', email: 'kunal.k@example.com', phone: '+91 9889012345', role: 'Passenger', password: defaultPasswordHash },
  ];

  // Generate users 11 to 50
  const firstNames = ['Arjun', 'Meera', 'Aditya', 'Pooja', 'Siddharth', 'Neha', 'Gaurav', 'Kavita', 'Manish', 'Shreya', 'Rajesh', 'Sunita', 'Naveen', 'Swati', 'Alok', 'Divya', 'Suresh', 'Bhavna', 'Harish', 'Anjali'];
  const lastNames = ['Gupta', 'Singh', 'Chopra', 'Reddy', 'Mehta', 'Kulkarni', 'Joshi', 'Bose', 'Rao', 'Bhatia', 'Tripathi', 'Nambiar', 'Das', 'Saxena', 'Goyal', 'Mishra', 'Pandey', 'Narang', 'Aggarwal', 'Dutta'];

  for (let i = 11; i <= 50; i++) {
    const fn = firstNames[(i * 3) % firstNames.length];
    const ln = lastNames[(i * 7) % lastNames.length];
    users.push({
      id: i,
      name: `${fn} ${ln}`,
      email: `${fn.toLowerCase()}.${ln.toLowerCase()}${i}@example.com`,
      phone: `+91 98${(10000000 + i * 1793).toString().substring(0, 8)}`,
      role: 'Passenger',
      password: defaultPasswordHash,
    });
  }

  for (const u of users) {
    db.run(
      'INSERT INTO User (User_ID, Name, Email, Phone, Password, Role) VALUES (?, ?, ?, ?, ?, ?);',
      [u.id, u.name, u.email, u.phone, u.password, u.role]
    );
  }

  // Fares (Class based rate matrix for train routes)
  const fareRates = [
    // Rajdhani / Tejas classes: 1A, 2A, 3A
    { trainId: 1, src: 1, dest: 10, class: '1A', amount: 4850.00 },
    { trainId: 1, src: 1, dest: 10, class: '2A', amount: 2850.00 },
    { trainId: 1, src: 1, dest: 10, class: '3A', amount: 1980.00 },
    { trainId: 1, src: 1, dest: 9, class: '2A', amount: 1850.00 },
    { trainId: 1, src: 1, dest: 9, class: '3A', amount: 1250.00 },

    // Vande Bharat: EC, CC
    { trainId: 2, src: 1, dest: 7, class: 'EC', amount: 2460.00 },
    { trainId: 2, src: 1, dest: 7, class: 'CC', amount: 1385.00 },
    { trainId: 2, src: 1, dest: 8, class: 'EC', amount: 1650.00 },
    { trainId: 2, src: 1, dest: 8, class: 'CC', amount: 920.00 },

    // Tejas Rajdhani
    { trainId: 3, src: 1, dest: 10, class: '1A', amount: 5100.00 },
    { trainId: 3, src: 1, dest: 10, class: '2A', amount: 3050.00 },
    { trainId: 3, src: 1, dest: 10, class: '3A', amount: 2150.00 },

    // Deccan Queen: CC, 2S
    { trainId: 4, src: 1, dest: 2, class: 'CC', amount: 390.00 },
    { trainId: 4, src: 1, dest: 2, class: '2S', amount: 110.00 },

    // Shatabdi: EC, CC
    { trainId: 5, src: 1, dest: 7, class: 'EC', amount: 2325.00 },
    { trainId: 5, src: 1, dest: 7, class: 'CC', amount: 1160.00 },

    // Duronto: 2A, 3A, SL
    { trainId: 6, src: 1, dest: 15, class: '2A', amount: 3600.00 },
    { trainId: 6, src: 1, dest: 15, class: '3A', amount: 2450.00 },
    { trainId: 6, src: 1, dest: 15, class: 'SL', amount: 890.00 },

    // Karnataka Express: 2A, 3A, SL
    { trainId: 7, src: 13, dest: 10, class: '2A', amount: 3350.00 },
    { trainId: 7, src: 13, dest: 10, class: '3A', amount: 2280.00 },
    { trainId: 7, src: 13, dest: 10, class: 'SL', amount: 840.00 },

    // Grand Trunk Express: 2A, 3A, SL
    { trainId: 8, src: 12, dest: 10, class: '2A', amount: 3100.00 },
    { trainId: 8, src: 12, dest: 10, class: '3A', amount: 2150.00 },
    { trainId: 8, src: 12, dest: 10, class: 'SL', amount: 790.00 },

    // August Kranti: 1A, 2A, 3A
    { trainId: 9, src: 1, dest: 10, class: '1A', amount: 4900.00 },
    { trainId: 9, src: 1, dest: 10, class: '2A', amount: 2900.00 },
    { trainId: 9, src: 1, dest: 10, class: '3A', amount: 2050.00 },
    { trainId: 9, src: 1, dest: 11, class: '2A', amount: 2400.00 },
    { trainId: 9, src: 1, dest: 11, class: '3A', amount: 1650.00 },

    // Mahamana: 1A, 2A, 3A, SL
    { trainId: 10, src: 7, dest: 10, class: '2A', amount: 2250.00 },
    { trainId: 10, src: 7, dest: 10, class: '3A', amount: 1580.00 },
    { trainId: 10, src: 7, dest: 10, class: 'SL', amount: 590.00 },
  ];

  for (const f of fareRates) {
    db.run(
      'INSERT INTO Fare (Train_ID, Source_Station_ID, Destination_Station_ID, Travel_Class, Fare_Amount) VALUES (?, ?, ?, ?, ?);',
      [f.trainId, f.src, f.dest, f.class, f.amount]
    );
  }

  // 150 Passengers & 100 Bookings with Payments and Seat Allocation
  console.log('Generating 100 bookings and 150 passenger allocations...');
  const journeyDates = ['2026-11-06', '2026-11-07', '2026-11-08', '2026-11-10', '2026-11-12', '2026-11-15', '2026-11-18', '2026-11-20', '2026-11-25', '2026-12-01'];
  const paymentMethods = ['UPI', 'NetBanking', 'CreditCard', 'DebitCard'];
  const coachesByClass: Record<string, string[]> = {
    '1A': ['H1'],
    '2A': ['A1', 'A2'],
    '3A': ['B1', 'B2', 'B3'],
    'SL': ['S1', 'S2', 'S3', 'S4'],
    'CC': ['C1', 'C2', 'C3'],
    'EC': ['E1'],
    '2S': ['D1', 'D2']
  };

  // Pre-seed 100 bookings
  let currentPassengerId = 1;
  for (let b = 1; b <= 100; b++) {
    const userId = 2 + (b % 48); // Users 2 to 50
    const trainIndex = b % trains.length;
    const train = trains[trainIndex];
    const date = journeyDates[b % journeyDates.length];
    const pnr = `842-${(1000000 + b * 7919).toString().substring(0, 7)}`;
    const status = b % 15 === 0 ? 'Cancelled' : 'Confirmed';

    // Get source and destination for this train
    const stops = trainStops.filter(ts => ts.trainId === train.id).sort((x, y) => x.seq - y.seq);
    const src = stops[0].stationId;
    const dest = stops[stops.length - 1].stationId;

    // Pick travel class
    let tClass = '3A';
    if (train.type === 'Vande Bharat') tClass = b % 3 === 0 ? 'EC' : 'CC';
    else if (train.type === 'Shatabdi') tClass = 'CC';
    else if (train.type === 'Superfast' && b % 2 === 0) tClass = 'SL';
    else if (train.type === 'Rajdhani') tClass = b % 4 === 0 ? '1A' : b % 4 === 1 ? '2A' : '3A';

    // Fare query or estimate
    const fareRow = fareRates.find(f => f.trainId === train.id && f.class === tClass) || { amount: 1250.00 };
    const numPassengers = (b % 5 === 0) ? 2 : (b % 17 === 0) ? 3 : 1;
    const totalAmount = fareRow.amount * numPassengers;

    db.run(
      'INSERT INTO Booking (Booking_ID, PNR, User_ID, Train_ID, Source_Station_ID, Destination_Station_ID, Journey_Date, Total_Amount, Status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);',
      [b, pnr, userId, train.id, src, dest, date, totalAmount, status]
    );

    // Create Payment
    const method = paymentMethods[b % paymentMethods.length];
    const payStatus = status === 'Cancelled' ? 'Refunded' : 'Success';
    db.run(
      'INSERT INTO Payment (Payment_ID, Booking_ID, Amount, Payment_Method, Payment_Status) VALUES (?, ?, ?, ?, ?);',
      [b, b, totalAmount, method, payStatus]
    );

    // Create Passengers and attach
    const availableCoaches = coachesByClass[tClass] || ['B1'];
    for (let p = 0; p < numPassengers; p++) {
      const pId = currentPassengerId++;
      const pName = `Passenger ${pId} (${users[userId - 1]?.name.split(' ')[0] || 'Traveler'})`;
      const age = 18 + ((pId * 7) % 55);
      const gender = pId % 3 === 0 ? 'Female' : 'Male';

      db.run(
        'INSERT INTO Passenger (Passenger_ID, Passenger_Name, Age, Gender) VALUES (?, ?, ?, ?);',
        [pId, pName, age, gender]
      );

      const coach = availableCoaches[p % availableCoaches.length];
      const seat = ((b * 3 + p * 2) % 64 + 1).toString();

      db.run(
        'INSERT INTO Booking_Passenger (Booking_ID, Passenger_ID, Seat_Number, Coach_Number, Travel_Class) VALUES (?, ?, ?, ?, ?);',
        [b, pId, seat, coach, tClass]
      );

      // Add to Seat_Inventory
      const seatStatus = status === 'Cancelled' ? 'Available' : 'Booked';
      const bookingRef = status === 'Cancelled' ? null : b;
      try {
        db.run(
          'INSERT INTO Seat_Inventory (Train_ID, Journey_Date, Travel_Class, Seat_Number, Coach_Number, Seat_Status, Booking_ID) VALUES (?, ?, ?, ?, ?, ?, ?);',
          [train.id, date, tClass, seat, coach, seatStatus, bookingRef]
        );
      } catch {
        // ignore duplicate slot collision if any
      }
    }
  }

  // Pre-seed general available seats in Seat_Inventory for upcoming dates so train search shows real available seats
  console.log('Pre-seeding available seat inventory slots...');
  for (const t of trains) {
    const classes = t.type === 'Vande Bharat' ? ['EC', 'CC'] : t.type === 'Shatabdi' ? ['EC', 'CC'] : ['1A', '2A', '3A', 'SL'];
    for (const d of journeyDates) {
      for (const c of classes) {
        const coaches = coachesByClass[c] || ['B1'];
        for (const coach of coaches) {
          for (let sNum = 1; sNum <= 24; sNum++) {
            const seat = sNum.toString();
            try {
              db.run(
                'INSERT OR IGNORE INTO Seat_Inventory (Train_ID, Journey_Date, Travel_Class, Seat_Number, Coach_Number, Seat_Status, Booking_ID) VALUES (?, ?, ?, ?, ?, "Available", NULL);',
                [t.id, d, c, seat, coach]
              );
            } catch {}
          }
        }
      }
    }
  }

  console.log('Database seeding complete: 15+ stations, 10 trains, 50 users, 100 bookings, 150+ passengers.');
}
