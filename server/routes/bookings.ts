import { Router, Request, Response } from 'express';
import { executeQuery, executeGet, executeRun, executeTransaction } from '../db.ts';
import { authenticateUser } from './auth.ts';

export const bookingsRouter = Router();

// Helper to generate realistic 10-digit Indian Railway PNR format (e.g., "842-1928374")
function generatePNR(): string {
  const zonePrefix = '842'; // Western/Central railway reservation zone prefix
  const randomSevenDigits = Math.floor(1000000 + Math.random() * 9000000);
  return `${zonePrefix}-${randomSevenDigits}`;
}

// POST /api/bookings - Atomic Ticket Booking Transaction
bookingsRouter.post('/bookings', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await authenticateUser(req);
    const {
      trainId,
      sourceStationId,
      destStationId,
      journeyDate,
      travelClass,
      passengers,
      paymentMethod = 'UPI',
    } = req.body;

    if (!trainId || !sourceStationId || !destStationId || !journeyDate || !travelClass || !passengers || !Array.isArray(passengers) || passengers.length === 0) {
      res.status(400).json({ error: 'All booking fields and at least one passenger are required.' });
      return;
    }

    if (passengers.length > 6) {
      res.status(400).json({ error: 'Maximum 6 passengers allowed per booking reservation.' });
      return;
    }

    // Validate passenger details
    for (const p of passengers) {
      if (!p.name || !p.age || !p.gender) {
        res.status(400).json({ error: 'Each passenger must provide Name, Age, and Gender.' });
        return;
      }
    }

    // 1. Verify train & route order
    const train = await executeGet('SELECT * FROM Train WHERE Train_ID = ? AND Is_Active = 1;', [trainId]);
    if (!train) {
      res.status(404).json({ error: 'Train not found or currently inactive.' });
      return;
    }

    const stops = await executeQuery(`
      SELECT ts.Station_ID, ts.Stop_Number, ts.Distance_From_Source
      FROM Train_Stop ts 
      WHERE ts.Train_ID = ? AND ts.Station_ID IN (?, ?)
      ORDER BY ts.Stop_Number ASC;
    `, [trainId, sourceStationId, destStationId]);

    if (stops.length < 2) {
      res.status(400).json({ error: 'Selected stations are not valid stops for this train route.' });
      return;
    }

    if (stops[0].Station_ID !== Number(sourceStationId) || stops[1].Station_ID !== Number(destStationId)) {
      res.status(400).json({ error: 'Source station must occur before destination station in the train route sequence.' });
      return;
    }

    // 2. Determine Fare per passenger
    let fareRecord = await executeGet(`
      SELECT Fare_Amount FROM Fare 
      WHERE Train_ID = ? AND Source_Station_ID = ? AND Destination_Station_ID = ? AND Travel_Class = ?;
    `, [trainId, sourceStationId, destStationId, travelClass]);

    let farePerPassenger = fareRecord ? Number(fareRecord.Fare_Amount) : 0;
    if (!farePerPassenger) {
      const distance = Math.max(120, stops[1].Distance_From_Source - stops[0].Distance_From_Source);
      const multipliers: Record<string, number> = {
        '1A': 3.5, 'EC': 3.0, '2A': 2.2, '3A': 1.5, 'CC': 1.3, 'SL': 0.6, '2S': 0.3
      };
      farePerPassenger = Math.round(distance * (multipliers[travelClass] || 1.2) + 120);
    }

    const totalAmount = farePerPassenger * passengers.length;
    const userId = user ? user.User_ID : 2; // Default to demo registered user if unauthenticated

    // Coach and default seating map
    const defaultCoachMap: Record<string, string> = {
      '1A': 'H1', '2A': 'A1', '3A': 'B1', 'SL': 'S1', 'CC': 'C1', 'EC': 'E1', '2S': 'D1'
    };
    const targetCoach = defaultCoachMap[travelClass] || 'B1';

    // 3. ATOMIC DATABASE TRANSACTION
    const bookingResult = await executeTransaction(async () => {
      // Find available seats in inventory
      let availableSeats = await executeQuery(`
        SELECT Inventory_ID, Seat_Number, Coach_Number 
        FROM Seat_Inventory 
        WHERE Train_ID = ? AND Journey_Date = ? AND Travel_Class = ? AND Seat_Status = 'Available'
        ORDER BY Inventory_ID ASC
        LIMIT ?;
      `, [trainId, journeyDate, travelClass, passengers.length]);

      // If inventory table doesn't have enough pre-seeded available records, generate new ones on demand
      if (availableSeats.length < passengers.length) {
        const needed = passengers.length - availableSeats.length;
        const maxSeatRow = await executeGet(`
          SELECT MAX(CAST(Seat_Number AS INTEGER)) AS maxNum 
          FROM Seat_Inventory 
          WHERE Train_ID = ? AND Journey_Date = ? AND Travel_Class = ?;
        `, [trainId, journeyDate, travelClass]);

        let startNum = (maxSeatRow && maxSeatRow.maxNum ? Number(maxSeatRow.maxNum) : 0) + 1;
        for (let i = 0; i < needed; i++) {
          const seatNum = (startNum + i).toString();
          await executeRun(`
            INSERT INTO Seat_Inventory (Train_ID, Journey_Date, Travel_Class, Seat_Number, Coach_Number, Seat_Status, Booking_ID)
            VALUES (?, ?, ?, ?, ?, 'Available', NULL);
          `, [trainId, journeyDate, travelClass, seatNum, targetCoach]);
        }

        // Re-fetch now that seats are added
        availableSeats = await executeQuery(`
          SELECT Inventory_ID, Seat_Number, Coach_Number 
          FROM Seat_Inventory 
          WHERE Train_ID = ? AND Journey_Date = ? AND Travel_Class = ? AND Seat_Status = 'Available'
          ORDER BY Inventory_ID ASC
          LIMIT ?;
        `, [trainId, journeyDate, travelClass, passengers.length]);
      }

      if (availableSeats.length < passengers.length) {
        throw new Error('Not enough seats available to satisfy the reservation request.');
      }

      // Generate unique PNR
      const pnr = generatePNR();

      // Step A: Insert Booking
      const insertBooking = await executeRun(`
        INSERT INTO Booking (PNR, User_ID, Train_ID, Source_Station_ID, Destination_Station_ID, Journey_Date, Total_Amount, Status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'Confirmed');
      `, [pnr, userId, trainId, sourceStationId, destStationId, journeyDate, totalAmount]);

      const bookingId = insertBooking.lastInsertId;

      // Step B: Insert Passengers and map to seats
      const allocatedPassengers = [];
      for (let i = 0; i < passengers.length; i++) {
        const p = passengers[i];
        const seatAlloc = availableSeats[i];

        const pInsert = await executeRun(`
          INSERT INTO Passenger (Passenger_Name, Age, Gender) VALUES (?, ?, ?);
        `, [p.name.trim(), parseInt(p.age, 10), p.gender]);

        const passengerId = pInsert.lastInsertId;

        await executeRun(`
          INSERT INTO Booking_Passenger (Booking_ID, Passenger_ID, Seat_Number, Coach_Number, Travel_Class)
          VALUES (?, ?, ?, ?, ?);
        `, [bookingId, passengerId, seatAlloc.Seat_Number, seatAlloc.Coach_Number, travelClass]);

        // Mark seat as Booked
        await executeRun(`
          UPDATE Seat_Inventory 
          SET Seat_Status = 'Booked', Booking_ID = ? 
          WHERE Inventory_ID = ?;
        `, [bookingId, seatAlloc.Inventory_ID]);

        allocatedPassengers.push({
          passengerId,
          name: p.name,
          age: p.age,
          gender: p.gender,
          coach: seatAlloc.Coach_Number,
          seat: seatAlloc.Seat_Number,
          travelClass,
        });
      }

      // Step C: Simulated Payment
      await executeRun(`
        INSERT INTO Payment (Booking_ID, Amount, Payment_Method, Payment_Status)
        VALUES (?, ?, ?, 'Success');
      `, [bookingId, totalAmount, paymentMethod]);

      return {
        bookingId,
        pnr,
        totalAmount,
        allocatedPassengers,
      };
    });

    res.status(201).json({
      message: 'Ticket booked successfully.',
      ...bookingResult,
    });
  } catch (err: any) {
    console.error('Booking transaction failure:', err);
    res.status(500).json({ error: err.message || 'Booking transaction failed and has been rolled back.' });
  }
});

