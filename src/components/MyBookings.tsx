import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { BookingRecord } from '../types';
import { generateTicketPDF } from '../utils/ticketPdf';
import { Ticket, ArrowRight, Download, Eye, AlertCircle, Loader2 } from 'lucide-react';

interface MyBookingsProps {
  onSelectPnr: (pnr: string) => void;
  onOpenAuth: () => void;
}

export const MyBookings: React.FC<MyBookingsProps> = ({ onSelectPnr, onOpenAuth }) => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'All' | 'Confirmed' | 'Cancelled'>('All');

  useEffect(() => {
    async function loadBookings() {
      try {
        setLoading(true);
        const data = await api.getBookings(user?.User_ID);
        setBookings(data.bookings);
      } catch (err) {
        console.error('Failed to load bookings:', err);
      } finally {
        setLoading(false);
      }
    }
    loadBookings();
  }, [user]);

  const filteredBookings = bookings.filter((b) => {
    if (filter === 'All') return true;
    return b.Status === filter;
  });

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-6 bg-white rounded-2xl border border-slate-200 text-center space-y-4 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-900 flex items-center justify-center mx-auto">
          <Ticket className="w-6 h-6 text-blue-900" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">
          Sign In to Access Your Bookings
        </h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          View your upcoming train journeys, track reservation status, download electronic tickets, and manage cancellations.
        </p>
        <button
          onClick={onOpenAuth}
          className="px-6 py-2.5 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-lg shadow-sm transition-colors"
        >
          Sign In / Create Account
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header and Filter Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            My Train Bookings & History
          </h2>
          <p className="text-xs text-slate-500">
            Reservations associated with {user.Email}
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
          {(['All', 'Confirmed', 'Cancelled'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                filter === tab
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin text-blue-900" />
          <span className="text-xs font-medium">Loading your reservation history...</span>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 space-y-2">
          <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
          <h4 className="text-sm font-bold text-slate-800">No Reservations Found</h4>
          <p className="text-xs">
            {filter === 'All'
              ? 'You have not made any train reservations yet.'
              : `No ${filter.toLowerCase()} reservations in your account.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((b) => (
            <div
              key={b.Booking_ID}
              className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all p-5 space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-blue-900 text-white tracking-wider">
                    PNR: {b.PNR}
                  </span>
                  <span className="text-xs font-bold text-slate-800">
                    {b.Train_Number} · {b.Train_Name}
                  </span>
                </div>

                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                    b.Status === 'Confirmed'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {b.Status}
                </span>
              </div>

              {/* Middle Journey Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                <div className="space-y-0.5">
                  <div className="text-xs text-slate-500">Departure</div>
                  <div className="font-bold text-sm text-slate-900">
                    {b.Source_Station || 'Source'} ({b.Source_Code})
                  </div>
                  <div className="text-xs text-slate-500 font-mono">
                    Time: {b.Departure_Time || '--:--'}
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                  <span className="font-mono">{b.Journey_Date}</span>
                </div>

                <div className="space-y-0.5 sm:text-right">
                  <div className="text-xs text-slate-500">Destination</div>
                  <div className="font-bold text-sm text-slate-900">
                    {b.Destination_Station || 'Destination'} ({b.Destination_Code})
                  </div>
                  <div className="text-xs text-slate-500 font-mono">
                    Time: {b.Arrival_Time || '--:--'}
                  </div>
                </div>
              </div>

              {/* Bottom Actions and Fare */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="text-slate-600">
                  <span>Passengers: <strong className="text-slate-900 font-mono">{b.Passenger_Count || 1}</strong></span>
                  <span className="mx-2">·</span>
                  <span>Total Amount: <strong className="text-orange-600 font-mono font-bold">₹{b.Total_Amount}</strong></span>
                  <span className="mx-2">·</span>
                  <span>Payment: <strong className="text-slate-800">{b.Payment_Method || 'UPI'}</strong></span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onSelectPnr(b.PNR)}
                    className="px-3 py-1.5 text-xs font-semibold text-blue-900 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center gap-1 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View PNR</span>
                  </button>
                  <button
                    onClick={async () => {
                      const full = await api.getBookingByPNR(b.PNR);
                      generateTicketPDF(full.booking);
                    }}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>PDF Slip</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
