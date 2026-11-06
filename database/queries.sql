-- =====================================================================
-- RailConnect - Railway Reservation Management System
-- Database Operations & DBMS Concepts Query Demonstrations
-- Database Name: RailwayDB
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. SEARCH TRAINS BETWEEN TWO STATIONS (WHERE, INNER JOIN, SUBQUERY)
-- Checks that the source stop sequence number is strictly less than destination stop number
-- ---------------------------------------------------------------------
SELECT 
    t.Train_ID,
    t.Train_Number,
    t.Train_Name,
    t.Train_Type,
    ts_src.Departure_Time AS Source_Departure,
    ts_dest.Arrival_Time AS Dest_Arrival,
    (ts_dest.Distance_From_Source - ts_src.Distance_From_Source) AS Journey_Distance_Km,
    TIMEDIFF(ts_dest.Arrival_Time, ts_src.Departure_Time) AS Duration
FROM Train t
INNER JOIN Train_Stop ts_src ON t.Train_ID = ts_src.Train_ID
INNER JOIN Train_Stop ts_dest ON t.Train_ID = ts_dest.Train_ID
WHERE ts_src.Station_ID = 1          -- Mumbai Central (MMCT)
  AND ts_dest.Station_ID = 10        -- New Delhi (NDLS)
  AND ts_src.Stop_Number < ts_dest.Stop_Number
  AND t.Is_Active = TRUE
ORDER BY ts_src.Departure_Time ASC;

-- ---------------------------------------------------------------------
-- 2. DISPLAY ALL BOOKINGS OF A USER WITH DETAILS (INNER JOIN, ORDER BY)
-- ---------------------------------------------------------------------
SELECT 
    b.Booking_ID,
    b.PNR,
    t.Train_Number,
    t.Train_Name,
    s_from.Station_Name AS Origin,
    s_to.Station_Name AS Destination,
    b.Journey_Date,
    b.Total_Amount,
    b.Status,
    COUNT(bp.Passenger_ID) AS Passenger_Count
FROM Booking b
INNER JOIN Train t ON b.Train_ID = t.Train_ID
INNER JOIN Station s_from ON b.Source_Station_ID = s_from.Station_ID
INNER JOIN Station s_to ON b.Destination_Station_ID = s_to.Station_ID
LEFT JOIN Booking_Passenger bp ON b.Booking_ID = bp.Booking_ID
WHERE b.User_ID = 2
GROUP BY b.Booking_ID, b.PNR, t.Train_Number, t.Train_Name, s_from.Station_Name, s_to.Station_Name, b.Journey_Date, b.Total_Amount, b.Status
ORDER BY b.Journey_Date DESC;

-- ---------------------------------------------------------------------
-- 3. FIND PASSENGERS FOR A PARTICULAR PNR (WHERE, INNER JOIN)
-- ---------------------------------------------------------------------
SELECT 
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
WHERE b.PNR = '842-1948291';

-- ---------------------------------------------------------------------
-- 4. CALCULATE TOTAL BOOKINGS AND REVENUE PER TRAIN (GROUP BY, AGGREGATE: COUNT, SUM)
-- ---------------------------------------------------------------------
SELECT 
    t.Train_Number,
    t.Train_Name,
    t.Train_Type,
    COUNT(b.Booking_ID) AS Total_Bookings,
    COALESCE(SUM(b.Total_Amount), 0.00) AS Total_Revenue,
    ROUND(AVG(b.Total_Amount), 2) AS Average_Ticket_Value
FROM Train t
LEFT JOIN Booking b ON t.Train_ID = b.Train_ID AND b.Status = 'Confirmed'
GROUP BY t.Train_ID, t.Train_Number, t.Train_Name, t.Train_Type
ORDER BY Total_Revenue DESC;

-- ---------------------------------------------------------------------
-- 5. FIND TRAINS WITH MORE THAN 5 CONFIRMED BOOKINGS (HAVING CLAUSE)
-- ---------------------------------------------------------------------
SELECT 
    t.Train_Number,
    t.Train_Name,
    COUNT(b.Booking_ID) AS Confirmed_Booking_Count,
    SUM(b.Total_Amount) AS Total_Earnings
FROM Train t
INNER JOIN Booking b ON t.Train_ID = b.Train_ID
WHERE b.Status = 'Confirmed'
GROUP BY t.Train_ID, t.Train_Number, t.Train_Name
HAVING COUNT(b.Booking_ID) >= 5
ORDER BY Confirmed_Booking_Count DESC;

-- ---------------------------------------------------------------------
-- 6. DISPLAY CANCELLED BOOKINGS WITH REFUND STATUS (WHERE, LEFT JOIN)
-- ---------------------------------------------------------------------
SELECT 
    b.PNR,
    u.Name AS Customer_Name,
    u.Email,
    t.Train_Name,
    b.Journey_Date,
    b.Total_Amount AS Original_Amount,
    p.Payment_Method,
    p.Payment_Status
FROM Booking b
INNER JOIN User u ON b.User_ID = u.User_ID
INNER JOIN Train t ON b.Train_ID = t.Train_ID
LEFT JOIN Payment p ON b.Booking_ID = p.Booking_ID
WHERE b.Status = 'Cancelled'
ORDER BY b.Booking_Date DESC;