// GET /api/bookings - Fetch user bookings or all bookings (if query param or admin)
bookingsRouter.get('/bookings', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await authenticateUser(req);
    const userIdParam = req.query.userId ? Number(req.query.userId) : null;
    const targetUserId = userIdParam || (user ? user.User_ID : null);

    let sql = `
      SELECT 
        b.Booking_ID,
        b.PNR,
        b.Journey_Date,
        b.Booking_Date,
        b.Total_Amount,
        b.Status,
        t.Train_Number,
        t.Train_Name,
        t.Train_Type,
        s_src.Station_Name AS Source_Station,
        s_src.Station_Code AS Source_Code,
        s_dest.Station_Name AS Destination_Station,
        s_dest.Station_Code AS Destination_Code,
        ts_src.Departure_Time,
        ts_dest.Arrival_Time,
        COUNT(bp.Passenger_ID) AS Passenger_Count,
        p.Payment_Method,
        p.Payment_Status
      FROM Booking b
      JOIN Train t ON b.Train_ID = t.Train_ID
      JOIN Station s_src ON b.Source_Station_ID = s_src.Station_ID
      JOIN Station s_dest ON b.Destination_Station_ID = s_dest.Station_ID
      LEFT JOIN Train_Stop ts_src ON t.Train_ID = ts_src.Train_ID AND ts_src.Station_ID = b.Source_Station_ID
      LEFT JOIN Train_Stop ts_dest ON t.Train_ID = ts_dest.Train_ID AND ts_dest.Station_ID = b.Destination_Station_ID
      LEFT JOIN Booking_Passenger bp ON b.Booking_ID = bp.Booking_ID
      LEFT JOIN Payment p ON b.Booking_ID = p.Booking_ID
    `;

    const params: any[] = [];
    if (targetUserId) {
      sql += ' WHERE b.User_ID = ?';
      params.push(targetUserId);
    }

    sql += ' GROUP BY b.Booking_ID ORDER BY b.Booking_Date DESC LIMIT 50;';

    const bookings = await executeQuery(sql, params);
    res.json({ bookings });
  } catch (err) {
    console.error('Error fetching bookings:', err);
    res.status(500).json({ error: 'Failed to retrieve bookings.' });
  }
});

