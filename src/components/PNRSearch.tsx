import React, { useState } from 'react';
import { api } from '../services/api';
import { BookingRecord } from '../types';
import { generateTicketPDF } from '../utils/ticketPdf';
import { Search, Download, AlertCircle, CheckCircle2, XCircle, Clock, Loader2, ArrowRight } from 'lucide-react';

interface PNRSearchProps {
  initialPnr?: string;
}

export const PNRSearch: React.FC<PNRSearchProps> = ({ initialPnr = '' }) => {
  const [pnrInput, setPnrInput] = useState(initialPnr);
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState<BookingRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelFeedback, setCancelFeedback] = useState<string | null>(null);

  const handleLookup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pnrInput.trim()) return;

    setError(null);
    setCancelFeedback(null);
    setLoading(true);

    try {
      const data = await api.getBookingByPNR(pnrInput.trim());
      setBooking(data.booking);
    } catch (err: any) {
      setBooking(null);
      setError(err.message || 'No reservation found for this PNR.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!booking) return;
    const confirm = window.confirm(
      `Are you sure you want to cancel booking PNR ${booking.PNR}? This will release the allocated seats back to inventory and issue a 90% simulated refund.`
    );
    if (!confirm) return;

    setCancelling(true);
    setError(null);
    try {
      const res = await api.cancelBooking(booking.PNR);
      setCancelFeedback(
        `Ticket successfully cancelled. Simulated refund of ₹${res.refundAmount} has been credited to your account.`
      );
      // Refresh booking details
      const refreshed = await api.getBookingByPNR(booking.PNR);
      setBooking(refreshed.booking);
    } catch (err: any) {
      setError(err.message || 'Failed to cancel reservation.');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      
      {/* Search Header Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Passenger Name Record (PNR) Status Enquiry
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Enter your 10-digit Indian Railways PNR number to check current reservation status, coach/berth allocation, or cancel ticket.
          </p>
        </div>

        <form onSubmit={handleLookup} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Enter 10-digit PNR (e.g., 842-1007919)"
              value={pnrInput}
              onChange={(e) => setPnrInput(e.target.value)}
              className="w-full px-4 py-3 text-sm font-mono font-medium bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-blue-900 text-slate-900"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-lg shadow-sm hover:shadow transition-colors flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span>Check PNR Status</span>
          </button>
        </form>

        {/* Quick Sample PNR helper for student evaluation */}
        <div className="flex items-center gap-2 text-xs text-slate-500 pt-1">
          <span className="font-semibold text-slate-700">Sample Pre-seeded PNRs:</span>
          {['842-1007919', '842-1015838', '842-1023757'].map((demoPnr) => (
            <button
              key={demoPnr}
              type="button"
              onClick={() => {
                setPnrInput(demoPnr);
                api.getBookingByPNR(demoPnr).then((data) => setBooking(data.booking)).catch(() => {});
              }}
              className="font-mono text-blue-900 hover:underline font-semibold"
            >
              {demoPnr}
            </button>
          ))}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Success Cancellation Notice */}
      {cancelFeedback && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{cancelFeedback}</span>
        </div>
      )}

      {/* Booking Details Card */}
      {booking && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-6">
          
          {/* Status Header */}
          <div className="p-6 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                PNR Reservation Slip
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono mt-0.5 tracking-wider">
                {booking.PNR}
              </div>
            </div>

            {/* Visual Status Indicator */}
            <div className="flex items-center gap-3">
              <div
                className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                  booking.Status === 'Confirmed'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : booking.Status === 'Cancelled'
                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}
              >
                {booking.Status === 'Confirmed' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                ) : booking.Status === 'Cancelled' ? (
                  <XCircle className="w-4 h-4 text-rose-700" />
                ) : (
                  <Clock className="w-4 h-4 text-amber-700" />
                )}
                <span>{booking.Status.toUpperCase()}</span>
              </div>

              <button
                type="button"
                onClick={() => generateTicketPDF(booking)}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            
            {/* Train & Journey Route */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 rounded-xl bg-slate-50 border border-slate-200 items-center">
              <div>
                <div className="text-xs text-slate-500 font-mono font-bold text-blue-900">
                  {booking.Train_Number} · {booking.Train_Type}
                </div>
                <div className="text-base font-bold text-slate-900 mt-0.5">
                  {booking.Train_Name}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Journey Date: <strong className="text-slate-800 font-mono">{booking.Journey_Date}</strong>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 text-center">
                <div>
                  <div className="font-bold text-sm text-slate-900 font-mono">
                    {booking.Departure_Time || '--:--'}
                  </div>
                  <div className="text-xs text-slate-600 font-medium">
                    {booking.Source_Station} ({booking.Source_Code})
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <div className="font-bold text-sm text-slate-900 font-mono">
                    {booking.Arrival_Time || '--:--'}
                  </div>
                  <div className="text-xs text-slate-600 font-medium">
                    {booking.Destination_Station} ({booking.Destination_Code})
                  </div>
                </div>
              </div>

              <div className="md:text-right space-y-1">
                <div className="text-xs text-slate-500">Booked By</div>
                <div className="text-xs font-semibold text-slate-800">
                  {booking.Booked_By_Name || 'Passenger'}
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  {booking.Booked_By_Email}
                </div>
              </div>
            </div>

            {/* Passenger List Table */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Passenger Allocation & Seating Details
              </h3>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-4">#</th>
                      <th className="py-2.5 px-4">Passenger Name</th>
                      <th className="py-2.5 px-4">Age / Gender</th>
                      <th className="py-2.5 px-4">Class</th>
                      <th className="py-2.5 px-4">Coach</th>
                      <th className="py-2.5 px-4">Seat / Berth</th>
                      <th className="py-2.5 px-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {booking.passengers?.map((p, index) => (
                      <tr key={index} className="hover:bg-slate-50/60">
                        <td className="py-3 px-4 font-mono font-bold text-slate-400">{index + 1}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{p.Passenger_Name}</td>
                        <td className="py-3 px-4 text-slate-600">{p.Age} yrs · {p.Gender}</td>
                        <td className="py-3 px-4 font-mono font-semibold text-blue-900">{p.Travel_Class}</td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">{p.Coach_Number}</td>
                        <td className="py-3 px-4 font-mono font-bold text-orange-600">{p.Seat_Number}</td>
                        <td className="py-3 px-4 text-right">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            booking.Status === 'Confirmed' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {booking.Status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Payment & Cancellation Footer */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-0.5 text-xs">
                <div className="text-slate-500">
                  Total Fare: <strong className="text-slate-900 font-mono text-sm">₹{booking.Total_Amount}</strong>
                  <span className="mx-2">·</span>
                  Method: <strong className="text-slate-700">{booking.Payment_Method || 'UPI'}</strong>
                  <span className="mx-2">·</span>
                  Status: <strong className="text-emerald-700">{booking.Payment_Status || 'Success'}</strong>
                </div>
              </div>

              {booking.Status === 'Confirmed' && (
                <button
                  type="button"
                  disabled={cancelling}
                  onClick={handleCancelBooking}
                  className="px-4 py-2 text-xs font-bold text-rose-700 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-300 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {cancelling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                  <span>Cancel Ticket & Refund</span>
                </button>
              )}
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
