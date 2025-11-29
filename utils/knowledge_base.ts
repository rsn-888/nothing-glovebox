// knowledge_base.ts
// This acts as our "Local Database" for the hackathon.

export const CAR_MANUAL = `
[OFFICIAL FORD FIESTA (MK7) WORKSHOP MANUAL - SECTION 4: INSTRUMENT CLUSTER]

1. SYMBOL: Rectangular box with dots (DPF Warning).
   SYSTEM: Emission Control.
   SEVERITY: MEDIUM (Amber).
   DESCRIPTION: The Diesel Particulate Filter is saturated with soot.
   OFFICIAL FIX: Regeneration required. Do NOT switch off the engine. Drive at a sustained speed of 40mph+ (approx 2500 RPM) for 20 minutes to burn off the soot.
   WARNING: Frequent short journeys will cause this fault to recur.

2. SYMBOL: Red Oil Can / Dripping Can.
   SYSTEM: Lubrication.
   SEVERITY: CRITICAL (Red).
   DESCRIPTION: Low oil pressure. Engine lubrication has failed.
   OFFICIAL FIX: STOP THE VEHICLE IMMEDIATELY in a safe place. Turn off engine. Check oil dipstick. If low, top up with 5W-30 Synthetic. If level is correct, oil pump failure is likely. Do not drive.

3. SYMBOL: Red Battery Box.
   SYSTEM: Charging System.
   SEVERITY: HIGH (Red).
   DESCRIPTION: Alternator is not charging the battery.
   OFFICIAL FIX: Turn off all non-essential electrical loads (Radio, A/C, Heated Seats). Drive immediately to the nearest service station. Engine will stop when battery depletes.
`;

export const INITIAL_USER_LOGS = [
   { id: 1, date: "2025-11-20", note: "Full Service completed at Halfords." },
   {
      id: 2,
      date: "2025-11-25",
      note: "Replaced battery with new Bosch S4 unit.",
   },
];