-- ---------------------------------------------------------------------
-- 7. CALCULATE SYSTEM-WIDE REVENUE SUMMARY (AGGREGATES: SUM, AVG, MIN, MAX)
-- ---------------------------------------------------------------------
SELECT 
    COUNT(Booking_ID) AS Total_Transactions,
    SUM(CASE WHEN Status = 'Confirmed' THEN Total_Amount ELSE 0 END) AS Total_Confirmed_Revenue,
    SUM(CASE WHEN Status = 'Cancelled' THEN Total_Amount ELSE 0 END) AS Total_Refunded_Amount,
    ROUND(AVG(Total_Amount), 2) AS Mean_Fare,
    MIN(Total_Amount) AS Lowest_Fare_Booked,
    MAX(Total_Amount) AS Highest_Fare_Booked
FROM Booking;

-- ---------------------------------------------------------------------
-- 8. FIND AVAILABLE SEATS FOR A TRAIN AND JOURNEY DATE (SEAT INVENTORY LOOKUP)
-- ---------------------------------------------------------------------
SELECT 
    si.Travel_Class,
    si.Coach_Number,
    COUNT(si.Inventory_ID) AS Total_Seats_Configured,
    SUM(CASE WHEN si.Seat_Status = 'Available' THEN 1 ELSE 0 END) AS Seats_Available,
    SUM(CASE WHEN si.Seat_Status = 'Booked' THEN 1 ELSE 0 END) AS Seats_Booked
FROM Seat_Inventory si
WHERE si.Train_ID = 1
  AND si.Journey_Date = '2026-11-15'
GROUP BY si.Travel_Class, si.Coach_Number
ORDER BY si.Travel_Class, si.Coach_Number;

-- ---------------------------------------------------------------------
-- 9. DISPLAY THE MOST POPULAR ROUTES BY RESERVATION COUNT (INNER JOIN, GROUP BY)
-- ---------------------------------------------------------------------
SELECT 
    s_from.Station_Name AS Origin_Station,
    s_to.Station_Name AS Destination_Station,
    COUNT(b.Booking_ID) AS Total_Trips_Booked,
    SUM(b.Total_Amount) AS Cumulative_Revenue
FROM Booking b
INNER JOIN Station s_from ON b.Source_Station_ID = s_from.Station_ID
INNER JOIN Station s_to ON b.Destination_Station_ID = s_to.Station_ID
WHERE b.Status = 'Confirmed'
GROUP BY b.Source_Station_ID, b.Destination_Station_ID, s_from.Station_Name, s_to.Station_Name
ORDER BY Total_Trips_Booked DESC
LIMIT 5;

-- ---------------------------------------------------------------------
-- 10. FIND USERS WHO HAVE NEVER BOOKED A TICKET (SUBQUERY WITH NOT IN / LEFT JOIN)
-- ---------------------------------------------------------------------
-- Subquery method:
SELECT 
    u.User_ID,
    u.Name,
    u.Email,
    u.Phone,
    u.Role,
    u.Created_At
FROM User u
WHERE u.User_ID NOT IN (
    SELECT DISTINCT User_ID FROM Booking
)
AND u.Role = 'Passenger';

-- Alternative: Left join with IS NULL check
SELECT 
    u.User_ID,
    u.Name,
    u.Email
FROM User u
LEFT JOIN Booking b ON u.User_ID = b.User_ID
WHERE b.Booking_ID IS NULL AND u.Role = 'Passenger';

-- ---------------------------------------------------------------------
-- 11. PASSENGER DEMOGRAPHICS ANALYSIS (GROUP BY, CASE EXPRESSIONS, AGGREGATES)
-- ---------------------------------------------------------------------
SELECT 
    Gender,
    COUNT(Passenger_ID) AS Passenger_Count,
    ROUND(AVG(Age), 1) AS Average_Age,
    MIN(Age) AS Youngest_Passenger,
    MAX(Age) AS Oldest_Passenger,
    SUM(CASE WHEN Age < 18 THEN 1 ELSE 0 END) AS Children,
    SUM(CASE WHEN Age BETWEEN 18 AND 59 THEN 1 ELSE 0 END) AS Adults,
    SUM(CASE WHEN Age >= 60 THEN 1 ELSE 0 END) AS Senior_Citizens
FROM Passenger
GROUP BY Gender;

-- ---------------------------------------------------------------------
-- 12. FIND TRAINS VISITING MORE THAN 6 STATIONS (SUBQUERY & AGGREGATE FILTER)
-- ---------------------------------------------------------------------
SELECT 
    t.Train_Number,
    t.Train_Name,
    t.Train_Type,
    (SELECT COUNT(*) FROM Train_Stop ts WHERE ts.Train_ID = t.Train_ID) AS Total_Stops,
    (SELECT MAX(Distance_From_Source) FROM Train_Stop ts WHERE ts.Train_ID = t.Train_ID) AS Total_Route_Km