// GET /api/bookings/:pnr - PNR Status and full ticket details
bookingsRouter.get('/bookings/:pnr', async (req: Request, res: Response): Promise<void> => {
  try {
    const rawPnr = req.params.pnr.trim();
    // Normalize format (handle with or without hyphen)
    const pnr = rawPnr.includes('-') ? rawPnr : `${rawPnr.slice(0, 3)}-${rawPnr.slice(3)}`;

    const booking = await executeGet(`
      SELECT 
        b.Booking_ID,
        b.PNR,
        b.Journey_Date,
        b.Booking_Date,
        b.Total_Amount,
        b.Status,
        u.Name AS Booked_By_Name,
        u.Email AS Booked_By_Email,
        u.Phone AS Booked_By_Phone,
        t.Train_ID,
        t.Train_Number,
        t.Train_Name,
        t.Train_Type,
        s_src.Station_ID AS Source_Station_ID,
        s_src.Station_Name AS Source_Station,
        s_src.Station_Code AS Source_Code,
        s_dest.Station_ID AS Destination_Station_ID,
        s_dest.Station_Name AS Destination_Station,
        s_dest.Station_Code AS Destination_Code,
        ts_src.Departure_Time,
        ts_dest.Arrival_Time,
        ts_src.Distance_From_Source AS Src_Dist,
        ts_dest.Distance_From_Source AS Dest_Dist,
        p.Payment_Method,
        p.Payment_Status,
        p.Payment_Date
      FROM Booking b
      JOIN User u ON b.User_ID = u.User_ID
      JOIN Train t ON b.Train_ID = t.Train_ID
      JOIN Station s_src ON b.Source_Station_ID = s_src.Station_ID
      JOIN Station s_dest ON b.Destination_Station_ID = s_dest.Station_ID
      LEFT JOIN Train_Stop ts_src ON t.Train_ID = ts_src.Train_ID AND ts_src.Station_ID = b.Source_Station_ID
      LEFT JOIN Train_Stop ts_dest ON t.Train_ID = ts_dest.Train_ID AND ts_dest.Station_ID = b.Destination_Station_ID
      LEFT JOIN Payment p ON b.Booking_ID = p.Booking_ID
      WHERE b.PNR = ? OR REPLACE(b.PNR, '-', '') = ?;
    `, [pnr, rawPnr]);

    if (!booking) {
      res.status(404).json({ error: `No booking found for PNR "${rawPnr}". Please verify the 10-digit PNR number.` });
      return;
    }

    // Passengers list with coach & seat numbers
    const passengers = await executeQuery(`
      SELECT 
        p.Passenger_ID,
        p.Passenger_Name,
        p.Age,
        p.Gender,
        bp.Coach_Number,
        bp.Seat_Number,
        bp.Travel_Class
      FROM Booking_Passenger bp
      JOIN Passenger p ON bp.Passenger_ID = p.Passenger_ID
      WHERE bp.Booking_ID = ?;
    `, [booking.Booking_ID]);

    res.json({
      booking: {
        ...booking,
        passengers,
      },
    });
  } catch (err) {
    console.error('Error fetching PNR status:', err);
    res.status(500).json({ error: 'Failed to look up PNR status.' });
  }
});

