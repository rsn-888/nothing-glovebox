// src/data.ts

// 1. The Static Knowledge (The Manual)
// Tip: Use Markdown formatting. LLMs understand headers (##) very well.
export const CAR_MANUAL = `
## SECTION: DASHBOARD INDICATORS
- **Check Engine Light (Orange):** Indicates a malfunction in the engine management system. If flashing, stop driving immediately.
- **DPF Warning (Yellow):** Diesel Particulate Filter is full. Action: Drive at 50mph+ for 20 minutes to regenerate.
- **Battery Light (Red):** Charging system failure. Alternator may be dead.

## SECTION: FLUIDS & SPECS
- **Engine Oil:** 5W-30 Synthetic. Capacity: 4.5 Liters.
- **Coolant:** Ethylene-glycol based (Pink). 
- **Tire Pressure:** 32 PSI (Front), 30 PSI (Rear).

## SECTION: COMMON ISSUES (Ford Fiesta 2020)
- **Clicking on turn:** Usually indicates a worn CV joint.
- **Grinding on brake:** Worn brake pads.
`;

// 2. The Dynamic Memory (User History)
// In a real app, this comes from a database. Here, we hardcode state for the demo.
export interface LogEntry {
  id: string;
  date: string;
  category: 'Maintenance' | 'Incident' | 'Note';
  text: string;
}

export const INITIAL_USER_LOGS: LogEntry[] = [
  { 
    id: '1', 
    date: '2024-12-10', 
    category: 'Maintenance', 
    text: 'Replaced front brake pads. Used Bosch parts.' 
  },
  { 
    id: '2', 
    date: '2025-01-15', 
    category: 'Incident', 
    text: 'Hit a deep pothole on the front-right side. Alignment feels off.' 
  },
  { 
    id: '3', 
    date: '2025-02-01', 
    category: 'Note', 
    text: 'Engine oil level checked. It was full.' 
  }
];