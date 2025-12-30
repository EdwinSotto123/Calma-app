# 🧘 Calma - AI Mental Health Companion

> **Winner/Participant of [Hackathon Name]**
>
> *An AI mental health companion that detects crises in real-time, provides voice-based psychological intervention, and automatically alerts loved ones if you are in danger.*

![Calma Banner](https://via.placeholder.com/1200x400?text=Calma+AI+Companion)

## 📖 The Story

### Inspiration
Calma wasn't born in a boardroom; it was born in a hospital waiting room. We know the terrifying gap between "I'm not okay" and "Help is arriving." In moments of acute crisis—panic attacks, dissociation, or dark thoughts—the current healthcare system is too slow, and friends aren't always awake.

We asked ourselves: *What if your phone wasn't just a device, but an anchor?* We built Calma because it is the application **we needed to exist**. It is our love letter to anyone fighting a silent battle.

## ✨ Key Features

### 1. 🆘 SOS Voice Agent (The "Anchor")
A hyper-responsive voice intelligence powered by **Gemini Live**.
- **Sub-500ms Latency:** Feels like a real human conversation.
- **6-Phase Intervention Protocol:**
    1.  **Physiological Regulation:** Guided breathing.
    2.  **Sensory Grounding:** Reconnecting with reality.
    3.  **Cognitive Disruption:** Logic tasks to engage the prefrontal cortex.
    4.  **Emotional Anchoring:** Plays audio messages from loved ones.
    5.  **Visualization:** Safe place imagery.
    6.  **Micro-steps:** Regaining agency.

### 2. ❤️ Love Wall & Anchors
- **Love Messages:** Family and friends can send audio/text messages that are "unlocked" by the AI during a crisis.
- **Emergency Contacts:** Designated "Anchors" who receive alerts.

### 3. 🛡️ Autonomous Emergency Protocol (MCP)
- **Safety Net:** If the AI detects imminent danger or unresponsiveness, it uses **Model Context Protocol (MCP)** tools to autonomously send SMS alerts and location data to your Anchors.

### 4. 💊 Intelligent Care
- **Medication Tracking:** Gentle reminders for treatment adherence.
- **Mood Journaling:** Track emotional patterns over time.

## 🛠️ Tech Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS
- **AI Core:** Google Gemini Multimodal Live API (WebSocket)
- **Audio:** Web Audio API (`ScriptProcessorNode` for raw PCM processing)
- **Backend/Serverless:** Google Cloud Functions, Firebase
- **Database:** Firebase Firestore
- **Tools:** Model Context Protocol (MCP) for autonomous agent actions

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Google Cloud Project with Gemini API enabled
- Firebase Project

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/calma.git
   cd calma
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   # Add other firebase config vars
   ```

4. **Run Development Server**
   ```bash
   npm run dev
   ```

## 📱 App Structure

| Page | Route | Description |
|--------|------|-------------|
| **HomePage** | `/` | Main dashboard with mood, weather, quick access |
| **LivePage** | `/live` | Voice Agent interface with Gemini Live |
| **SOSPage** | `/sos` | Emergency mode with big red button and contacts |
| **LoveWallPage** | `/love-wall` | Collection of messages from loved ones |
| **KitPage** | `/kit` | Self-help tools: breathing, grounding, journal |

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
*Built with ❤️ for mental health awareness.*
