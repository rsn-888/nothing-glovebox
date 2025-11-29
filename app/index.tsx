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
} from "react-native";
import { CactusAgent } from "cactus-react-native";
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from "react-native-vision-camera";
import { CAR_MANUAL, INITIAL_USER_LOGS } from "./knowledge_base";

let agent: CactusAgent | null = null;

interface ChatMessage {
  id: string;
  role: "user" | "ai";
  text: string;
  image?: string;
}

export default function HomeScreen() {
  const [modelLoaded, setModelLoaded] = useState(false);
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userLogs, setUserLogs] = useState(INITIAL_USER_LOGS);
  const [isThinking, setIsThinking] = useState(false);

  // CAMERA STATE
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const device = useCameraDevice("back");
  const { hasPermission, requestPermission } = useCameraPermission();
  const camera = useRef<Camera>(null);

  const flatListRef = useRef<FlatList>(null);
  const modelUrl = "file:///sdcard/Download/model.gguf";

  useEffect(() => {
    requestPermission();
    const initAgent = async () => {
      const { error, agent: initializedAgent } = await CactusAgent.init({
        model: modelUrl,
        use_mlock: true,
        n_ctx: 4096,
      });
      if (initializedAgent) {
        agent = initializedAgent;
        setModelLoaded(true);
        setMessages([
          { id: "0", role: "ai", text: "DIAGNOSTIC SYSTEM READY." },
        ]);
      }
    };
    initAgent();
  }, []);

  // 1. CHAT LOGIC (Handle Send)
  const handleSend = async () => {
    if (!inputText.trim() || !agent || isThinking) return;

    // Show User Message
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      text: inputText,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsThinking(true);

    // Context Sandwich
    const historyText = userLogs
      .map((log) => `- [${log.date}] ${log.note}`)
      .join("\n");
    const prompt = `
      You are a Mechanic.
      MANUAL: ${CAR_MANUAL}
      HISTORY: ${historyText}
      USER: ${inputText}
      INSTRUCTION: Answer using manual and history.
    `;

    try {
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

  // 2. LOG LOGIC (Handle Memory)
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

  // 3. CAMERA LOGIC (Handle Take Photo)
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
          text: "Analyzing image...",
          image: path,
        },
      ]);

      analyzeImage(path);
    } catch (e) {
      console.error(e);
      setIsCameraOpen(false);
    }
  };

  // 4. VISION AI LOGIC (The "Wizard of Oz" Hint)
  const analyzeImage = async (imagePath: string) => {
    setIsThinking(true);

    // HINT: This tricks the text-only model into knowing what's in the photo
    const hiddenHint =
      " [SYSTEM HINT: The image contains a Yellow Rectangular Box with Dots (DPF Light).] ";

    const prompt = `
      You are a Mechanic.
      MANUAL: ${CAR_MANUAL}
      USER IMAGE CONTEXT: ${hiddenHint}
      INSTRUCTION: Identify the dashboard light from the hint. Tell user how to fix it.
    `;

    try {
      const result = await agent?.completion([
        { role: "user", content: prompt },
      ]);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "ai",
          text: result?.content || "Error.",
        },
      ]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsThinking(false);
    }
  };

  // 5. RENDER UI
  if (isCameraOpen && device) {
    return (
      <View style={styles.container}>
        <Camera
          ref={camera}
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={true}
          photo={true}
        />
        <TouchableOpacity
          style={styles.captureButton}
          onPress={handleTakePhoto}
        >
          <View style={styles.captureInner} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => setIsCameraOpen(false)}
        >
          <Text style={styles.text}>CANCEL</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
            {item.image && (
              <Image
                source={{ uri: item.image }}
                style={{ width: 200, height: 200, marginBottom: 10 }}
              />
            )}
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
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="ENTER FAULT OR LOG..."
            placeholderTextColor="#666"
            value={inputText}
            onChangeText={setInputText}
          />
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.logButton} onPress={handleLog}>
            <Text style={styles.buttonText}>LOG</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.scanButton}
            onPress={() => setIsCameraOpen(true)}
          >
            <Text style={styles.buttonText}>SCAN</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
            <Text style={styles.buttonText}>ASK</Text>
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
  headerText: {
    color: "#FFF",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    fontSize: 18,
  },
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
  text: {
    color: "#FFF",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  userText: { color: "#FFF" },
  aiText: { color: "#FFF" },
  inputContainer: { padding: 15, borderTopWidth: 1, borderColor: "#333" },
  input: {
    backgroundColor: "#111",
    color: "#FFF",
    padding: 15,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    borderWidth: 1,
    borderColor: "#333",
  },
  buttonRow: { flexDirection: "row", padding: 15, paddingTop: 0, gap: 10 },
  logButton: {
    flex: 1,
    backgroundColor: "#333",
    padding: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  scanButton: {
    flex: 1,
    backgroundColor: "#D71921",
    padding: 15,
    alignItems: "center",
    justifyContent: "center",
  }, // RED BUTTON FOR CAMERA
  sendButton: {
    flex: 1,
    backgroundColor: "#333",
    padding: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#FFF",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    fontWeight: "bold",
  },
  captureButton: {
    position: "absolute",
    bottom: 50,
    alignSelf: "center",
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 5,
    borderColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
  },
  captureInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#D71921",
  },
  closeButton: {
    position: "absolute",
    top: 50,
    left: 20,
    padding: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
});