// POST /api/bookings/:pnr/cancel - Atomic Cancellation Transaction
bookingsRouter.post('/bookings/:pnr/cancel', async (req: Request, res: Response): Promise<void> => {
  try {
    const rawPnr = req.params.pnr.trim();
    const pnr = rawPnr.includes('-') ? rawPnr : `${rawPnr.slice(0, 3)}-${rawPnr.slice(3)}`;

    const booking = await executeGet('SELECT * FROM Booking WHERE PNR = ? OR REPLACE(PNR, "-", "") = ?;', [pnr, rawPnr]);
    if (!booking) {
      res.status(404).json({ error: 'Booking reservation not found.' });
      return;
    }

    if (booking.Status === 'Cancelled') {
      res.status(400).json({ error: 'This ticket is already cancelled. Cannot cancel twice.' });
      return;
    }

    // Calculate simulated refund amount (e.g. 85% refund after Rs. 60 clerkage)
    const refundAmount = Math.max(0, Math.round(Number(booking.Total_Amount) * 0.90));

    // ATOMIC CANCELLATION TRANSACTION
    await executeTransaction(async () => {
      // 1. Update Booking status
      await executeRun("UPDATE Booking SET Status = 'Cancelled' WHERE Booking_ID = ?;", [booking.Booking_ID]);

      // 2. Release allocated seats in Seat_Inventory
      await executeRun(`
        UPDATE Seat_Inventory 
        SET Seat_Status = 'Available', Booking_ID = NULL 
        WHERE Booking_ID = ?;
      `, [booking.Booking_ID]);

      // 3. Update payment status to Refunded
      await executeRun(`
        UPDATE Payment 
        SET Payment_Status = 'Refunded' 
        WHERE Booking_ID = ?;
      `, [booking.Booking_ID]);
    });

    res.json({
      message: 'Booking cancelled successfully. Allocated seats have been released back to general inventory.',
      pnr: booking.PNR,
      refundAmount,
      cancellationStatus: 'Cancelled',
    });
  } catch (err: any) {
    console.error('Cancellation error:', err);
    res.status(500).json({ error: err.message || 'Failed to cancel reservation.' });
  }
});
