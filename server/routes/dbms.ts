import { Router, Request, Response } from 'express';
import { executeQuery, getDb } from '../db.ts';
import fs from 'fs';
import path from 'path';

export const dbmsRouter = Router();

// 18 Curated Academic DBMS Queries with live execution
const ACADEMIC_QUERIES = [
  {
    id: 1,
    title: 'Search Trains Between Two Stations with Route Sequence Validation',
    concept: 'INNER JOIN, WHERE, Composite Filter, Distance Math',
    description: 'Ensures the source stop sequence number is strictly less than destination stop number, preventing invalid reverse routes.',
    sql: `SELECT 
    t.Train_Number,
    t.Train_Name,
    t.Train_Type,
    ts_src.Departure_Time AS Departure,
    ts_dest.Arrival_Time AS Arrival,
    (ts_dest.Distance_From_Source - ts_src.Distance_From_Source) AS Distance_Km
FROM Train t
INNER JOIN Train_Stop ts_src ON t.Train_ID = ts_src.Train_ID
INNER JOIN Train_Stop ts_dest ON t.Train_ID = ts_dest.Train_ID
WHERE ts_src.Station_ID = 1 AND ts_dest.Station_ID = 10 
  AND ts_src.Stop_Number < ts_dest.Stop_Number
ORDER BY ts_src.Departure_Time ASC;`,
  },
  {
    id: 2,
    title: 'Calculate Revenue and Booking Counts by Train',
    concept: 'GROUP BY, Aggregate Functions (COUNT, SUM, AVG)',
    description: 'Demonstrates aggregation across relational joins to compute total earnings and average ticket value per train.',
    sql: `SELECT 
    t.Train_Number,
    t.Train_Name,
    t.Train_Type,
    COUNT(b.Booking_ID) AS Total_Bookings,
    COALESCE(SUM(b.Total_Amount), 0.00) AS Total_Revenue,
    ROUND(AVG(b.Total_Amount), 2) AS Average_Ticket_Fare
FROM Train t
LEFT JOIN Booking b ON t.Train_ID = b.Train_ID AND b.Status = 'Confirmed'
GROUP BY t.Train_ID, t.Train_Number, t.Train_Name, t.Train_Type
ORDER BY Total_Revenue DESC;`,
  },
  {
    id: 3,
    title: 'Filter High-Volume Trains using HAVING Clause',
    concept: 'HAVING, Aggregate Filter, GROUP BY',
    description: 'Uses HAVING to filter aggregated groups having 5 or more confirmed reservations.',
    sql: `SELECT 
    t.Train_Number,
    t.Train_Name,
    COUNT(b.Booking_ID) AS Confirmed_Reservations,
    SUM(b.Total_Amount) AS Total_Earnings
FROM Train t
INNER JOIN Booking b ON t.Train_ID = b.Train_ID
WHERE b.Status = 'Confirmed'
GROUP BY t.Train_ID, t.Train_Number, t.Train_Name
HAVING COUNT(b.Booking_ID) >= 5
ORDER BY Confirmed_Reservations DESC;`,
  },
  {
    id: 4,
    title: 'Find Passengers and Seat Allocations for a Particular PNR',
    concept: '3-Table INNER JOIN, Parameterized WHERE',
    description: 'Retrieves passenger names, demographic data, and coach/seat allocations linked through the associative entity Booking_Passenger.',
    sql: `SELECT 
    b.PNR,
    p.Passenger_Name,
    p.Age,
    p.Gender,
    bp.Coach_Number,
    bp.Seat_Number,
    bp.Travel_Class,
    b.Status AS Booking_Status
FROM Booking b
INNER JOIN Booking_Passenger bp ON b.Booking_ID = bp.Booking_ID
INNER JOIN Passenger p ON bp.Passenger_ID = p.Passenger_ID
WHERE b.PNR = '842-1007919';`,
  },
  {
    id: 5,
    title: 'System-wide Reservation Aggregation Metrics',
    concept: 'Multi-Aggregate Functions (COUNT, SUM, AVG, MIN, MAX)',
    description: 'Calculates the entire system reservation volume, confirmed total revenue, mean ticket price, and minimum/maximum transaction amounts.',
    sql: `SELECT 
    COUNT(Booking_ID) AS Total_Transactions,
    SUM(CASE WHEN Status = 'Confirmed' THEN Total_Amount ELSE 0 END) AS Total_Confirmed_Revenue,
    SUM(CASE WHEN Status = 'Cancelled' THEN Total_Amount ELSE 0 END) AS Total_Refunded_Amount,
    ROUND(AVG(Total_Amount), 2) AS Mean_Fare,
    MIN(Total_Amount) AS Lowest_Fare_Booked,
    MAX(Total_Amount) AS Highest_Fare_Booked
FROM Booking;`,
  },
  {
    id: 6,
    title: 'Find Users Who Have Never Booked a Ticket',
    concept: 'Subquery with NOT IN (Anti-Join Pattern)',
    description: 'Identifies registered passenger accounts with zero booking records using a correlated/subquery NOT IN clause.',
    sql: `SELECT 
    u.User_ID,
    u.Name,
    u.Email,
    u.Phone,
    u.Created_At
FROM User u
WHERE u.User_ID NOT IN (
    SELECT DISTINCT User_ID FROM Booking
)
AND u.Role = 'Passenger'
LIMIT 10;`,
  },
  {
    id: 7,
    title: 'Querying from Database View: Booking_Details',
    concept: 'Database View (Abstraction & Encapsulation)',
    description: 'Executes a query directly against the pre-compiled Booking_Details relational view without manually writing 5-table joins.',
    sql: `SELECT 
    PNR,
    Passenger_Account_Name,
    Train_Name,
    Source_Station,
    Destination_Station,
    Journey_Date,
    Total_Amount,
    Booking_Status,
    Payment_Method
FROM Booking_Details
WHERE Booking_Status = 'Confirmed'
LIMIT 10;`,
  },
  {
    id: 8,
    title: 'Most Popular Travel Routes by Reservation Volume',
    concept: 'Multi-column GROUP BY, Composite Foreign Key Joins',
    description: 'Aggregates booking records by origin and destination stations to discover the highest-demand railway corridors in India.',
    sql: `SELECT 
    s_from.Station_Name AS Origin_Station,
    s_to.Station_Name AS Destination_Station,
    COUNT(b.Booking_ID) AS Trips_Booked,
    SUM(b.Total_Amount) AS Cumulative_Revenue
FROM Booking b
INNER JOIN Station s_from ON b.Source_Station_ID = s_from.Station_ID
INNER JOIN Station s_to ON b.Destination_Station_ID = s_to.Station_ID
WHERE b.Status = 'Confirmed'
GROUP BY b.Source_Station_ID, b.Destination_Station_ID, s_from.Station_Name, s_to.Station_Name
ORDER BY Trips_Booked DESC
LIMIT 5;`,
  },
  {
    id: 9,
    title: 'Seat Inventory Availability by Travel Class and Coach',
    concept: 'Conditional CASE Aggregation, Inventory Management',
    description: 'Checks real-time seat status counts for a specified train and journey date across coaches.',
    sql: `SELECT 
    si.Travel_Class,
    si.Coach_Number,
    COUNT(si.Inventory_ID) AS Total_Seats,
    SUM(CASE WHEN si.Seat_Status = 'Available' THEN 1 ELSE 0 END) AS Seats_Available,
    SUM(CASE WHEN si.Seat_Status = 'Booked' THEN 1 ELSE 0 END) AS Seats_Booked
FROM Seat_Inventory si
WHERE si.Train_ID = 1 AND si.Journey_Date = '2026-11-15'
GROUP BY si.Travel_Class, si.Coach_Number
ORDER BY si.Travel_Class, si.Coach_Number;`,
  },
  {
    id: 10,
    title: 'Passenger Demographics and Age Bracket Distribution',
    concept: 'Statistical CASE Bucketing, Aggregate Profiling',
    description: 'Profiles passenger demographics including gender distribution, mean age, and breakdown into Children, Adults, and Senior Citizens.',
    sql: `SELECT 
    Gender,
    COUNT(Passenger_ID) AS Total_Passengers,
    ROUND(AVG(Age), 1) AS Average_Age,
    MIN(Age) AS Min_Age,
    MAX(Age) AS Max_Age,
    SUM(CASE WHEN Age < 18 THEN 1 ELSE 0 END) AS Children_Under_18,
    SUM(CASE WHEN Age BETWEEN 18 AND 59 THEN 1 ELSE 0 END) AS Adults_18_59,
    SUM(CASE WHEN Age >= 60 THEN 1 ELSE 0 END) AS Senior_Citizens
FROM Passenger
GROUP BY Gender;`,
  },
  {
    id: 11,
    title: 'Find Longest Train Routes with Subquery Filter',
    concept: 'Correlated Subquery, Mathematical Scalar Calculation',
    description: 'Finds express trains operating across extensive routes with high stop counts and cumulative track distances.',
    sql: `SELECT 
    t.Train_Number,
    t.Train_Name,
    t.Train_Type,
    (SELECT COUNT(*) FROM Train_Stop ts WHERE ts.Train_ID = t.Train_ID) AS Total_Stops,
    (SELECT MAX(Distance_From_Source) FROM Train_Stop ts WHERE ts.Train_ID = t.Train_ID) AS Total_Route_Km
FROM Train t
WHERE (SELECT COUNT(*) FROM Train_Stop ts WHERE ts.Train_ID = t.Train_ID) >= 5
ORDER BY Total_Route_Km DESC;`,
  },
  {
    id: 12,
    title: 'Station Utilization Analysis (LEFT OUTER JOIN)',
    concept: 'LEFT OUTER JOIN (Includes stations with zero bookings)',
    description: 'Ranks all railway stations based on departure frequency, demonstrating outer join behavior for unbooked stations.',
    sql: `SELECT 
    s.Station_Code,
    s.Station_Name,
    s.City,
    COUNT(b.Booking_ID) AS Total_Origin_Departures
FROM Station s
LEFT JOIN Booking b ON s.Station_ID = b.Source_Station_ID
GROUP BY s.Station_ID, s.Station_Code, s.Station_Name, s.City
ORDER BY Total_Origin_Departures DESC;`,
  },
  {
    id: 13,
    title: 'Class-wise Fare Variance Analysis (Subquery Benchmark)',
    concept: 'Correlated Scalar Subquery, Variance Calculation',
    description: 'Compares each specific train fare against the benchmark average fare for that travel class.',
    sql: `SELECT 
    t.Train_Name,
    f.Travel_Class,
    f.Fare_Amount,
    ROUND((SELECT AVG(Fare_Amount) FROM Fare f2 WHERE f2.Travel_Class = f.Travel_Class), 2) AS Class_Average,
    ROUND(f.Fare_Amount - (SELECT AVG(Fare_Amount) FROM Fare f2 WHERE f2.Travel_Class = f.Travel_Class), 2) AS Difference
FROM Fare f
JOIN Train t ON f.Train_ID = t.Train_ID
LIMIT 12;`,
  },
  {
    id: 14,
    title: 'Payment Method Breakdown and Success Rates',
    concept: 'Payment Analysis, GROUP BY, Aggregate Ratios',
    description: 'Analyzes digital transaction volume across payment methods (UPI, NetBanking, Cards).',
    sql: `SELECT 
    Payment_Method,
    COUNT(Payment_ID) AS Transactions_Count,
    SUM(Amount) AS Total_Processed_Volume,
    ROUND(AVG(Amount), 2) AS Average_Transaction_Size
FROM Payment
WHERE Payment_Status = 'Success'
GROUP BY Payment_Method
ORDER BY Total_Processed_Volume DESC;`,
  },
  {
    id: 15,
    title: 'Cancelled Bookings and Refund Status Tracking',
    concept: 'Status Filter, Financial Audit Joins',
    description: 'Retrieves all cancelled tickets along with refund records and customer details for audit purposes.',
    sql: `SELECT 
    b.PNR,
    u.Name AS Customer,
    t.Train_Name,
    b.Journey_Date,
    b.Total_Amount AS Original_Fare,
    p.Payment_Method,
    p.Payment_Status AS Current_Payment_Status
FROM Booking b
JOIN User u ON b.User_ID = u.User_ID
JOIN Train t ON b.Train_ID = t.Train_ID
LEFT JOIN Payment p ON b.Booking_ID = p.Booking_ID
WHERE b.Status = 'Cancelled'
LIMIT 10;`,
  },
];

