import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Train, Station } from '../types';
import {
  Users,
  Train as TrainIcon,
  Ticket,
  CheckCircle2,
  XCircle,
  IndianRupee,
  Plus,
  Trash2,
  Edit2,
  Search,
  BarChart3,
  MapPin,
  Route,
  Loader2,
  Calendar,
  AlertCircle
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'trains' | 'stations' | 'routes' | 'bookings' | 'users' | 'reports'>('trains');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  // Entities
  const [trains, setTrains] = useState<Train[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [reports, setReports] = useState<any>(null);

  // Search and filters
  const [pnrFilter, setPnrFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [userSearch, setUserSearch] = useState('');

  // Modals for CRUD
  const [showAddTrainModal, setShowAddTrainModal] = useState(false);
  const [newTrain, setNewTrain] = useState({ trainNumber: '', trainName: '', trainType: 'Superfast', totalSeats: 500 });
  const [editingTrain, setEditingTrain] = useState<Train | null>(null);

  const [showAddStationModal, setShowAddStationModal] = useState(false);
  const [newStation, setNewStation] = useState({ stationName: '', stationCode: '', city: '' });

  // Route editor states
  const [selectedRouteTrainId, setSelectedRouteTrainId] = useState<number | null>(null);
  const [routeStops, setRouteStops] = useState<any[]>([]);
  const [newStop, setNewStop] = useState({ stationId: 1, stopNumber: 1, arrivalTime: '', departureTime: '', distanceFromSource: 0 });

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const dash = await api.getAdminDashboard();
      setStats(dash.stats);

      const [trRes, stRes, bkRes, usRes, rpRes] = await Promise.all([
        api.getTrains(),
        api.getStations(),
        api.getAdminBookings(),
        api.getAdminUsers(),
        api.getAdminReports(),
      ]);

      setTrains(trRes.trains);
      setStations(stRes.stations);
      setBookings(bkRes.bookings);
      setUsersList(usRes.users);
      setReports(rpRes);
      if (trRes.trains.length > 0 && !selectedRouteTrainId) {
        setSelectedRouteTrainId(trRes.trains[0].Train_ID);
      }
    } catch (err) {
      console.error('Failed to load admin dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Load stops when selected route train changes
  useEffect(() => {
    if (selectedRouteTrainId) {
      api.getTrainDetails(selectedRouteTrainId).then((data) => {
        setRouteStops(data.stops);
        setNewStop((prev) => ({ ...prev, stopNumber: data.stops.length + 1 }));
      }).catch(() => {});
    }
  }, [selectedRouteTrainId]);

  // Handle Add Train
  const handleAddTrain = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createTrain(newTrain);
      setShowAddTrainModal(false);
      setNewTrain({ trainNumber: '', trainName: '', trainType: 'Superfast', totalSeats: 500 });
      loadDashboardData();
    } catch (err: any) {
      alert(err.message || 'Failed to create train.');
    }
  };

  // Handle Edit Train
  const handleUpdateTrain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrain) return;
    try {
      await api.updateTrain(editingTrain.Train_ID, {
        trainNumber: editingTrain.Train_Number,
        trainName: editingTrain.Train_Name,
        trainType: editingTrain.Train_Type,
        totalSeats: editingTrain.Total_Seats,
        isActive: editingTrain.Is_Active,
      });
      setEditingTrain(null);
      loadDashboardData();
    } catch (err: any) {
      alert(err.message || 'Failed to update train.');
    }
  };

  // Handle Delete Train
  const handleDeleteTrain = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete / deactivate this train?')) return;
    try {
      await api.deleteTrain(id);
      loadDashboardData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete train.');
    }
  };

  // Handle Add Station
  const handleAddStation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createStation(newStation);
      setShowAddStationModal(false);
      setNewStation({ stationName: '', stationCode: '', city: '' });
      loadDashboardData();
    } catch (err: any) {
      alert(err.message || 'Failed to create station.');
    }
  };

  // Handle Delete Station
  const handleDeleteStation = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this station?')) return;
    try {
      await api.deleteStation(id);
      loadDashboardData();
    } catch (err: any) {
      alert(err.message || 'Cannot delete station referenced in routes.');
    }
  };

  // Handle Add Stop to Route
  const handleAddStop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRouteTrainId) return;
    try {
      const res = await fetch(`/api/admin/trains/${selectedRouteTrainId}/stops`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionStorage.getItem('railconnect_token')}`,
        },
        body: JSON.stringify(newStop),
      });
      if (!res.ok) throw new Error('Failed to add stop');
      const data = await api.getTrainDetails(selectedRouteTrainId);
      setRouteStops(data.stops);
      setNewStop((prev) => ({ ...prev, stopNumber: data.stops.length + 1 }));
    } catch (err: any) {
      alert(err.message || 'Failed to add route stop.');
    }
  };

  // Filtered Bookings
  const filteredBookings = bookings.filter((b) => {
    const matchesPnr = !pnrFilter || b.PNR.toLowerCase().includes(pnrFilter.toLowerCase());
    const matchesStatus = statusFilter === 'All' || b.Status === statusFilter;
    return matchesPnr && matchesStatus;
  });

  // Filtered Users
  const filteredUsers = usersList.filter((u) => {
    if (!userSearch) return true;
    return (
      u.Name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.Email?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.Phone?.includes(userSearch)
    );
  });

  return (
    <div className="space-y-8">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-orange-600 uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-orange-600" />
            <span>Administrative Management Console</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Railway Operations & System Control
          </h1>
        </div>

        <button
          onClick={loadDashboardData}
          className="px-4 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-sm transition-colors"
        >
          Refresh Live Data
        </button>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3.5">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase">Users</span>
            <Users className="w-4 h-4 text-blue-900" />
          </div>
          <div className="text-xl font-black text-slate-900 font-mono">
            {stats?.totalUsers || 0}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase">Trains</span>
            <TrainIcon className="w-4 h-4 text-blue-900" />
          </div>
          <div className="text-xl font-black text-slate-900 font-mono">
            {stats?.totalTrains || 0}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase">Bookings</span>
            <Ticket className="w-4 h-4 text-blue-900" />
          </div>
          <div className="text-xl font-black text-slate-900 font-mono">
            {stats?.totalBookings || 0}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-emerald-600">
            <span className="text-[11px] font-semibold uppercase">Confirmed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-xl font-black text-emerald-950 font-mono">
            {stats?.confirmedBookings || 0}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-rose-600">
            <span className="text-[11px] font-semibold uppercase">Cancelled</span>
            <XCircle className="w-4 h-4 text-rose-700" />
          </div>
          <div className="text-xl font-black text-rose-950 font-mono">
            {stats?.cancelledBookings || 0}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-orange-600">
            <span className="text-[11px] font-semibold uppercase">Revenue</span>
            <IndianRupee className="w-4 h-4 text-orange-600" />
          </div>
          <div className="text-xl font-black text-orange-950 font-mono">
            ₹{stats?.totalRevenue ? Math.round(stats.totalRevenue).toLocaleString('en-IN') : 0}
          </div>
        </div>
      </div>

      {/* Admin Module Navigation Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-6 overflow-x-auto text-xs font-semibold">
          {[
            { id: 'trains', label: 'Manage Trains', icon: TrainIcon },
            { id: 'stations', label: 'Manage Stations', icon: MapPin },
            { id: 'routes', label: 'Manage Routes', icon: Route },
            { id: 'bookings', label: 'Manage Bookings', icon: Ticket },
            { id: 'users', label: 'Manage Users', icon: Users },
            { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors ${
                  isActive
                    ? 'border-blue-900 text-blue-900'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Module Content */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin text-blue-900" />
          <span className="text-xs">Loading administration modules...</span>
        </div>
      ) : (
        <>
          {/* TAB 1: MANAGE TRAINS */}
          {activeTab === 'trains' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Train Inventory Catalog ({trains.length} Trains)
                </h3>
                <button
                  onClick={() => setShowAddTrainModal(true)}
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add New Train</span>
                </button>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Train No.</th>
                      <th className="py-3 px-4">Train Name</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Route Corridors</th>
                      <th className="py-3 px-4">Capacity</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {trains.map((t) => (
                      <tr key={t.Train_ID} className="hover:bg-slate-50/60">
                        <td className="py-3 px-4 font-mono font-bold text-blue-900">
                          {t.Train_Number}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {t.Train_Name}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-600">
                          {t.Train_Type}
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-mono">
                          {t.Origin_Code || 'SRC'} → {t.Terminus_Code || 'DEST'} ({t.Total_Stops || 0} stops)
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold text-slate-700">
                          {t.Total_Seats} Seats
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              t.Is_Active
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {t.Is_Active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <button
                            onClick={() => setEditingTrain(t)}
                            title="Edit Train"
                            className="p-1 text-slate-500 hover:text-blue-900 hover:bg-slate-100 rounded"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteTrain(t.Train_ID)}
                            title="Delete / Deactivate Train"
                            className="p-1 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: MANAGE STATIONS */}
          {activeTab === 'stations' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Railway Stations Catalog ({stations.length} Stations)
                </h3>
                <button
                  onClick={() => setShowAddStationModal(true)}
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add New Station</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {stations.map((s) => (
                  <div
                    key={s.Station_ID}
                    className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-blue-900 px-2 py-0.5 rounded bg-blue-50 border border-blue-200">
                          {s.Station_Code}
                        </span>
                        <h4 className="font-bold text-sm text-slate-900">{s.Station_Name}</h4>
                      </div>
                      <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{s.City}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteStation(s.Station_ID)}
                      title="Delete Station"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: MANAGE ROUTES */}
          {activeTab === 'routes' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Train Route Stops & Schedules
                  </h3>
                  <p className="text-xs text-slate-500">
                    Select a train to view or add sequential station stops and distances
                  </p>
                </div>

                <select
                  value={selectedRouteTrainId || ''}
                  onChange={(e) => setSelectedRouteTrainId(Number(e.target.value))}
                  className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-bold text-blue-900"
                >
                  {trains.map((t) => (
                    <option key={t.Train_ID} value={t.Train_ID}>
                      {t.Train_Number} - {t.Train_Name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Stops list */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Stop #</th>
                      <th className="py-3 px-4">Station</th>
                      <th className="py-3 px-4">Code</th>
                      <th className="py-3 px-4">Arrival</th>
                      <th className="py-3 px-4">Departure</th>
                      <th className="py-3 px-4">Distance (km)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {routeStops.map((st) => (
                      <tr key={st.Stop_ID} className="hover:bg-slate-50/60">
                        <td className="py-2.5 px-4 font-bold text-blue-900">#{st.Stop_Number}</td>
                        <td className="py-2.5 px-4 font-sans font-bold text-slate-900">{st.Station_Name}</td>
                        <td className="py-2.5 px-4 text-slate-600">{st.Station_Code}</td>
                        <td className="py-2.5 px-4 text-slate-700">{st.Arrival_Time || 'Source'}</td>
                        <td className="py-2.5 px-4 text-slate-700">{st.Departure_Time || 'Terminus'}</td>
                        <td className="py-2.5 px-4 font-bold text-slate-900">{st.Distance_From_Source} km</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Add Stop Form */}
              <form onSubmit={handleAddStop} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Append New Intermediate Station to Route
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600">Station</label>
                    <select
                      value={newStop.stationId}
                      onChange={(e) => setNewStop({ ...newStop, stationId: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded"
                    >
                      {stations.map((s) => (
                        <option key={s.Station_ID} value={s.Station_ID}>
                          {s.Station_Name} ({s.Station_Code})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600">Stop Sequence</label>
                    <input
                      type="number"
                      value={newStop.stopNumber}
                      onChange={(e) => setNewStop({ ...newStop, stopNumber: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600">Arrival Time</label>
                    <input
                      type="text"
                      placeholder="e.g. 14:30"
                      value={newStop.arrivalTime}
                      onChange={(e) => setNewStop({ ...newStop, arrivalTime: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600">Departure Time</label>
                    <input
                      type="text"
                      placeholder="e.g. 14:35"
                      value={newStop.departureTime}
                      onChange={(e) => setNewStop({ ...newStop, departureTime: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600">Distance (km)</label>
                    <input
                      type="number"
                      value={newStop.distanceFromSource}
                      onChange={(e) => setNewStop({ ...newStop, distanceFromSource: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-lg shadow-sm"
                >
                  Add Stop to Route
                </button>
              </form>
            </div>
          )}

          {/* TAB 4: MANAGE BOOKINGS */}
          {activeTab === 'bookings' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  System Reservations Ledger ({filteredBookings.length} Bookings)
                </h3>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search PNR..."
                      value={pnrFilter}
                      onChange={(e) => setPnrFilter(e.target.value)}
                      className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 font-mono"
                    />
                  </div>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-700 font-medium"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">PNR</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Train</th>
                      <th className="py-3 px-4">Route</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Cancel Override</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredBookings.slice(0, 50).map((b) => (
                      <tr key={b.Booking_ID} className="hover:bg-slate-50/60">
                        <td className="py-2.5 px-4 font-mono font-bold text-blue-900">{b.PNR}</td>
                        <td className="py-2.5 px-4">
                          <div className="font-bold text-slate-900">{b.Customer_Name}</div>
                          <div className="text-[11px] text-slate-400">{b.Customer_Email}</div>
                        </td>
                        <td className="py-2.5 px-4 font-semibold text-slate-700">{b.Train_Number}</td>
                        <td className="py-2.5 px-4 font-mono text-slate-600">{b.Source_Code} → {b.Dest_Code}</td>
                        <td className="py-2.5 px-4 font-mono text-slate-600">{b.Journey_Date}</td>
                        <td className="py-2.5 px-4 font-mono font-bold text-slate-900">₹{b.Total_Amount}</td>
                        <td className="py-2.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            b.Status === 'Confirmed' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {b.Status}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          {b.Status === 'Confirmed' && (
                            <button
                              onClick={async () => {
                                if (window.confirm(`Cancel booking ${b.PNR}?`)) {
                                  await api.cancelBooking(b.PNR);
                                  loadDashboardData();
                                }
                              }}
                              className="text-[11px] font-bold text-rose-600 hover:text-rose-800 underline"
                            >
                              Cancel
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: MANAGE USERS */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Registered Passenger & Admin Accounts ({filteredUsers.length} Users)
                </h3>
                <input
                  type="text"
                  placeholder="Search users..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900"
                />
              </div>

              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4"># ID</th>
                      <th className="py-3 px-4">Name</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Phone</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4 font-mono">Bookings Count</th>
                      <th className="py-3 px-4 font-mono">Total Spend</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.slice(0, 50).map((u) => (
                      <tr key={u.User_ID} className="hover:bg-slate-50/60">
                        <td className="py-2.5 px-4 font-mono text-slate-400">#{u.User_ID}</td>
                        <td className="py-2.5 px-4 font-bold text-slate-900">{u.Name}</td>
                        <td className="py-2.5 px-4 text-slate-600">{u.Email}</td>
                        <td className="py-2.5 px-4 text-slate-500 font-mono">{u.Phone || 'N/A'}</td>
                        <td className="py-2.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            u.Role === 'Admin' ? 'bg-orange-100 text-orange-900' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {u.Role}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 font-mono font-bold text-slate-900">{u.Total_Bookings}</td>
                        <td className="py-2.5 px-4 font-mono font-bold text-emerald-700">₹{u.Total_Spent}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: REPORTS & ANALYTICS */}
          {activeTab === 'reports' && reports && (
            <div className="space-y-6">
              
              {/* Train-wise revenue breakdown */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-sm">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Train-wise Bookings & Revenue Analysis (GROUP BY, SUM, COUNT)
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Train</th>
                        <th className="py-2.5 px-3">Type</th>
                        <th className="py-2.5 px-3">Total Reservations</th>
                        <th className="py-2.5 px-3">Confirmed</th>
                        <th className="py-2.5 px-3">Cancelled</th>
                        <th className="py-2.5 px-3 text-right">Total Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {reports.trainWise?.map((tw: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-sans font-bold text-slate-900">{tw.Train_Number} - {tw.Train_Name}</td>
                          <td className="py-2 px-3 font-sans text-slate-600">{tw.Train_Type}</td>
                          <td className="py-2 px-3 font-bold text-blue-900">{tw.Total_Bookings}</td>
                          <td className="py-2 px-3 text-emerald-700">{tw.Confirmed_Count}</td>
                          <td className="py-2 px-3 text-rose-700">{tw.Cancelled_Count}</td>
                          <td className="py-2 px-3 text-right font-bold text-orange-600">₹{tw.Revenue}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Class Popularity Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3 shadow-sm">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Travel Class Passenger Preferences
                  </h4>
                  <div className="space-y-2">
                    {reports.classPopularity?.map((cp: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg text-xs">
                        <span className="font-bold text-blue-900 font-mono">Class {cp.Travel_Class}</span>
                        <div className="flex items-center gap-4 text-slate-600 font-mono">
                          <span>{cp.Total_Tickets} Tickets Booked</span>
                          <span>Avg Age: {cp.Average_Age}y</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3 shadow-sm">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Daily Reservation Trends
                  </h4>
                  <div className="space-y-2">
                    {reports.dateWise?.map((dw: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg text-xs font-mono">
                        <span className="text-slate-800 font-semibold">{dw.Journey_Date}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-blue-900 font-bold">{dw.Booking_Count} trips</span>
                          <span className="text-orange-600 font-bold">₹{dw.Daily_Revenue}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          )}
        </>
      )}

      {/* Add Train Modal */}
      {showAddTrainModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900">Add New Train</h3>
              <button onClick={() => setShowAddTrainModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleAddTrain} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Train Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 12952"
                  value={newTrain.trainNumber}
                  onChange={(e) => setNewTrain({ ...newTrain, trainNumber: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Train Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mumbai - Delhi Express"
                  value={newTrain.trainName}
                  onChange={(e) => setNewTrain({ ...newTrain, trainName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Train Type</label>
                <select
                  value={newTrain.trainType}
                  onChange={(e) => setNewTrain({ ...newTrain, trainType: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded"
                >
                  <option value="Superfast">Superfast</option>
                  <option value="Rajdhani">Rajdhani</option>
                  <option value="Vande Bharat">Vande Bharat</option>
                  <option value="Shatabdi">Shatabdi</option>
                  <option value="Express">Express</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Total Seats Capacity</label>
                <input
                  type="number"
                  value={newTrain.totalSeats}
                  onChange={(e) => setNewTrain({ ...newTrain, totalSeats: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded font-mono"
                />
              </div>
              <button type="submit" className="w-full py-2.5 font-bold text-white bg-blue-900 rounded-lg hover:bg-blue-800">
                Save Train
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Train Modal */}
      {editingTrain && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900">Edit Train #{editingTrain.Train_Number}</h3>
              <button onClick={() => setEditingTrain(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleUpdateTrain} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Train Name</label>
                <input
                  type="text"
                  required
                  value={editingTrain.Train_Name}
                  onChange={(e) => setEditingTrain({ ...editingTrain, Train_Name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Train Type</label>
                <select
                  value={editingTrain.Train_Type}
                  onChange={(e) => setEditingTrain({ ...editingTrain, Train_Type: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded"
                >
                  <option value="Superfast">Superfast</option>
                  <option value="Rajdhani">Rajdhani</option>
                  <option value="Vande Bharat">Vande Bharat</option>
                  <option value="Shatabdi">Shatabdi</option>
                  <option value="Express">Express</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Total Seats</label>
                <input
                  type="number"
                  value={editingTrain.Total_Seats}
                  onChange={(e) => setEditingTrain({ ...editingTrain, Total_Seats: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded font-mono"
                />
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={!!editingTrain.Is_Active}
                  onChange={(e) => setEditingTrain({ ...editingTrain, Is_Active: e.target.checked ? 1 : 0 })}
                  className="rounded"
                />
                <label htmlFor="isActiveToggle" className="font-semibold text-slate-700">Train Is Active</label>
              </div>
              <button type="submit" className="w-full py-2.5 font-bold text-white bg-blue-900 rounded-lg hover:bg-blue-800">
                Update Train
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Station Modal */}
      {showAddStationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900">Add New Railway Station</h3>
              <button onClick={() => setShowAddStationModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleAddStation} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Station Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lucknow Junction"
                  value={newStation.stationName}
                  onChange={(e) => setNewStation({ ...newStation, stationName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Station Code (IR Official)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. LJN"
                  value={newStation.stationCode}
                  onChange={(e) => setNewStation({ ...newStation, stationCode: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded font-mono uppercase"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">City</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lucknow"
                  value={newStation.city}
                  onChange={(e) => setNewStation({ ...newStation, city: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded"
                />
              </div>
              <button type="submit" className="w-full py-2.5 font-bold text-white bg-blue-900 rounded-lg hover:bg-blue-800">
                Save Station
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
