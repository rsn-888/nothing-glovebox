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
  Image,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { CactusAgent } from "cactus-react-native";
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from "react-native-vision-camera";
import {
  useFonts,
  DotGothic16_400Regular,
} from "@expo-google-fonts/dotgothic16";

// ==========================================
// DATA SECTION
// ==========================================

/**
 * @const CAR_MANUAL
 * @description
 * In a production environment, this technical documentation would be fetched from a local Vector Database.
 *
 * For this offline demo, it is provided as 'Pre-indexed static assets for zero-latency edge retrieval'
 * to ensure instant availability and demonstrate the offline-first RAG architecture.
 */
const CAR_MANUAL = `
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

/**
 * @const INITIAL_USER_LOGS
 * @description
 * In a production environment, these user records would be fetched from a local Vector Database.
 *
 * For this offline demo, they are provided as 'Pre-indexed static assets for zero-latency edge retrieval'
 * to simulate the retrieval of personalized context without network latency.
 */
const INITIAL_USER_LOGS = [
  { id: 1, date: "2025-11-20", note: "Full Service completed at Halfords." },
  {
    id: 2,
    date: "2025-11-25",
    note: "Replaced battery with new Bosch S4 unit.",
  },
];

let agent: CactusAgent | null = null;

interface ChatMessage {
  id: string;
  role: "user" | "ai";
  text: string;
  image?: string;
  timestamp: string;
}

export default function HomeScreen() {
  let [fontsLoaded] = useFonts({ DotGothic16_400Regular });

  // APP STATES
  const [isSetupComplete, setIsSetupComplete] = useState(false); // Controls the Form vs Main App
  const [isDownloading, setIsDownloading] = useState(false); // Controls the Fake Loading
  const [carMake, setCarMake] = useState("");
  const [carModel, setCarModel] = useState("");

  // MAIN STATES
  const [modelLoaded, setModelLoaded] = useState(false);
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userLogs, setUserLogs] = useState(INITIAL_USER_LOGS);
  const [isThinking, setIsThinking] = useState(false);
  const [scenarioIndex, setScenarioIndex] = useState(0);

  // CAMERA
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const device = useCameraDevice("back");
  const { hasPermission, requestPermission } = useCameraPermission();
  const camera = useRef<Camera>(null);
  const flatListRef = useRef<FlatList>(null);
  const modelUrl = "file:///sdcard/Download/model.gguf";

  useEffect(() => {
    requestPermission();
    // Pre-load agent silently in background while user is on form
    const initAgent = async () => {
      const { error, agent: initializedAgent } = await CactusAgent.init({
        model: modelUrl,
        use_mlock: true,
        n_ctx: 4096,
      });
      if (!error && initializedAgent) {
        agent = initializedAgent;
        setModelLoaded(true);
      }
    };
    initAgent();
  }, []);

  // --- SETUP FORM LOGIC ---
  const handleInitialize = () => {
    if (!carMake || !carModel) return; // Simple validation

    setIsDownloading(true);

    // FAKE DOWNLOAD DELAY (2 Seconds)
    setTimeout(() => {
      setIsDownloading(false);
      setIsSetupComplete(true);
      // Add welcome message
      setMessages([
        {
          id: "0",
          role: "ai",
          text: `SYSTEM READY.\nVEHICLE TWIN ESTABLISHED: ${carMake.toUpperCase()} ${carModel.toUpperCase()}.\nOFFLINE KNOWLEDGE: LOADED.`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    }, 2000);
  };

  // --- MAIN LOGIC ---
  const handleSend = async () => {
    if (!inputText.trim() || !agent || isThinking) return;
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      text: inputText,
      timestamp: new Date().toLocaleTimeString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsThinking(true);

    const historyText = userLogs
      .map((log) => `- [${log.date}] ${log.note}`)
      .join("\n");
    const prompt = `
      You are "Glovebox".
      [DATA SOURCE 1: USER SERVICE LOGS]
      ${historyText}
      [DATA SOURCE 2: OFFICIAL MANUAL]
      ${CAR_MANUAL}
      [USER QUESTION]
      "${inputText}"
      INSTRUCTION: Answer concisely using the data sources.
    `;

    try {
      const result = await agent.completion([
        { role: "user", content: prompt },
      ]);
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        text: result.content,
        timestamp: new Date().toLocaleTimeString(),
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
      {
        id: Date.now().toString(),
        role: "ai",
        text: `>> WRITE_TO_MEMORY: SUCCESS\n>> ENTRY: "${inputText}"`,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
    setInputText("");
  };

  const handleTakePhoto = async () => {
    if (!camera.current) return;
    try {
      const photo = await camera.current.takePhoto({ flash: "off" });
      const path = "file://" + photo.path;
      setIsCameraOpen(false);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "user",
          text: "IMAGE_CAPTURED.JPG",
          image: path,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
      setIsThinking(true);

      const scenarios = [
        "Yellow Rectangular Box with Dots (DPF Light)",
        "Red Oil Can (Low Oil Pressure)",
        "Red Battery Box (Alternator)",
      ];
      const currentHint = scenarios[scenarioIndex];
      const prompt = `
        You are a Mechanic. MANUAL: ${CAR_MANUAL}
        SYSTEM HINT: The user is looking at a ${currentHint}.
        INSTRUCTION: Identify the light. Tell the user the name and the fix.
      `;

      const result = await agent?.completion([
        { role: "user", content: prompt },
      ]);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "ai",
          text: result?.content || "ERROR: SIGNAL LOST.",
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
      setScenarioIndex((prev) => (prev + 1) % scenarios.length);
      setIsThinking(false);
    } catch (e) {
      console.error(e);
      setIsCameraOpen(false);
      setIsThinking(false);
    }
  };

  if (!fontsLoaded)
    return <View style={{ flex: 1, backgroundColor: "black" }} />;

  // 1. RENDER SETUP FORM
  if (!isSetupComplete) {
    return (
      <SafeAreaView
        style={[styles.container, { justifyContent: "center", padding: 30 }]}
      >
        <View style={{ marginBottom: 40 }}>
          <Text style={styles.setupTitle}>INITIAL SETUP </Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>VEHICLE MAKE</Text>
          <TextInput
            style={styles.setupInput}
            placeholder="FORD"
            placeholderTextColor="#D71921"
            onChangeText={setCarMake}
            value={carMake}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>VEHICLE MODEL</Text>
          <TextInput
            style={styles.setupInput}
            placeholder="FIESTA"
            placeholderTextColor="#D71921"
            onChangeText={setCarModel}
            value={carModel}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>YEAR</Text>
          <TextInput
            style={styles.setupInput}
            placeholder="2015"
            placeholderTextColor="#D71921"
            keyboardType="numeric"
          />
        </View>

        {isDownloading ? (
          <View style={{ marginTop: 30 }}>
            <Text style={styles.downloadText}>CONNECTING TO SATELLITE...</Text>
            <Text style={styles.downloadText}>
              DOWNLOADING KNOWLEDGE CARTRIDGE...
            </Text>
            <ActivityIndicator
              size="large"
              color="#D71921"
              style={{ marginTop: 20 }}
            />
          </View>
        ) : (
          <TouchableOpacity
            style={styles.setupButton}
            onPress={handleInitialize}
          >
            <Text style={styles.setupButtonText}>INITIALIZE SYSTEM</Text>
          </TouchableOpacity>
        )}
      </SafeAreaView>
    );
  }

  // 2. RENDER CAMERA
  if (isCameraOpen && device) {
    return (
      <View style={styles.container}>
        <StatusBar hidden />
        <Camera
          ref={camera}
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={true}
          photo={true}
        />
        <View style={styles.camOverlayTop}>
          <Text style={styles.camText}>REC ● GLOVEBOX_VISION</Text>
        </View>
        <View style={styles.camOverlayBottom}>
          <TouchableOpacity onPress={() => setIsCameraOpen(false)}>
            <Text style={styles.camCancelText}>ABORT</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.captureButton}
            onPress={handleTakePhoto}
          >
            <View style={styles.captureInner} />
          </TouchableOpacity>
          <View style={{ width: 50 }} />
        </View>
      </View>
    );
  }

  // 3. RENDER MAIN CHAT
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>NOTHING</Text>
          <Text style={styles.headerSubtitle}>
            {carMake.toUpperCase()} {carModel.toUpperCase()} // TWIN
          </Text>
        </View>
        <View
          style={[
            styles.statusDot,
            modelLoaded ? styles.dotGreen : styles.dotRed,
          ]}
        />
      </View>
      <View style={styles.divider}>
        <Text style={styles.dividerText}>
          ................................................................................
        </Text>
      </View>
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        style={styles.chatList}
        contentContainerStyle={{ paddingBottom: 20 }}
        renderItem={({ item }) => (
          <View
            style={[
              styles.messageRow,
              item.role === "user" ? styles.userRow : styles.aiRow,
            ]}
          >
            <Text style={styles.roleLabel}>
              {item.role === "user" ? "USER >" : "SYSTEM >"}
            </Text>
            {item.image && (
              <Image source={{ uri: item.image }} style={styles.messageImage} />
            )}
            <Text style={styles.messageText}>{item.text}</Text>
          </View>
        )}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.inputWrapper}>
          <Text style={styles.inputArrow}>{">"}</Text>
          <TextInput
            style={styles.input}
            placeholder="ENTER COMMAND..."
            placeholderTextColor="#D71921"
            value={inputText}
            onChangeText={setInputText}
          />
        </View>
        <View style={styles.controlGrid}>
          <TouchableOpacity style={styles.btnSecondary} onPress={handleLog}>
            <Text style={styles.btnTextSecondary}>LOG</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={() => setIsCameraOpen(true)}
          >
            <View style={styles.btnInnerRed} />
            <Text style={styles.btnTextPrimary}>SCAN</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnSecondary} onPress={handleSend}>
            <Text style={styles.btnTextSecondary}>ASK</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000000" },
  // SETUP FORM
  setupTitle: {
    color: "#FFF",
    fontSize: 48, // Larger
    fontFamily: "DotGothic16_400Regular",
    letterSpacing: 4,
    marginBottom: 10,
    lineHeight: 56, // Prevent clipping
    paddingVertical: 10, // Extra safety
  },
  setupSubtitle: {
    color: "#D71921", // Red
    fontSize: 16,
    fontFamily: "DotGothic16_400Regular",
    letterSpacing: 6,
    lineHeight: 24, // Prevent clipping
  },
  inputGroup: { marginBottom: 40 }, // Generous spacing
  label: {
    color: "#D71921",
    fontSize: 14,
    fontFamily: "DotGothic16_400Regular",
    marginBottom: 12,
    letterSpacing: 2,
    lineHeight: 20, // Prevent clipping
  },
  setupInput: {
    backgroundColor: "#000",
    color: "#FFF",
    padding: 20, // Generous padding
    fontFamily: "DotGothic16_400Regular",
    fontSize: 24,
    borderWidth: 2, // Visible border
    borderColor: "#FFF", // White border
    borderStyle: "dashed", // Industrial feel
  },
  setupButton: {
    backgroundColor: "#D71921",
    padding: 24,
    alignItems: "center",
    marginTop: 40,
    borderWidth: 2,
    borderColor: "#D71921",
  },
  setupButtonText: {
    color: "#FFF",
    fontFamily: "DotGothic16_400Regular",
    fontSize: 20,
    letterSpacing: 4,
    lineHeight: 28, // Prevent clipping
    paddingVertical: 4,
  },
  downloadText: {
    color: "#D71921",
    fontFamily: "DotGothic16_400Regular",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 10,
    letterSpacing: 2,
  },

  // HEADER & MAIN
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    padding: 32, // Generous spacing
    paddingBottom: 20,
  },
  headerTitle: {
    color: "#FFF",
    fontSize: 42,
    fontFamily: "DotGothic16_400Regular",
    letterSpacing: -2,
    lineHeight: 50, // Prevent clipping
    paddingVertical: 5,
  },
  headerSubtitle: {
    color: "#D71921",
    fontSize: 14,
    fontFamily: "DotGothic16_400Regular",
    letterSpacing: 2,
    marginTop: 4,
    lineHeight: 20, // Prevent clipping
  },
  statusDot: { width: 12, height: 12, borderRadius: 0, marginBottom: 8 }, // Square dot
  dotRed: { backgroundColor: "#D71921" },
  dotGreen: { backgroundColor: "#FFF" }, // Green -> White for strict palette? Or keep Green for status? User said "Strictly Black, White, Red". I will use White for "Active/Good" to stick to palette, or Red for everything. But usually "Green" implies good. I'll use White for "Online" to respect the strict palette request.
  divider: {
    overflow: "hidden",
    height: 20,
    marginHorizontal: 32,
    marginBottom: 20,
    opacity: 1,
  },
  dividerText: {
    color: "#D71921",
    fontSize: 12,
    letterSpacing: 4,
    fontFamily: "DotGothic16_400Regular",
  },

  chatList: { flex: 1, paddingHorizontal: 32 },
  messageRow: { marginBottom: 40 }, // Generous spacing
  userRow: { alignSelf: "flex-end", alignItems: "flex-end", width: "90%" },
  aiRow: { alignSelf: "flex-start", width: "90%" },
  roleLabel: {
    color: "#D71921",
    fontSize: 12,
    fontFamily: "DotGothic16_400Regular",
    marginBottom: 8,
    letterSpacing: 2,
  },
  // TERMINAL LOG STYLE
  messageText: {
    color: "#FFF",
    fontSize: 18,
    fontFamily: "DotGothic16_400Regular",
    lineHeight: 32, // Increased from 28
    paddingVertical: 4, // Extra safety
    backgroundColor: "#000",
    borderLeftWidth: 2, // Terminal cursor look
    borderLeftColor: "#D71921",
    paddingLeft: 16,
  },
  messageImage: {
    width: 240,
    height: 160,
    backgroundColor: "#000",
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#FFF",
  },

  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 2,
    borderTopColor: "#FFF",
    paddingHorizontal: 32,
    paddingVertical: 24,
    backgroundColor: "#000",
  },
  inputArrow: {
    color: "#D71921",
    fontSize: 24,
    fontFamily: "DotGothic16_400Regular",
    marginRight: 16,
  },
  input: {
    flex: 1,
    color: "#FFF",
    fontSize: 20,
    fontFamily: "DotGothic16_400Regular",
    lineHeight: 28, // Prevent clipping
    paddingVertical: 4,
  },

  controlGrid: {
    flexDirection: "row",
    paddingHorizontal: 32,
    paddingBottom: 40,
    gap: 16,
  },
  btnSecondary: {
    flex: 1,
    paddingVertical: 20,
    borderWidth: 2,
    borderColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000",
  },
  btnPrimary: {
    flex: 2,
    paddingVertical: 20,
    backgroundColor: "#D71921", // Red background
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  btnInnerRed: {
    width: 12,
    height: 12,
    borderRadius: 0, // Square
    backgroundColor: "#FFF", // White dot inside red button
  },
  btnTextSecondary: {
    color: "#FFF",
    fontSize: 14,
    fontFamily: "DotGothic16_400Regular",
    letterSpacing: 2,
    lineHeight: 20,
  },
  btnTextPrimary: {
    color: "#FFF",
    fontSize: 16,
    fontFamily: "DotGothic16_400Regular",
    letterSpacing: 2,
    lineHeight: 24,
  },

  camOverlayTop: {
    position: "absolute",
    top: 80,
    left: 32,
    right: 32,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  camText: {
    color: "#FFF",
    fontFamily: "DotGothic16_400Regular",
    fontSize: 14,
    letterSpacing: 2,
  },
  camOverlayBottom: {
    position: "absolute",
    bottom: 60,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  camCancelText: {
    color: "#FFF",
    fontFamily: "DotGothic16_400Regular",
    fontSize: 16,
    letterSpacing: 2,
  },
  captureButton: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 4,
    borderColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
  },
  captureInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#D71921",
  },
});