// GET list of 15+ curated queries with instant live execution results
dbmsRouter.get('/dbms/queries', async (_req: Request, res: Response): Promise<void> => {
  try {
    const executedQueries = [];
    for (const q of ACADEMIC_QUERIES) {
      const startTime = Date.now();
      let results: any[] = [];
      let executionTimeMs = 0;
      let error = null;

      try {
        results = await executeQuery(q.sql);
        executionTimeMs = Date.now() - startTime;
      } catch (err: any) {
        error = err.message || 'Execution error';
      }

      executedQueries.push({
        ...q,
        executionTimeMs,
        rowCount: results.length,
        results: results.slice(0, 15), // return top 15 rows for display
        columns: results.length > 0 ? Object.keys(results[0]) : [],
        error,
      });
    }

    res.json({ queries: executedQueries });
  } catch (err) {
    console.error('Error executing DBMS queries:', err);
    res.status(500).json({ error: 'Failed to execute DBMS queries.' });
  }
});

// POST /api/dbms/execute - Interactive SQL Console
dbmsRouter.post('/dbms/execute', async (req: Request, res: Response): Promise<void> => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== 'string' || !query.trim()) {
      res.status(400).json({ error: 'SQL query text is required.' });
      return;
    }

    const trimmed = query.trim();
    // Safety check: block harmful OS injection; allow SELECT, INSERT, UPDATE, DELETE, PRAGMA, EXPLAIN, SHOW
    const isDangerous = /ATTACH\s+DATABASE|DETACH\s+DATABASE/i.test(trimmed);
    if (isDangerous) {
      res.status(400).json({ error: 'Administrative file operations are restricted for database integrity.' });
      return;
    }

    const startTime = Date.now();
    const rows = await executeQuery(trimmed);
    const executionTimeMs = Date.now() - startTime;

    res.json({
      success: true,
      executionTimeMs,
      rowCount: rows.length,
      columns: rows.length > 0 ? Object.keys(rows[0]) : [],
      rows: rows.slice(0, 100), // safety limit 100 rows
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      error: err.message || 'SQL execution failed.',
    });
  }
});

