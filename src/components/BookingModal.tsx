import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { api } from '../services/api';
import { SearchTrainResult, ClassAvailability, PassengerInput } from '../types';
import { generateTicketPDF } from '../utils/ticketPdf';
import { X, UserPlus, Trash2, ShieldCheck, CheckCircle2, Download, Printer, ArrowRight, Loader2, CreditCard } from 'lucide-react';

interface BookingModalProps {
  train: SearchTrainResult;
  selectedClass: ClassAvailability;
  onClose: () => void;
  onBookingComplete: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({ train, selectedClass, onClose, onBookingComplete }) => {
  const [passengers, setPassengers] = useState<PassengerInput[]>([
    { name: '', age: '', gender: 'Male' },
  ]);
  const [paymentMethod, setPaymentMethod] = useState<string>('UPI');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Confirmed booking state
  const [confirmedBooking, setConfirmedBooking] = useState<any | null>(null);

  const addPassenger = () => {
    if (passengers.length >= 6) return;
    setPassengers([...passengers, { name: '', age: '', gender: 'Male' }]);
  };

  const removePassenger = (index: number) => {
    if (passengers.length === 1) return;
    setPassengers(passengers.filter((_, i) => i !== index));
  };

  const updatePassenger = (index: number, field: keyof PassengerInput, value: string) => {
    const updated = [...passengers];
    updated[index] = { ...updated[index], [field]: value };
    setPassengers(updated);
  };

  const baseFare = selectedClass.fare * passengers.length;
  const reservationCharge = 40;
  const superfastCharge = 45;
  const totalFare = baseFare + reservationCharge + superfastCharge;

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    for (let i = 0; i < passengers.length; i++) {
      const p = passengers[i];
      if (!p.name.trim()) {
        setError(`Passenger #${i + 1} name is required.`);
        return;
      }
      const ageNum = parseInt(String(p.age), 10);
      if (isNaN(ageNum) || ageNum <= 0 || ageNum > 120) {
        setError(`Please enter a valid age (1-120) for Passenger #${i + 1}.`);
        return;
      }
    }

    try {
      setSubmitting(true);
      const res = await api.bookTicket({
        trainId: train.Train_ID,
        sourceStationId: (train as any).Source_Stop_Num ? 1 : 1, // Will be mapped or resolved by backend
        destStationId: 10,
        journeyDate: train.journeyDate,
        travelClass: selectedClass.travelClass,
        passengers: passengers.map(p => ({
          name: p.name.trim(),
          age: Number(p.age),
          gender: p.gender,
        })),
        paymentMethod,
      });

      // Fire celebratory confetti!
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}

      // Retrieve full booking for PDF generation
      const fullBookingData = await api.getBookingByPNR(res.pnr);
      setConfirmedBooking(fullBookingData.booking);
    } catch (err: any) {
      console.error('Booking failed:', err);
      setError(err.message || 'Ticket reservation transaction failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {confirmedBooking ? 'Reservation Confirmed' : 'Passenger Details & Reservation'}
            </span>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">
              {train.Train_Number} · {train.Train_Name}
            </h3>
          </div>
          <button
            onClick={() => {
              if (confirmedBooking) onBookingComplete();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {confirmedBooking ? (
            /* Booking Confirmation View */
            <div className="space-y-6 animate-in zoom-in-95">
              <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h4 className="text-lg font-bold text-emerald-950">
                  Booking Confirmed Successfully!
                </h4>
                <p className="text-xs text-emerald-800">
                  Your ticket has been booked and seats have been allocated under an ACID database transaction.
                </p>
                <div className="pt-2">
                  <span className="text-xs text-emerald-700 uppercase tracking-wider font-semibold">Generated PNR</span>
                  <div className="text-2xl font-black text-emerald-950 font-mono tracking-wider">
                    {confirmedBooking.PNR}
                  </div>
                </div>
              </div>

              {/* Ticket Details Summary */}
              <div className="rounded-xl border border-slate-200 p-4 space-y-3 bg-slate-50">
                <div className="flex items-center justify-between text-xs text-slate-500 font-mono pb-2 border-b border-slate-200">
                  <span>Class: <strong className="text-slate-800">{selectedClass.travelClass}</strong></span>
                  <span>Journey: <strong className="text-slate-800">{confirmedBooking.Journey_Date}</strong></span>
                  <span>Total Fare: <strong className="text-orange-600 font-bold">₹{confirmedBooking.Total_Amount}</strong></span>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Allocated Seats & Coaches
                  </div>
                  <div className="space-y-1.5">
                    {confirmedBooking.passengers?.map((p: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-200 text-xs">
                        <span className="font-semibold text-slate-900">
                          {idx + 1}. {p.Passenger_Name} ({p.Age}y, {p.Gender})
                        </span>
                        <span className="font-mono font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          Coach {p.Coach_Number} · Seat {p.Seat_Number}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => generateTicketPDF(confirmedBooking)}
                  className="flex-1 px-4 py-2.5 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-lg shadow-sm flex items-center justify-center gap-2 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Ticket as PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Ticket</span>
                </button>
              </div>
            </div>
          ) : (
            /* Passenger Entry & Payment Form */
            <form onSubmit={handleConfirmBooking} className="space-y-6">
              
              {/* Trip Summary Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Journey Details
                  </div>
                  <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span>{train.Source_Station_Name}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    <span>{train.Dest_Station_Name}</span>
                  </div>
                  <div className="text-xs text-slate-500 font-mono">
                    Date: {train.journeyDate} · Class: {selectedClass.travelClass}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-slate-500">Base Fare / Passenger</div>
                  <div className="text-lg font-extrabold text-slate-900 font-mono">
                    ₹{selectedClass.fare}
                  </div>
                </div>
              </div>

              {/* Error Banner */}
              {error && (
                <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
                  {error}
                </div>
              )}

              {/* Passengers Form */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Passenger Information ({passengers.length}/6)
                  </h4>
                  {passengers.length < 6 && (
                    <button
                      type="button"
                      onClick={addPassenger}
                      className="text-xs text-blue-900 hover:text-blue-700 font-semibold flex items-center gap-1"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Add Passenger</span>
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {passengers.map((p, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-slate-200 bg-white grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
                    >
                      <div className="sm:col-span-6 space-y-1">
                        <label className="block text-[11px] font-semibold text-slate-600">
                          Passenger {idx + 1} Full Name
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Ramesh Kumar"
                          value={p.name}
                          onChange={(e) => updatePassenger(idx, 'name', e.target.value)}
                          className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-blue-900 text-slate-900"
                        />
                      </div>

                      <div className="sm:col-span-2 space-y-1">
                        <label className="block text-[11px] font-semibold text-slate-600">
                          Age
                        </label>
                        <input
                          type="number"
                          required
                          min={1}
                          max={120}
                          placeholder="Age"
                          value={p.age}
                          onChange={(e) => updatePassenger(idx, 'age', e.target.value)}
                          className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-blue-900 text-slate-900"
                        />
                      </div>

                      <div className="sm:col-span-3 space-y-1">
                        <label className="block text-[11px] font-semibold text-slate-600">
                          Gender
                        </label>
                        <select
                          value={p.gender}
                          onChange={(e) => updatePassenger(idx, 'gender', e.target.value)}
                          className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-blue-900 text-slate-900"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Transgender">Other</option>
                        </select>
                      </div>

                      <div className="sm:col-span-1 flex items-center justify-end pt-4 sm:pt-0">
                        {passengers.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removePassenger(idx)}
                            title="Remove Passenger"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Method & Simulated Gateway */}
              <div className="space-y-3 pt-2">
                <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Payment Method (Academic Simulation)
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {['UPI', 'NetBanking', 'CreditCard'].map((method) => (
                    <label
                      key={method}
                      className={`p-3 rounded-lg border text-center cursor-pointer transition-all ${
                        paymentMethod === method
                          ? 'border-blue-900 bg-blue-50/70 text-blue-900 font-bold shadow-sm'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value={method}
                        checked={paymentMethod === method}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="sr-only"
                      />
                      <CreditCard className="w-4 h-4 mx-auto mb-1 text-slate-500" />
                      <span className="text-xs">{method}</span>
                    </label>
                  ))}
                </div>

                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800 leading-relaxed">
                  <strong>Notice:</strong> This is an academic DBMS mini-project simulation. No real money or bank details are requested. Clicking "Confirm Booking & Pay" executes an atomic transaction in the database.
                </div>
              </div>

              {/* Fare Breakdown */}
              <div className="rounded-xl border border-slate-200 p-4 space-y-2 bg-slate-50 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Base Ticket Fare ({passengers.length} × ₹{selectedClass.fare})</span>
                  <span className="font-mono">₹{baseFare.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Reservation Charge</span>
                  <span className="font-mono">₹{reservationCharge.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Superfast Charge</span>
                  <span className="font-mono">₹{superfastCharge.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total Amount Payable</span>
                  <span className="font-mono text-orange-600">₹{totalFare.toFixed(2)}</span>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 text-xs font-bold text-white bg-orange-600 hover:bg-orange-500 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Executing Database Transaction...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Confirm Booking & Pay (₹{totalFare.toFixed(2)})</span>
                  </>
                )}
              </button>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};
