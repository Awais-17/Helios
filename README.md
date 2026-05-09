# Helios | AI-Powered Code Editor

Helios is a modern, high-performance code editor built with Electron, React, and integrated with advanced AI capabilities. It features a Helios-like interface with a built-in AI Senior Engineer named Helios to help you build, debug, and optimize your software.

## 🚀 Key Features

- **Multi-Model AI Chat**: Integrated with OpenAI, Groq, NVIDIA NIM, and OpenRouter. Switch between GPT-4o, Mistral Medium, Phi 3.5 Vision, Llama 3.3, and more.
- **NVIDIA NIM Integration**: High-performance AI inference using NVIDIA's cloud and local NIM endpoints.
- **Pure Black Theme**: A high-contrast "Dark Black" aesthetic with a quick toggle for standard charcoal mode.
- **Smart Fallback System**: Automatically rotates through available AI providers if one fails or hits rate limits.
- **Monaco Editor**: Professional-grade editing using the `hc-black` high-contrast theme for perfect readability.
- **AI File Generation**: Helios can propose and directly create files in your project based on chat instructions.
- **Inline AI Completions**: Real-time code suggestions as you type.
- **Modern UI/UX**: Built with Tailwind CSS and Framer Motion for a smooth, glassmorphic interface.

## 🛠️ Project Structure

```text
Helios/
├── services/
│   └── aiService.js       # Core AI logic & fallback mechanism (NVIDIA, OpenAI, Groq)
├── src/
│   ├── components/        # React UI components (Editor, Chat, Sidebar, etc.)
│   ├── hooks/             # Custom React hooks (Inline completions)
│   ├── styles/            # Global styles (Pure Black Theme variables)
│   ├── App.jsx            # Main application layout
│   └── main.jsx           # React entry point
├── main.js                # Electron main process
├── preload.js             # Secure IPC bridge
└── .env                   # API Keys and configuration
```

## ⚙️ Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/)

## 🏁 Getting Started

### 1. Installation
Clone the repository and install dependencies:
```bash
npm install
```

### 2. Configuration
Create a `.env` file in the root directory (refer to `.env.example`) and add your API keys:
```env
# API Keys
GROQ_API_KEY=your_key
OPENAI_API_KEY=your_key
NGC_API_KEY=your_nvidia_nim_key
OPENROUTER_NVIDIA_KEY=your_key
OPENROUTER_GPT_OSS_KEY=your_key
OPENROUTER_GEMMA_KEY=your_key
OPENROUTER_LLAMA_KEY=your_key

# App Configuration
PORT=5173
NODE_ENV=development
```

### 3. Running the App
Start the development server and Electron app:
```bash
npm start
```

## 🧠 Using Helios AI

- **NVIDIA NIM Models**: Select **Mistral Medium** or **Phi 3.5 Vision** for high-speed, state-of-the-art inference via NVIDIA's infrastructure.
- **Theme Toggle**: Use the Sun/Moon icon in the title bar to switch between **Pure Black** and **Deep Charcoal** modes.
- **Smart Mode**: Select "Smart (Auto-fallback)" in the chat to let Helios choose the best available model.
- **File Creation**: Ask Helios to "create a react component for a button" and it will propose the file structure. Click the "Update files" message to apply changes.
- **Context Awareness**: Helios sees the file you currently have open to provide better, more relevant advice.

## 📜 License
This project is for educational purposes.