FROM Train t
WHERE (SELECT COUNT(*) FROM Train_Stop ts WHERE ts.Train_ID = t.Train_ID) >= 6
ORDER BY Total_Stops DESC;

-- ---------------------------------------------------------------------
-- 13. DEMONSTRATING LEFT JOIN & RIGHT JOIN EQUIVALENCE
-- Compares all stations with those actively used as booking origin
-- ---------------------------------------------------------------------
SELECT 
    s.Station_Code,
    s.Station_Name,
    s.City,
    COUNT(b.Booking_ID) AS Origin_Departure_Count
FROM Station s
LEFT JOIN Booking b ON s.Station_ID = b.Source_Station_ID
GROUP BY s.Station_ID, s.Station_Code, s.Station_Name, s.City
ORDER BY Origin_Departure_Count DESC;

-- ---------------------------------------------------------------------
-- 14. QUERYING FROM DATABASE VIEWS (VIEW ABSTRACTION)
-- ---------------------------------------------------------------------
SELECT * 
FROM Booking_Details 
WHERE Booking_Status = 'Confirmed'
ORDER BY Journey_Date ASC
LIMIT 10;

-- ---------------------------------------------------------------------
-- 15. CORRELATED SUBQUERY: FARE COMPARISON WITH AVERAGE FARE
-- ---------------------------------------------------------------------
SELECT 
    f.Fare_ID,
    t.Train_Name,
    f.Travel_Class,
    f.Fare_Amount,
    ROUND((SELECT AVG(Fare_Amount) FROM Fare f2 WHERE f2.Travel_Class = f.Travel_Class), 2) AS Class_Average_Fare,
    ROUND(f.Fare_Amount - (SELECT AVG(Fare_Amount) FROM Fare f2 WHERE f2.Travel_Class = f.Travel_Class), 2) AS Variance_From_Average
FROM Fare f
JOIN Train t ON f.Train_ID = t.Train_ID
ORDER BY f.Travel_Class, f.Fare_Amount DESC
LIMIT 15;

-- ---------------------------------------------------------------------
-- 16. ACID TRANSACTION DEMONSTRATION: TICKET BOOKING TRANSACTION
-- Atomically reserves seat, creates booking, attaches passenger, and records payment
-- ---------------------------------------------------------------------
START TRANSACTION;

-- Step 1: Verify and lock available seat in Seat_Inventory
-- SELECT Inventory_ID, Seat_Number, Coach_Number FROM Seat_Inventory 
-- WHERE Train_ID = 1 AND Journey_Date = '2026-11-15' AND Travel_Class = '3A' AND Seat_Status = 'Available'
-- FOR UPDATE;

-- Step 2: Insert into Booking
INSERT INTO Booking (PNR, User_ID, Train_ID, Source_Station_ID, Destination_Station_ID, Journey_Date, Total_Amount, Status)
VALUES ('842-9999001', 2, 1, 1, 10, '2026-11-15', 1850.00, 'Confirmed');

SET @new_booking_id = LAST_INSERT_ID();

-- Step 3: Insert Passenger
INSERT INTO Passenger (Passenger_Name, Age, Gender)
VALUES ('Rohan Verma', 29, 'Male');

SET @new_passenger_id = LAST_INSERT_ID();

-- Step 4: Link Booking and Passenger
INSERT INTO Booking_Passenger (Booking_ID, Passenger_ID, Seat_Number, Coach_Number, Travel_Class)
VALUES (@new_booking_id, @new_passenger_id, '12', 'B1', '3A');

-- Step 5: Mark Seat as Booked
UPDATE Seat_Inventory 
SET Seat_Status = 'Booked', Booking_ID = @new_booking_id 
WHERE Train_ID = 1 AND Journey_Date = '2026-11-15' AND Travel_Class = '3A' AND Seat_Number = '12' AND Coach_Number = 'B1';

-- Step 6: Create Payment Record
INSERT INTO Payment (Booking_ID, Amount, Payment_Method, Payment_Status)
VALUES (@new_booking_id, 1850.00, 'UPI', 'Success');

-- Step 7: Commit all operations atomically
COMMIT;
-- In case of any constraint violation or unavailable seat:
-- ROLLBACK;

-- ---------------------------------------------------------------------
-- 17. ACID TRANSACTION DEMONSTRATION: TICKET CANCELLATION TRANSACTION
-- Atomically cancels booking, releases seat back to inventory, and processes refund
-- ---------------------------------------------------------------------
START TRANSACTION;

-- Step 1: Update Booking Status
UPDATE Booking 
SET Status = 'Cancelled' 
WHERE PNR = '842-9999001' AND Status = 'Confirmed';

-- Step 2: Free up the allocated seats in inventory
UPDATE Seat_Inventory 
SET Seat_Status = 'Available', Booking_ID = NULL 
WHERE Booking_ID = (SELECT Booking_ID FROM Booking WHERE PNR = '842-9999001');

-- Step 3: Update Payment Record to Refunded
UPDATE Payment 
SET Payment_Status = 'Refunded' 
WHERE Booking_ID = (SELECT Booking_ID FROM Booking WHERE PNR = '842-9999001');

COMMIT;
