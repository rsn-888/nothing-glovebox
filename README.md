# The Digital Glovebox (Nothing Phone Edition)

> An offline-first, multimodal RAG agent for vehicle diagnostics.

---

## 🏎️ Overview

**The Digital Glovebox** is a specialized AI assistant designed for the edge. Built with a "Nothing OS" aesthetic, it provides instant, offline vehicle diagnostics by combining computer vision with a local Large Language Model (LLM).

## 🛠️ Key Technical Features

### 🧠 Local Inference
- Powered by **Qwen 2.5 3B** (GGUF format).
- Runs entirely on-device with no internet connection required.
- Ensures data privacy and zero-latency responses.

### 👁️ Computer Vision
- Utilizes **React Native Vision Camera** for real-time visual input.
- Capable of identifying dashboard warning lights and engine components instantly.

### 🥪 'Context Sandwich' Architecture
- Implements a unique RAG (Retrieval-Augmented Generation) pattern:
  1.  **Bottom Layer**: Static Technical Manuals (Pre-indexed).
  2.  **Filling**: Dynamic User Service History & Real-time Visual Context.
  3.  **Top Layer**: System Instructions & Safety Guardrails.
- This ensures the model has access to both the "Textbook Answer" and the "Personal Context" simultaneously.

### ⚡ Zero-Latency Offline Architecture
- No API calls. No cloud latency.
- "Pre-indexed static assets" replace traditional vector DB lookups for this demo to guarantee instant retrieval on the edge.

---

## 👨‍⚖️ Instructions for Judges

> [!IMPORTANT]
> **Manual Model Setup Required**

To run this application on an Android device/emulator, you must manually push the model file to the device's storage.

1.  **Download the Model**: Ensure you have the `model.gguf` file (Qwen 2.5 3B).
2.  **Push to Device**:
    ```bash
    adb push path/to/your/model.gguf /sdcard/Download/model.gguf
    ```
3.  **Launch App**: Open the app and complete the "Initial Setup" form.

---

*Built for the Hackathon 2025.*
