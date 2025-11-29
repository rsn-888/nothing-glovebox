// src/DebugScreen.tsx
import React, { useState } from 'react';
import { View, Text, Button, ScrollView, StyleSheet } from 'react-native';
import { useMemory } from '../services/useMemory'; // Verify this path matches your project

export default function DebugScreen() {
  const { logs, addLog, getSystemPrompt } = useMemory();
  const [lastPrompt, setLastPrompt] = useState('');

  const handleTestLogic = () => {
    // 1. Simulate a user action
    addLog("DEBUG_TEST: User checked the oil level.");
    
    // 2. Generate the "Sandwich"
    const prompt = getSystemPrompt();
    
    // 3. Print to Console (Look at your Metro Bundler terminal)
    console.log("============== CONTEXT SANDWICH START ==============");
    console.log(prompt);
    console.log("============== CONTEXT SANDWICH END ==============");

    // 4. Show on screen (optional, for quick check)
    setLastPrompt(prompt);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>🧠 Memory Debugger</Text>
      
      <View style={styles.section}>
        <Text style={styles.label}>Current Logs in Memory: {logs.length}</Text>
        {logs.map((log, i) => (
          <Text key={i} style={styles.logItem}>
            [{log.date}] {log.text}
          </Text>
        ))}
      </View>

      <Button title="1. Simulate: Add New Log" onPress={() => addLog("Simulated log entry")} />
      <View style={{ height: 10 }} />
      <Button title="2. Generate & Log Prompt" onPress={handleTestLogic} color="orange" />

      <Text style={styles.label}>Generated Prompt Preview:</Text>
      <Text style={styles.preview}>{lastPrompt}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#111', flex: 1 },
  header: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 20 },
  section: { marginBottom: 20, padding: 10, backgroundColor: '#222', borderRadius: 8 },
  label: { color: '#aaa', marginBottom: 5, fontWeight: 'bold' },
  logItem: { color: '#0f0', fontFamily: 'monospace', fontSize: 12, marginBottom: 2 },
  preview: { color: '#fff', fontFamily: 'monospace', fontSize: 10, marginTop: 10, padding: 10, backgroundColor: '#333' },
});
