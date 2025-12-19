
export interface Student {
  id: string;
  name: string;
  address: string;
  parentName: string;
  parentContact: string;
  notes: string;
}

export type RouteType = 'Morning Route' | 'Afternoon Route';
export type DirectionType = 'Go to School' | 'Back from School';
export type AppTab = 'list' | 'assistant' | 'settings';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

// Added Stop interface to support Route stops mapping
export interface Stop {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

// Added Route interface for fleet-wide route management
export interface Route {
  id: string;
  name: string;
  color: string;
  stops: Stop[];
}

// Added Bus interface for real-time fleet status tracking
export interface Bus {
  id: string;
  busNumber: string;
  routeId: string;
  driverName: string;
  status: 'On Route' | 'Delayed' | 'Completed' | 'Idle';
  currentCapacity: number;
  maxCapacity: number;
  currentLat: number;
  currentLng: number;
  nextStopId: string;
}

// Added Notification interface for system alerts and updates
export interface Notification {
  id: string;
  type: 'alert' | 'success' | 'info';
  message: string;
  timestamp: string;
}
