import { Router, Request, Response } from 'express';
import { executeQuery, executeGet, executeRun } from '../db.ts';
import { authenticateUser } from './auth.ts';

export const adminRouter = Router();

// Middleware to enforce Admin authorization
async function requireAdmin(req: Request, res: Response, next: () => void): Promise<void> {
  const user = await authenticateUser(req);
  if (!user || user.Role !== 'Admin') {
    res.status(403).json({ error: 'Access forbidden: Administrator privileges required.' });
    return;
  }
  next();
}

// Admin Dashboard KPIs
adminRouter.get('/admin/dashboard', requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  try {
    const userCount = await executeGet("SELECT COUNT(*) AS total FROM User WHERE Role = 'Passenger';");
    const trainCount = await executeGet('SELECT COUNT(*) AS total FROM Train;');
    const bookingStats = await executeGet(`
      SELECT 
        COUNT(*) AS totalBookings,
        SUM(CASE WHEN Status = 'Confirmed' THEN 1 ELSE 0 END) AS confirmedBookings,
        SUM(CASE WHEN Status = 'Cancelled' THEN 1 ELSE 0 END) AS cancelledBookings,
        SUM(CASE WHEN Status = 'Confirmed' THEN Total_Amount ELSE 0 END) AS totalRevenue
      FROM Booking;
    `);

    const recentBookings = await executeQuery(`
      SELECT 
        b.Booking_ID,
        b.PNR,
        u.Name AS Passenger_Name,
        t.Train_Number,
        t.Train_Name,
        b.Journey_Date,
        b.Total_Amount,
        b.Status
      FROM Booking b
      JOIN User u ON b.User_ID = u.User_ID
      JOIN Train t ON b.Train_ID = t.Train_ID
      ORDER BY b.Booking_Date DESC
      LIMIT 10;
    `);

    res.json({
      stats: {
        totalUsers: Number(userCount?.total || 0),
        totalTrains: Number(trainCount?.total || 0),
        totalBookings: Number(bookingStats?.totalBookings || 0),
        confirmedBookings: Number(bookingStats?.confirmedBookings || 0),
        cancelledBookings: Number(bookingStats?.cancelledBookings || 0),
        totalRevenue: Number(bookingStats?.totalRevenue || 0),
      },
      recentBookings,
    });
  } catch (err) {
    console.error('Admin dashboard error:', err);
    res.status(500).json({ error: 'Failed to load dashboard metrics.' });
  }
});

// TRAINS MANAGEMENT
adminRouter.post('/admin/trains', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { trainNumber, trainName, trainType, totalSeats = 450, isActive = 1 } = req.body;
    if (!trainNumber || !trainName || !trainType) {
      res.status(400).json({ error: 'Train number, name, and type are required.' });
      return;
    }

    const result = await executeRun(`
      INSERT INTO Train (Train_Number, Train_Name, Train_Type, Total_Seats, Is_Active)
      VALUES (?, ?, ?, ?, ?);
    `, [trainNumber.trim(), trainName.trim(), trainType.trim(), Number(totalSeats), isActive ? 1 : 0]);

    res.status(201).json({ message: 'Train added successfully.', trainId: result.lastInsertId });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create train.' });
  }
});

adminRouter.put('/admin/trains/:id', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const trainId = parseInt(req.params.id, 10);
    const { trainNumber, trainName, trainType, totalSeats, isActive } = req.body;

    await executeRun(`
      UPDATE Train 
      SET Train_Number = COALESCE(?, Train_Number),
          Train_Name = COALESCE(?, Train_Name),
          Train_Type = COALESCE(?, Train_Type),
          Total_Seats = COALESCE(?, Total_Seats),
          Is_Active = COALESCE(?, Is_Active)
      WHERE Train_ID = ?;
    `, [trainNumber?.trim() || null, trainName?.trim() || null, trainType?.trim() || null, totalSeats ? Number(totalSeats) : null, typeof isActive === 'boolean' ? (isActive ? 1 : 0) : null, trainId]);

    res.json({ message: 'Train updated successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update train.' });
  }
});