// GET /api/dbms/schema - Database Schema Metadata Inspector
dbmsRouter.get('/dbms/schema', async (_req: Request, res: Response): Promise<void> => {
  try {
    const tablesList = await executeQuery(`
      SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;
    `);

    const viewsList = await executeQuery(`
      SELECT name, sql FROM sqlite_master WHERE type='view' ORDER BY name;
    `);

    const schemaDetails = [];
    for (const t of tablesList) {
      const tableName = t.name;
      const countRow = await executeQuery(`SELECT COUNT(*) AS total FROM "${tableName}";`);
      const rowCount = countRow[0]?.total || 0;

      const columns = await executeQuery(`PRAGMA table_info("${tableName}");`);
      const foreignKeys = await executeQuery(`PRAGMA foreign_key_list("${tableName}");`);

      schemaDetails.push({
        tableName,
        rowCount,
        columns: columns.map((c: any) => ({
          cid: c.cid,
          name: c.name,
          type: c.type,
          notNull: !!c.notnull,
          defaultValue: c.dflt_value,
          isPrimaryKey: !!c.pk,
        })),
        foreignKeys: foreignKeys.map((fk: any) => ({
          column: fk.from,
          referencesTable: fk.table,
          referencesColumn: fk.to,
        })),
      });
    }

    res.json({
      databaseName: 'RailwayDB',
      engine: 'Relational MySQL 8.0 & SQLite3 Engine',
      totalTables: schemaDetails.length,
      tables: schemaDetails,
      views: viewsList,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to inspect database schema.' });
  }
});

// GET /api/dbms/download-sql/:filename - Download SQL script
dbmsRouter.get('/dbms/download-sql/:filename', (req: Request, res: Response): void => {
  const { filename } = req.params;
  const allowed = ['RailwayDB.sql', 'seed.sql', 'queries.sql', 'supabase_schema.sql'];
  if (!allowed.includes(filename)) {
    res.status(404).send('File not found.');
    return;
  }

  const filePath = path.resolve(process.cwd(), 'database', filename);
  if (!fs.existsSync(filePath)) {
    res.status(404).send('File does not exist.');
    return;
  }

  res.download(filePath, filename);
});
