const API_BASE_URL = '/api';

export interface EnvStats {
    ts: number;
    green_ratio: number;
    baseline_green_ratio: number;
    cover_change_pct: number;
    tree_alert: number;
    excavation_count: number;
    activity_count: number;
    payload: string;
}

export interface WaterReading {
    ts: number;
    ph: number;
    turbidity_ntu: number;
    temperature_c: number;
    alerts: string;
    recommendations: string;
}

export interface FiltrationStatus {
    ts: number;
    state: string;
    telemetry: {
        net_load_pct: number;
        bottle_clog_pct: number;
        flow_lpm: number;
    };
    actuators: {
        gears_active: boolean;
        backwash_on: boolean;
        pump_active: boolean;
    };
    last_action: {
        type: string;
        ts: number;
    };
}

export interface SystemHealth {
    score: number;
    status: 'EXCELLENT' | 'GOOD' | 'WARNING' | 'CRITICAL';
    reasons: string[];
}

export interface EnergyStats {
    day: string;
    energy_kwh: number;
    avg_power_w: number;
    samples: number;
}

export interface DistributionEvent {
    ts: number;
    home: string;
    path: string;
    cost: number;
    volume_liters: number;
}

export interface DistributionHistory {
    day: string;
    total_volume_liters: number;
}

export interface DashboardData {
    env: EnvStats | null;
    water: WaterReading | null;
    filtration: FiltrationStatus | null;
    energy: EnergyStats | null;
    health: SystemHealth | null;
    distribution?: DistributionEvent[];
}


const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('token');
    const headers = {
        ...options.headers,
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
    return fetch(url, { ...options, headers });
};

export const fetchLatestStats = async (): Promise<DashboardData> => {
    const response = await fetchWithAuth(`${API_BASE_URL}/latest-stats`);
    if (!response.ok) throw new Error('Failed to fetch stats');
    return response.json();
};

export const fetchHistory = async () => {
    const response = await fetchWithAuth(`${API_BASE_URL}/history`);
    if (!response.ok) throw new Error('Failed to fetch history');
    return response.json();
};

export const fetchEnergyHistory = async () => {
    const response = await fetchWithAuth(`${API_BASE_URL}/energy-history`);
    if (!response.ok) throw new Error('Failed to fetch energy history');
    return response.json();
};

export const fetchDistributionLatest = async (): Promise<DistributionEvent[]> => {
    const response = await fetchWithAuth(`${API_BASE_URL}/distribution/latest`);
    if (!response.ok) throw new Error('Failed to fetch distribution status');
    return response.json();
};

export const fetchDistributionHistory = async (): Promise<DistributionHistory[]> => {
    const response = await fetchWithAuth(`${API_BASE_URL}/distribution/history`);
    if (!response.ok) throw new Error('Failed to fetch distribution history');
    return response.json();
};

export const systemControl = async (action: string): Promise<any> => {
    const response = await fetchWithAuth(`${API_BASE_URL}/control/${action}`, { method: 'POST' });
    if (!response.ok) throw new Error('Control action failed');
    return response.json();
};

export const fetchForecast = async (): Promise<any> => {
    const response = await fetchWithAuth(`${API_BASE_URL}/forecast`);
    if (!response.ok) throw new Error('Forecast fetch failed');
    return response.json();
};