adminRouter.delete('/admin/trains/:id', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const trainId = parseInt(req.params.id, 10);
    // Soft toggle or delete if no active bookings
    const hasBookings = await executeGet('SELECT COUNT(*) AS cnt FROM Booking WHERE Train_ID = ? AND Status = "Confirmed";', [trainId]);
    if (hasBookings && Number(hasBookings.cnt) > 0) {
      // Soft disable
      await executeRun('UPDATE Train SET Is_Active = 0 WHERE Train_ID = ?;', [trainId]);
      res.json({ message: 'Train has active reservations and was set to Inactive status.' });
    } else {
      await executeRun('DELETE FROM Train WHERE Train_ID = ?;', [trainId]);
      res.json({ message: 'Train deleted successfully.' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete train.' });
  }
});

// STATIONS MANAGEMENT
adminRouter.post('/admin/stations', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { stationName, stationCode, city } = req.body;
    if (!stationName || !stationCode || !city) {
      res.status(400).json({ error: 'Station name, station code, and city are required.' });
      return;
    }

    const result = await executeRun(`
      INSERT INTO Station (Station_Name, Station_Code, City)
      VALUES (?, ?, ?);
    `, [stationName.trim(), stationCode.trim().toUpperCase(), city.trim()]);

    res.status(201).json({ message: 'Station added successfully.', stationId: result.lastInsertId });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create station.' });
  }
});

adminRouter.put('/admin/stations/:id', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const stationId = parseInt(req.params.id, 10);
    const { stationName, stationCode, city } = req.body;

    await executeRun(`
      UPDATE Station 
      SET Station_Name = COALESCE(?, Station_Name),
          Station_Code = COALESCE(?, Station_Code),
          City = COALESCE(?, City)
      WHERE Station_ID = ?;
    `, [stationName?.trim() || null, stationCode?.trim().toUpperCase() || null, city?.trim() || null, stationId]);

    res.json({ message: 'Station updated successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update station.' });
  }
});

adminRouter.delete('/admin/stations/:id', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const stationId = parseInt(req.params.id, 10);
    await executeRun('DELETE FROM Station WHERE Station_ID = ?;', [stationId]);
    res.json({ message: 'Station deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete station. May be referenced by train routes.' });
  }
});

// ROUTE STOPS MANAGEMENT
adminRouter.get('/admin/trains/:id/stops', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const trainId = parseInt(req.params.id, 10);
    const stops = await executeQuery(`
      SELECT 
        ts.Stop_ID,
        ts.Stop_Number,
        ts.Arrival_Time,
        ts.Departure_Time,
        ts.Distance_From_Source,
        s.Station_ID,
        s.Station_Name,
        s.Station_Code,
        s.City
      FROM Train_Stop ts
      JOIN Station s ON ts.Station_ID = s.Station_ID
      WHERE ts.Train_ID = ?
      ORDER BY ts.Stop_Number ASC;
    `, [trainId]);

    res.json({ stops });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch train route stops.' });
  }
});

adminRouter.post('/admin/trains/:id/stops', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const trainId = parseInt(req.params.id, 10);
    const { stationId, stopNumber, arrivalTime, departureTime, distanceFromSource = 0 } = req.body;

    await executeRun(`
      INSERT INTO Train_Stop (Train_ID, Station_ID, Stop_Number, Arrival_Time, Departure_Time, Distance_From_Source)
      VALUES (?, ?, ?, ?, ?, ?);
    `, [trainId, Number(stationId), Number(stopNumber), arrivalTime || null, departureTime || null, Number(distanceFromSource)]);

    res.status(201).json({ message: 'Stop added to route successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to add stop to route.' });
  }
});

adminRouter.delete('/admin/trains/:id/stops/:stopId', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const stopId = parseInt(req.params.stopId, 10);
    await executeRun('DELETE FROM Train_Stop WHERE Stop_ID = ?;', [stopId]);
    res.json({ message: 'Stop removed from route.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to remove route stop.' });
  }
});

