import React, { useEffect, useState, useRef } from "react";
import {
  FlatList,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  SafeAreaView,
  StyleSheet,
  KeyboardAvoidingView,
} from "react-native";
import { CactusAgent } from "cactus-react-native";

// --- DATA SECTION ---
const CAR_MANUAL = `
[OFFICIAL MANUAL - WARNING LIGHTS]
1. SYMBOL: Rectangular box with dots (DPF). NAME: Diesel Particulate Filter. FIX: Drive at 40mph+ for 15 mins.
2. SYMBOL: Red Oil Can. NAME: Low Oil Pressure. FIX: STOP IMMEDIATELY. Check oil.
`;

const INITIAL_USER_LOGS = [
  { id: 1, date: "2025-11-25", note: "Replaced battery." },
  { id: 2, date: "2025-11-26", note: "Checked oil level." },
];
// --------------------

let agent: CactusAgent | null = null;

interface ChatMessage {
  id: string;
  role: "user" | "ai";
  text: string;
}

export default function HomeScreen() {
  const [modelLoaded, setModelLoaded] = useState(false);
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userLogs, setUserLogs] = useState(INITIAL_USER_LOGS);
  const [isThinking, setIsThinking] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // PATH TO BRAIN
  const modelUrl = "file:///sdcard/Download/model.gguf";

  useEffect(() => {
    const initAgent = async () => {
      console.log("Initializing...");
      const { error, agent: initializedAgent } = await CactusAgent.init({
        model: modelUrl,
        use_mlock: true,
        n_ctx: 4096,
        n_gpu_layers: Platform.OS === "ios" ? 99 : 0,
      });

      if (error || !initializedAgent) {
        console.error("Init Failed:", error?.message);
        return;
      }

      agent = initializedAgent;
      setModelLoaded(true);
      setMessages([{ id: "0", role: "ai", text: "SYSTEM READY. SCANNING..." }]);
    };
    initAgent();
  }, []);

  const handleSend = async () => {
    if (!inputText.trim() || !agent || isThinking) return;

    // 1. Show User Message
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      text: inputText,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsThinking(true);

    // 2. Build Context
    // FIX: Removed '.event', used '.note' only
    const historyText = userLogs
      .map((log) => `- [${log.date}] ${log.note}`)
      .join("\n");

    const prompt = `
      You are a Mechanic.
      MANUAL: ${CAR_MANUAL}
      HISTORY: ${historyText}
      USER: ${inputText}
    `;

    try {
      // FIX: Cactus expects an array directly, or an object depending on version.
      // This is the safest generic call:
      const result = await agent.completion([
        { role: "user", content: prompt },
      ]);

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        text: result.content,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsThinking(false);
    }
  };

  const handleLog = () => {
    if (!inputText.trim()) return;
    const newLog = {
      id: Date.now(),
      date: new Date().toISOString().split("T")[0],
      note: inputText,
    };
    setUserLogs([...userLogs, newLog]);
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), role: "ai", text: `LOGGED: "${inputText}"` },
    ]);
    setInputText("");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>NOTHING // DIAGNOSTIC</Text>
        <View
          style={[
            styles.statusDot,
            modelLoaded ? styles.dotGreen : styles.dotRed,
          ]}
        />
      </View>
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        style={styles.chatList}
        renderItem={({ item }) => (
          <View
            style={[
              styles.bubble,
              item.role === "user" ? styles.userBubble : styles.aiBubble,
            ]}
          >
            <Text
              style={[
                styles.text,
                item.role === "user" ? styles.userText : styles.aiText,
              ]}
            >
              {item.text}
            </Text>
          </View>
        )}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <TextInput
          style={styles.input}
          placeholder="ENTER FAULT..."
          placeholderTextColor="#666"
          value={inputText}
          onChangeText={setInputText}
        />
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.logButton} onPress={handleLog}>
            <Text style={styles.buttonText}>LOG</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
            <Text style={styles.buttonText}>ANALYZE</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000000" },
  header: {
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderColor: "#333",
  },
  headerText: { color: "#FFF", fontFamily: "monospace", fontSize: 18 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  dotRed: { backgroundColor: "#D71921" },
  dotGreen: { backgroundColor: "#00FF00" },
  chatList: { flex: 1, padding: 15 },
  bubble: { padding: 15, marginBottom: 10, maxWidth: "85%" },
  aiBubble: {
    alignSelf: "flex-start",
    borderLeftWidth: 2,
    borderLeftColor: "#D71921",
  },
  userBubble: { alignSelf: "flex-end", backgroundColor: "#222" },
  text: { color: "#FFF", fontFamily: "monospace" },
  userText: { color: "#FFF" },
  aiText: { color: "#FFF" },
  input: {
    backgroundColor: "#111",
    color: "#FFF",
    padding: 15,
    fontFamily: "monospace",
    borderWidth: 1,
    borderColor: "#333",
  },
  buttonRow: { flexDirection: "row", padding: 15, gap: 10 },
  logButton: {
    flex: 1,
    backgroundColor: "#333",
    padding: 15,
    alignItems: "center",
  },
  sendButton: {
    flex: 2,
    backgroundColor: "#D71921",
    padding: 15,
    alignItems: "center",
  },
  buttonText: { color: "#FFF", fontFamily: "monospace", fontWeight: "bold" },
});
