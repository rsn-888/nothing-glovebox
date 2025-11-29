// src/hooks/useMemory.ts
import { useState } from 'react';
import { CAR_MANUAL, INITIAL_USER_LOGS, LogEntry } from './data';

export const useMemory = () => {
  const [logs, setLogs] = useState<LogEntry[]>(INITIAL_USER_LOGS);

  const addLog = (text: string) => {
    const newLog: LogEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
      category: 'Note',
      text,
    };
    setLogs((prev) => [...prev, newLog]);
  };

  const getSystemPrompt = () => {
    // We strictly format the context so Qwen understands the separation
    return `
<SYSTEM_INSTRUCTION>
You are Glovebox AI, an expert mechanic for a Ford Fiesta.
You have access to the CAR MANUAL and the USER'S MAINTENANCE LOGS.
Answer the user's question by SYNTHESIZING these two sources.
If the manual suggests a fix, but the logs show the user already did it, point that out!
</SYSTEM_INSTRUCTION>

<CAR_MANUAL>
${CAR_MANUAL}
</CAR_MANUAL>

<USER_LOGS>
${JSON.stringify(logs, null, 2)}
</USER_LOGS>
`;
  };

  return { logs, addLog, getSystemPrompt };
};