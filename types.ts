
// Shared type definitions for the BusPro application
export interface Student {
  id: string;
  name: string;
  address: string;
  parentName: string;
  parentContact: string;
  notes: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface Stop {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

export interface Route {
  id: string;
  name: string;
  color: string;
  stops: Stop[];
}

export interface Bus {
  id: string;
  busNumber: string;
  driverName: string;
  routeId: string;
  status: 'On Route' | 'Delayed' | 'Completed' | 'Idle';
  currentCapacity: number;
  maxCapacity: number;
  currentLat: number;
  currentLng: number;
  nextStopId: string;
}

export interface Notification {
  id: string;
  type: 'alert' | 'success' | 'info';
  message: string;
  timestamp: string;
}
