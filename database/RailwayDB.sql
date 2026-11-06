-- =====================================================================
-- RailConnect - Railway Reservation Management System
-- Database Definition & Schema (MySQL 8.0 Compatible)
-- Database Name: RailwayDB
-- =====================================================================

DROP DATABASE IF EXISTS RailwayDB;
CREATE DATABASE RailwayDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE RailwayDB;

-- ---------------------------------------------------------------------
-- TABLE 1: User
-- Stores registered passengers and administrative accounts
-- ---------------------------------------------------------------------
CREATE TABLE User (
    User_ID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Email VARCHAR(100) NOT NULL UNIQUE,
    Phone VARCHAR(15),
    Password VARCHAR(255) NOT NULL,
    Role ENUM('Passenger', 'Admin') NOT NULL DEFAULT 'Passenger',
    Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_email (Email),
    INDEX idx_user_role (Role)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- TABLE 2: Station
-- Indian Railway stations with official IR station codes
-- ---------------------------------------------------------------------
CREATE TABLE Station (
    Station_ID INT AUTO_INCREMENT PRIMARY KEY,
    Station_Name VARCHAR(100) NOT NULL,
    Station_Code VARCHAR(10) NOT NULL UNIQUE,
    City VARCHAR(50) NOT NULL,
    INDEX idx_station_code (Station_Code),
    INDEX idx_station_city (City)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- TABLE 3: Train
-- Train catalog with types and seating capacity
-- ---------------------------------------------------------------------
CREATE TABLE Train (
    Train_ID INT AUTO_INCREMENT PRIMARY KEY,
    Train_Number VARCHAR(10) NOT NULL UNIQUE,
    Train_Name VARCHAR(100) NOT NULL,
    Train_Type VARCHAR(30) NOT NULL, -- Superfast, Vande Bharat, Rajdhani, Shatabdi, Express
    Total_Seats INT NOT NULL DEFAULT 400,
    Is_Active BOOLEAN NOT NULL DEFAULT TRUE,
    INDEX idx_train_number (Train_Number),
    INDEX idx_train_type (Train_Type)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- TABLE 4: Train_Stop
-- Sequential intermediate stations on each train route with timings
-- ---------------------------------------------------------------------
CREATE TABLE Train_Stop (
    Stop_ID INT AUTO_INCREMENT PRIMARY KEY,
    Train_ID INT NOT NULL,
    Station_ID INT NOT NULL,
    Stop_Number INT NOT NULL,
    Arrival_Time TIME NULL,
    Departure_Time TIME NULL,
    Distance_From_Source DECIMAL(8,2) NOT NULL DEFAULT 0.00,
    CONSTRAINT fk_stop_train FOREIGN KEY (Train_ID) REFERENCES Train(Train_ID) ON DELETE CASCADE,
    CONSTRAINT fk_stop_station FOREIGN KEY (Station_ID) REFERENCES Station(Station_ID) ON DELETE CASCADE,
    CONSTRAINT uq_train_stop UNIQUE (Train_ID, Stop_Number),
    INDEX idx_stop_station (Station_ID),
    INDEX idx_stop_train_seq (Train_ID, Stop_Number)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- TABLE 5: Booking
-- Primary reservation records with 10-digit unique PNR
-- ---------------------------------------------------------------------
CREATE TABLE Booking (
    Booking_ID INT AUTO_INCREMENT PRIMARY KEY,
    PNR VARCHAR(15) NOT NULL UNIQUE,
    User_ID INT NOT NULL,
    Train_ID INT NOT NULL,
    Source_Station_ID INT NOT NULL,
    Destination_Station_ID INT NOT NULL,
    Journey_Date DATE NOT NULL,
    Booking_Date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Total_Amount DECIMAL(10,2) NOT NULL,
    Status ENUM('Confirmed', 'Cancelled', 'Pending') NOT NULL DEFAULT 'Confirmed',
    CONSTRAINT fk_booking_user FOREIGN KEY (User_ID) REFERENCES User(User_ID) ON DELETE RESTRICT,
    CONSTRAINT fk_booking_train FOREIGN KEY (Train_ID) REFERENCES Train(Train_ID) ON DELETE RESTRICT,
    CONSTRAINT fk_booking_source FOREIGN KEY (Source_Station_ID) REFERENCES Station(Station_ID) ON DELETE RESTRICT,
    CONSTRAINT fk_booking_dest FOREIGN KEY (Destination_Station_ID) REFERENCES Station(Station_ID) ON DELETE RESTRICT,
    INDEX idx_booking_pnr (PNR),
    INDEX idx_booking_user (User_ID),
    INDEX idx_booking_date (Journey_Date),
    INDEX idx_booking_status (Status)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- TABLE 6: Passenger
-- Passenger demographic details
-- ---------------------------------------------------------------------
CREATE TABLE Passenger (
    Passenger_ID INT AUTO_INCREMENT PRIMARY KEY,
    Passenger_Name VARCHAR(100) NOT NULL,
    Age INT NOT NULL,
    Gender VARCHAR(10) NOT NULL,
    INDEX idx_passenger_name (Passenger_Name)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- TABLE 7: Booking_Passenger
-- Composite associative entity linking bookings to passengers and seats
-- ---------------------------------------------------------------------
CREATE TABLE Booking_Passenger (
    Booking_ID INT NOT NULL,
    Passenger_ID INT NOT NULL,
    Seat_Number VARCHAR(10) NOT NULL,
    Coach_Number VARCHAR(10) NOT NULL,
    Travel_Class VARCHAR(30) NOT NULL, -- 1A, 2A, 3A, SL, CC, EC
    PRIMARY KEY (Booking_ID, Passenger_ID),
    CONSTRAINT fk_bp_booking FOREIGN KEY (Booking_ID) REFERENCES Booking(Booking_ID) ON DELETE CASCADE,
    CONSTRAINT fk_bp_passenger FOREIGN KEY (Passenger_ID) REFERENCES Passenger(Passenger_ID) ON DELETE RESTRICT,
    INDEX idx_bp_seat (Coach_Number, Seat_Number)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- TABLE 8: Payment
-- Simulated payment records for ticket bookings
-- ---------------------------------------------------------------------
CREATE TABLE Payment (
    Payment_ID INT AUTO_INCREMENT PRIMARY KEY,
    Booking_ID INT NOT NULL UNIQUE,
    Amount DECIMAL(10,2) NOT NULL,
    Payment_Method VARCHAR(30) NOT NULL, -- UPI, NetBanking, CreditCard, DebitCard
    Payment_Status VARCHAR(20) NOT NULL DEFAULT 'Success', -- Success, Refunded, Failed
    Payment_Date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_payment_booking FOREIGN KEY (Booking_ID) REFERENCES Booking(Booking_ID) ON DELETE CASCADE,
    INDEX idx_payment_status (Payment_Status)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- TABLE 9: Seat_Inventory
-- Granular seat availability per train, date, class and seat number
-- ---------------------------------------------------------------------
CREATE TABLE Seat_Inventory (
    Inventory_ID INT AUTO_INCREMENT PRIMARY KEY,
    Train_ID INT NOT NULL,
    Journey_Date DATE NOT NULL,
    Travel_Class VARCHAR(30) NOT NULL,
    Seat_Number VARCHAR(10) NOT NULL,
    Coach_Number VARCHAR(10) NOT NULL,
    Seat_Status ENUM('Available', 'Booked') NOT NULL DEFAULT 'Available',
    Booking_ID INT NULL,
    CONSTRAINT fk_inv_train FOREIGN KEY (Train_ID) REFERENCES Train(Train_ID) ON DELETE CASCADE,
    CONSTRAINT fk_inv_booking FOREIGN KEY (Booking_ID) REFERENCES Booking(Booking_ID) ON DELETE SET NULL,
    CONSTRAINT uq_seat_slot UNIQUE (Train_ID, Journey_Date, Travel_Class, Seat_Number, Coach_Number),
    INDEX idx_inv_lookup (Train_ID, Journey_Date, Travel_Class, Seat_Status)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- TABLE 10: Fare
-- Distance & class-based fare matrix between station pairs
-- ---------------------------------------------------------------------
CREATE TABLE Fare (
    Fare_ID INT AUTO_INCREMENT PRIMARY KEY,
    Train_ID INT NOT NULL,
    Source_Station_ID INT NOT NULL,
    Destination_Station_ID INT NOT NULL,
    Travel_Class VARCHAR(30) NOT NULL,
    Fare_Amount DECIMAL(10,2) NOT NULL,
    CONSTRAINT fk_fare_train FOREIGN KEY (Train_ID) REFERENCES Train(Train_ID) ON DELETE CASCADE,
    CONSTRAINT fk_fare_source FOREIGN KEY (Source_Station_ID) REFERENCES Station(Station_ID) ON DELETE CASCADE,
    CONSTRAINT fk_fare_dest FOREIGN KEY (Destination_Station_ID) REFERENCES Station(Station_ID) ON DELETE CASCADE,
    CONSTRAINT uq_fare_rule UNIQUE (Train_ID, Source_Station_ID, Destination_Station_ID, Travel_Class),
    INDEX idx_fare_lookup (Train_ID, Source_Station_ID, Destination_Station_ID, Travel_Class)
) ENGINE=InnoDB;

-- =====================================================================
-- DATABASE VIEWS (DBMS Concept: Views for Abstraction & Reporting)
-- =====================================================================

-- VIEW 1: Booking_Details
-- Comprehensive single-view summary of booking with train and station names
CREATE OR REPLACE VIEW Booking_Details AS
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

-- VIEW 2: Train_Route_Details
-- Route stops, sequential stations, arrival/departure schedules
CREATE OR REPLACE VIEW Train_Route_Details AS
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

-- VIEW 3: Passenger_Booking_Details
-- Granular passenger-level ticket allocations with seat and coach
CREATE OR REPLACE VIEW Passenger_Booking_Details AS
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

-- =====================================================================
-- STORED PROCEDURES & TRIGGERS
-- =====================================================================

DELIMITER $$

-- Procedure to calculate revenue by train
CREATE PROCEDURE GetTrainRevenue(IN p_train_id INT)
BEGIN
    SELECT 
        t.Train_Number,
        t.Train_Name,
        COUNT(b.Booking_ID) AS Total_Bookings,
        COALESCE(SUM(b.Total_Amount), 0.00) AS Total_Revenue
    FROM Train t
    LEFT JOIN Booking b ON t.Train_ID = b.Train_ID AND b.Status = 'Confirmed'
    WHERE t.Train_ID = p_train_id
    GROUP BY t.Train_ID, t.Train_Number, t.Train_Name;
END$$

-- Trigger: Automatically update seat inventory when a booking is cancelled
CREATE TRIGGER trg_after_booking_cancel
AFTER UPDATE ON Booking
FOR EACH ROW
BEGIN
    IF NEW.Status = 'Cancelled' AND OLD.Status = 'Confirmed' THEN
        UPDATE Seat_Inventory 
        SET Seat_Status = 'Available', Booking_ID = NULL 
        WHERE Booking_ID = NEW.Booking_ID;
        
        UPDATE Payment 
        SET Payment_Status = 'Refunded' 
        WHERE Booking_ID = NEW.Booking_ID;
    END IF;
END$$

DELIMITER ;
