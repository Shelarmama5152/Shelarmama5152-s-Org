import { User, Station, Train, SearchTrainResult, BookingRecord, TrainStop } from '../types';

function getAuthHeader(): Record<string, string> {
  const token = sessionStorage.getItem('railconnect_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Server request failed');
  }
  return data;
}

export const api = {
  // Auth
  async login(email: string, password: string):Promise<{ user: User; token: string }> {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(res);
  },

  async register(payload: { name: string; email: string; phone?: string; password: string; role?: string }): Promise<{ user: User; token: string }> {
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async getCurrentUser(): Promise<{ user: User }> {
    const res = await fetch('/api/me', {
      headers: getAuthHeader(),
    });
    return handleResponse(res);
  },

  async logout(): Promise<void> {
    await fetch('/api/logout', { method: 'POST', headers: getAuthHeader() });
  },

  // Stations & Trains
  async getStations(): Promise<{ stations: Station[] }> {
    const res = await fetch('/api/stations');
    return handleResponse(res);
  },

  async getTrains(): Promise<{ trains: Train[] }> {
    const res = await fetch('/api/trains');
    return handleResponse(res);
  },

  async searchTrains(params: { from: string; to: string; date?: string; class?: string; type?: string }): Promise<{
    source: Station;
    destination: Station;
    journeyDate: string;
    totalFound: number;
    trains: SearchTrainResult[];
  }> {
    const query = new URLSearchParams();
    query.set('from', params.from);
    query.set('to', params.to);
    if (params.date) query.set('date', params.date);
    if (params.class) query.set('class', params.class);
    if (params.type) query.set('type', params.type);

    const res = await fetch(`/api/trains/search?${query.toString()}`);
    return handleResponse(res);
  },

  async getTrainDetails(id: number): Promise<{ train: Train; stops: TrainStop[] }> {
    const res = await fetch(`/api/trains/${id}`);
    return handleResponse(res);
  },

  // Bookings
  async bookTicket(payload: {
    trainId: number;
    sourceStationId: number;
    destStationId: number;
    journeyDate: string;
    travelClass: string;
    passengers: Array<{ name: string; age: number; gender: string }>;
    paymentMethod: string;
  }): Promise<{
    message: string;
    bookingId: number;
    pnr: string;
    totalAmount: number;
    allocatedPassengers: any[];
  }> {
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async getBookings(userId?: number): Promise<{ bookings: BookingRecord[] }> {
    const url = userId ? `/api/bookings?userId=${userId}` : '/api/bookings';
    const res = await fetch(url, { headers: getAuthHeader() });
    return handleResponse(res);
  },

  async getBookingByPNR(pnr: string): Promise<{ booking: BookingRecord }> {
    const res = await fetch(`/api/bookings/${encodeURIComponent(pnr)}`);
    return handleResponse(res);
  },

  async cancelBooking(pnr: string): Promise<{
    message: string;
    pnr: string;
    refundAmount: number;
    cancellationStatus: string;
  }> {
    const res = await fetch(`/api/bookings/${encodeURIComponent(pnr)}/cancel`, {
      method: 'POST',
      headers: getAuthHeader(),
    });
    return handleResponse(res);
  },

  // Admin APIs
  async getAdminDashboard(): Promise<{
    stats: {
      totalUsers: number;
      totalTrains: number;
      totalBookings: number;
      confirmedBookings: number;
      cancelledBookings: number;
      totalRevenue: number;
    };
    recentBookings: any[];
  }> {
    const res = await fetch('/api/admin/dashboard', { headers: getAuthHeader() });
    return handleResponse(res);
  },

  async createTrain(train: any): Promise<any> {
    const res = await fetch('/api/admin/trains', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(train),
    });
    return handleResponse(res);
  },

  async updateTrain(id: number, train: any): Promise<any> {
    const res = await fetch(`/api/admin/trains/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(train),
    });
    return handleResponse(res);
  },

  async deleteTrain(id: number): Promise<any> {
    const res = await fetch(`/api/admin/trains/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });
    return handleResponse(res);
  },

  async createStation(station: any): Promise<any> {
    const res = await fetch('/api/admin/stations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(station),
    });
    return handleResponse(res);
  },

  async updateStation(id: number, station: any): Promise<any> {
    const res = await fetch(`/api/admin/stations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(station),
    });
    return handleResponse(res);
  },

  async deleteStation(id: number): Promise<any> {
    const res = await fetch(`/api/admin/stations/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });
    return handleResponse(res);
  },

  async getAdminBookings(filters?: { pnr?: string; status?: string; trainId?: string }): Promise<{ bookings: any[] }> {
    const q = new URLSearchParams();
    if (filters?.pnr) q.set('pnr', filters.pnr);
    if (filters?.status) q.set('status', filters.status);
    if (filters?.trainId) q.set('trainId', filters.trainId);
    const res = await fetch(`/api/admin/bookings?${q.toString()}`, { headers: getAuthHeader() });
    return handleResponse(res);
  },

  async getAdminUsers(search?: string): Promise<{ users: any[] }> {
    const url = search ? `/api/admin/users?search=${encodeURIComponent(search)}` : '/api/admin/users';
    const res = await fetch(url, { headers: getAuthHeader() });
    return handleResponse(res);
  },

  async getAdminReports(): Promise<any> {
    const res = await fetch('/api/admin/reports', { headers: getAuthHeader() });
    return handleResponse(res);
  },

  // DBMS Academic Queries & SQL Console
  async getDbmsQueries(): Promise<{ queries: any[] }> {
    const res = await fetch('/api/dbms/queries');
    return handleResponse(res);
  },

  async executeDbmsQuery(query: string): Promise<{
    success: boolean;
    executionTimeMs: number;
    rowCount: number;
    columns: string[];
    rows: any[];
    error?: string;
  }> {
    const res = await fetch('/api/dbms/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    return handleResponse(res);
  },

  async getDbmsSchema(): Promise<any> {
    const res = await fetch('/api/dbms/schema');
    return handleResponse(res);
  },
};
