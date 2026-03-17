// ASAASE Robot Control System API Client

const API_BASE = '/api/asaase';

export interface RobotStatus {
  ground: {
    online: boolean;
    battery_pct: number;
    last_seen: number;
  };
  aqua: {
    online: boolean;
    battery_pct: number;
    last_seen: number;
  };
  alert_count_24h: number;
  critical_count_24h: number;
}

export type ControlMode = 'MANUAL' | 'SEMI_AUTO' | 'FULLY_AUTO';

export interface RobotSettings {
  robot_id: string;
  control_mode: ControlMode;
  last_command?: string;
  last_command_ts?: number;
  pending_action?: string;
  pending_action_ts?: number;
}

export interface BaseSettings {
  operation_mode: ControlMode;
}

export interface PendingApproval {
  id: number;
  robot_id: string;
  action_type: string;
  severity: string;
  lat: number;
  lon: number;
  created_at: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
}


export interface GroundTelemetry {

  id: number;
  ts: number;
  robot_id: string;
  gps_lat: number;
  gps_lon: number;
  soil_classification: 'CLEAN' | 'MODERATE' | 'CRITICAL';
  confidence_score: number;
  dispenser_action: 'NONE' | 'SEEDS_ONLY' | 'BIOCHAR_AND_SEEDS';
  battery_pct: number;
  patrol_waypoint_index: number;
}

export interface AquaTelemetry {
  id: number;
  ts: number;
  robot_id: string;
  gps_lat: number;
  gps_lon: number;
  turbidity_ntu: number;
  ph_value: number;
  camera_water_classification: 'CLEAN' | 'MODERATE' | 'CRITICAL';
  dual_stream_verdict: 'CLEAN' | 'MODERATE' | 'CRITICAL';
  neutralizer_dispensed_ml: number;
  dye_marker_dropped: boolean;
  battery_pct: number;
}

export interface AsaaseAlert {
  id: number;
  ts: number;
  robot_id: string;
  severity: 'MODERATE' | 'CRITICAL';
  gps_lat: number;
  gps_lon: number;
  alert_type: 'SOIL' | 'WATER' | 'ROBOT_OFFLINE';
  sms_sent: number;
  report_generated: number;
  message: string;
}

export interface RemediationReport {
  id: number;
  alert_id: number;
  generated_at: number;
  report_en: string; // JSON string
  report_tw: string; // JSON string
  exported: number;
}

const getAuthHeader = (): { Authorization?: string } => {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export const fetchAsaaseStatus = async (): Promise<RobotStatus> => {
  const res = await fetch(`${API_BASE}/status`);
  return res.json();
};

export const fetchGroundLatest = async (): Promise<GroundTelemetry[]> => {
  const res = await fetch(`${API_BASE}/ground/latest`);
  return res.json();
};

export const fetchAquaLatest = async (): Promise<AquaTelemetry[]> => {
  const res = await fetch(`${API_BASE}/aqua/latest`);
  return res.json();
};

export const fetchGroundHeatmap = async (): Promise<any> => {
  const res = await fetch(`${API_BASE}/ground/heatmap`);
  return res.json();
};

export const fetchAquaHeatmap = async (): Promise<any> => {
  const res = await fetch(`${API_BASE}/aqua/heatmap`);
  return res.json();
};

export const fetchAsaaseAlerts = async (page = 1, limit = 10): Promise<AsaaseAlert[]> => {
  const res = await fetch(`${API_BASE}/alerts?page=${page}&limit=${limit}`);
  return res.json();
};

export const fetchReport = async (alertId: number): Promise<RemediationReport> => {
  const res = await fetch(`${API_BASE}/reports/${alertId}`);
  if (!res.ok) throw new Error('Report not found');
  return res.json();
};

export const uploadGroundWaypoints = async (robot_id: string, waypoints: {lat: number, lon: number}[]) => {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  const auth = getAuthHeader();
  if (auth.Authorization) {
    (headers as any).Authorization = auth.Authorization;
  }

  const res = await fetch(`${API_BASE}/ground/waypoints`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ robot_id, waypoints })
  });
  return res.json();
};

export const uploadAquaRoute = async (robot_id: string, waypoints: {lat: number, lon: number}[]) => {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  const auth = getAuthHeader();
  if (auth.Authorization) {
    (headers as any).Authorization = auth.Authorization;
  }

  const res = await fetch(`${API_BASE}/aqua/route`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ robot_id, waypoints })
  });
  return res.json();
};

export const fetchControlSettings = async (robotId: string): Promise<RobotSettings> => {
  const res = await fetch(`${API_BASE}/control/settings/${robotId}`);
  return res.json();
};

export const updateControlMode = async (robot_id: string, mode: ControlMode) => {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  const auth = getAuthHeader();
  if (auth.Authorization) {
    (headers as any).Authorization = auth.Authorization;
  }
  const res = await fetch(`${API_BASE}/control/mode`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ robot_id, mode })
  });
  return res.json();
};

export const sendManualCommand = async (robot_id: string, command: string) => {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  const auth = getAuthHeader();
  if (auth.Authorization) {
    (headers as any).Authorization = auth.Authorization;
  }
  const res = await fetch(`${API_BASE}/control/manual`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ robot_id, command })
  });
  return res.json();
};

export const fetchBaseSettings = async (): Promise<BaseSettings> => {

  const res = await fetch(`${API_BASE}/base/settings`);
  return res.json();
};

export const updateBaseMode = async (mode: ControlMode) => {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  const auth = getAuthHeader();
  if (auth.Authorization) {
    (headers as any).Authorization = auth.Authorization;
  }
  const res = await fetch(`${API_BASE}/base/mode`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ mode })
  });
  return res.json();
};

export const fetchPendingApprovals = async (): Promise<PendingApproval[]> => {
  const res = await fetch(`${API_BASE}/control/approvals`);
  return res.json();
};

export const approveAction = async (approval_id: number, action: 'APPROVED' | 'REJECTED') => {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  const auth = getAuthHeader();
  if (auth.Authorization) {
    (headers as any).Authorization = auth.Authorization;
  }
  const res = await fetch(`${API_BASE}/control/approve`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ approval_id, action })
  });
  return res.json();
};


export const fetchGroundHistory = async (): Promise<{ts: number, confidence_score: number, battery_pct: number}[]> => {
  const res = await fetch(`${API_BASE}/ground/history`);
  return res.json();
};

export const fetchAquaHistory = async (): Promise<{ts: number, turbidity_ntu: number, ph_value: number, battery_pct: number}[]> => {
  const res = await fetch(`${API_BASE}/aqua/history`);
  return res.json();
};
export const fetchSystemHealth = async () => {
  const res = await fetch(`${API_BASE}/asaase/health`);
  return res.json();
};