// BOOKINGS ADMIN
adminRouter.get('/admin/bookings', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { pnr, status, trainId } = req.query;
    let sql = `
      SELECT 
        b.Booking_ID,
        b.PNR,
        u.Name AS Customer_Name,
        u.Email AS Customer_Email,
        t.Train_Number,
        t.Train_Name,
        s_src.Station_Code AS Source_Code,
        s_dest.Station_Code AS Dest_Code,
        b.Journey_Date,
        b.Total_Amount,
        b.Status,
        b.Booking_Date,
        p.Payment_Method,
        p.Payment_Status
      FROM Booking b
      JOIN User u ON b.User_ID = u.User_ID
      JOIN Train t ON b.Train_ID = t.Train_ID
      JOIN Station s_src ON b.Source_Station_ID = s_src.Station_ID
      JOIN Station s_dest ON b.Destination_Station_ID = s_dest.Station_ID
      LEFT JOIN Payment p ON b.Booking_ID = p.Booking_ID
      WHERE 1=1
    `;
    const params: any[] = [];

    if (pnr) {
      sql += ' AND (b.PNR LIKE ? OR REPLACE(b.PNR, "-", "") LIKE ?)';
      params.push(`%${pnr}%`, `%${pnr}%`);
    }
    if (status && status !== 'All') {
      sql += ' AND b.Status = ?';
      params.push(status);
    }
    if (trainId && trainId !== 'All') {
      sql += ' AND b.Train_ID = ?';
      params.push(trainId);
    }

    sql += ' ORDER BY b.Booking_Date DESC LIMIT 100;';

    const bookings = await executeQuery(sql, params);
    res.json({ bookings });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve admin bookings.' });
  }
});

// USERS ADMIN
adminRouter.get('/admin/users', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { search } = req.query;
    let sql = `
      SELECT 
        u.User_ID,
        u.Name,
        u.Email,
        u.Phone,
        u.Role,
        u.Created_At,
        COUNT(b.Booking_ID) AS Total_Bookings,
        COALESCE(SUM(CASE WHEN b.Status = 'Confirmed' THEN b.Total_Amount ELSE 0 END), 0) AS Total_Spent
      FROM User u
      LEFT JOIN Booking b ON u.User_ID = b.User_ID
    `;
    const params: any[] = [];

    if (search) {
      sql += ' WHERE u.Name LIKE ? OR u.Email LIKE ? OR u.Phone LIKE ?';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ' GROUP BY u.User_ID ORDER BY Total_Bookings DESC;';

    const users = await executeQuery(sql, params);
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve users.' });
  }
});

// REPORTS & ANALYTICS
adminRouter.get('/admin/reports', requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  try {
    // Train-wise reservation report
    const trainWise = await executeQuery(`
      SELECT 
        t.Train_Number,
        t.Train_Name,
        t.Train_Type,
        COUNT(b.Booking_ID) AS Total_Bookings,
        SUM(CASE WHEN b.Status = 'Confirmed' THEN 1 ELSE 0 END) AS Confirmed_Count,
        SUM(CASE WHEN b.Status = 'Cancelled' THEN 1 ELSE 0 END) AS Cancelled_Count,
        COALESCE(SUM(CASE WHEN b.Status = 'Confirmed' THEN b.Total_Amount ELSE 0 END), 0) AS Revenue
      FROM Train t
      LEFT JOIN Booking b ON t.Train_ID = b.Train_ID
      GROUP BY t.Train_ID, t.Train_Number, t.Train_Name, t.Train_Type
      ORDER BY Revenue DESC;
    `);

    // Date-wise reservations
    const dateWise = await executeQuery(`
      SELECT 
        Journey_Date,
        COUNT(Booking_ID) AS Booking_Count,
        SUM(CASE WHEN Status = 'Confirmed' THEN Total_Amount ELSE 0 END) AS Daily_Revenue
      FROM Booking
      GROUP BY Journey_Date
      ORDER BY Journey_Date ASC;
    `);

    // Class popularity
    const classPopularity = await executeQuery(`
      SELECT 
        bp.Travel_Class,
        COUNT(*) AS Total_Tickets,
        ROUND(AVG(p.Age), 1) AS Average_Age
      FROM Booking_Passenger bp
      JOIN Passenger p ON bp.Passenger_ID = p.Passenger_ID
      GROUP BY bp.Travel_Class
      ORDER BY Total_Tickets DESC;
    `);

    res.json({
      trainWise,
      dateWise,
      classPopularity,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate reports.' });
  }
});
