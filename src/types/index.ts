export interface User {
  User_ID: number;
  Name: string;
  Email: string;
  Phone?: string;
  Role: 'Passenger' | 'Admin';
  Created_At?: string;
}

export interface Station {
  Station_ID: number;
  Station_Name: string;
  Station_Code: string;
  City: string;
}

export interface Train {
  Train_ID: number;
  Train_Number: string;
  Train_Name: string;
  Train_Type: string;
  Total_Seats: number;
  Is_Active: boolean | number;
  Total_Stops?: number;
  Origin_Station?: string;
  Origin_Code?: string;
  Terminus_Station?: string;
  Terminus_Code?: string;
}

export interface TrainStop {
  Stop_ID: number;
  Stop_Number: number;
  Arrival_Time: string | null;
  Departure_Time: string | null;
  Distance_From_Source: number;
  Station_ID: number;
  Station_Name: string;
  Station_Code: string;
  City: string;
}

export interface ClassAvailability {
  travelClass: string;
  fare: number;
  availableSeats: number;
  status: string;
}

export interface SearchTrainResult extends Train {
  Source_Stop_Num: number;
  Departure_Time: string;
  Dest_Stop_Num: number;
  Arrival_Time: string;
  Distance_Km: number;
  Source_Station_Name: string;
  Source_Station_Code: string;
  Dest_Station_Name: string;
  Dest_Station_Code: string;
  journeyDate: string;
  duration: string;
  classes: ClassAvailability[];
}

export interface PassengerInput {
  name: string;
  age: number | string;
  gender: string;
}

export interface BookingPassenger {
  Passenger_ID?: number;
  Passenger_Name: string;
  Age: number;
  Gender: string;
  Coach_Number: string;
  Seat_Number: string;
  Travel_Class: string;
}

export interface BookingRecord {
  Booking_ID: number;
  PNR: string;
  Journey_Date: string;
  Booking_Date: string;
  Total_Amount: number;
  Status: 'Confirmed' | 'Cancelled' | 'Pending';
  Train_ID?: number;
  Train_Number: string;
  Train_Name: string;
  Train_Type: string;
  Source_Station?: string;
  Source_Code?: string;
  Destination_Station?: string;
  Destination_Code?: string;
  Departure_Time?: string;
  Arrival_Time?: string;
  Passenger_Count?: number;
  Payment_Method?: string;
  Payment_Status?: string;
  Booked_By_Name?: string;
  Booked_By_Email?: string;
  Booked_By_Phone?: string;
  passengers?: BookingPassenger[];
}
