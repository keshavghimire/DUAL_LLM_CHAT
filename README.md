
# Dual LLM Conversation System

A simple web application that allows **two AI models (LLM1 & LLM2)** to have a **turn-based conversation** while the user controls the topic, settings, and flow of the discussion.

---

## Features

* Split-screen UI (LLM1 panel & LLM2 panel)
* Turn-based conversation engine (LLM1 → LLM2 → LLM1 → ...)
* Independent model selection for each LLM
* Adjustable parameters:
  * Temperature
  * Max tokens
  * System prompt
* Manual **Send** button for each LLM
* Start, Pause, Reset controls
* Real-time streaming responses with character-by-character display
* Thinking indicators and typing animations
* Full conversation history display
* Supports **Groq** (FREE), **DeepSeek** (Free tier), and **OpenAI** models

---

## Tech Stack

**Frontend:**

* React + TypeScript
* Vite
* TailwindCSS
* Shadcn UI Components

**Backend:**

* Node.js + Express
* LangChain.js for LLM orchestration
* OpenAI SDK for API integration

**LLM Providers:**

* **Groq** (FREE) - Fast inference with free tier
  * Llama 3.1 8B Instant
  * Mixtral 8x7B
  * Llama 3.1 70B Versatile
* **DeepSeek** - Free tier available
  * DeepSeek Chat
* **OpenAI** - Paid API
  * GPT-3.5 Turbo
  * GPT-4o
  * GPT-4o Mini
  * GPT-4 (requires access)

---

## Architecture Overview

```
Frontend (React + TypeScript)
 ├─ LLM1 panel UI
 ├─ LLM2 panel UI
 ├─ Model settings and controls
 └─ REST/SSE calls → Backend API

Backend (Node.js + Express)
 ├─ API Routes (/api/llm/generate, /api/llm/stream)
 ├─ LLM Service (Groq, DeepSeek, OpenAI)
 ├─ Streaming Support (Server-Sent Events)
 └─ Returns responses → Frontend

LLM Providers
 ├─ Groq API (FREE) - Fast inference
 ├─ DeepSeek API (Free tier)
 └─ OpenAI API (Paid)
```

---

## Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/your-username/dual-llm-system.git
cd dual-llm-system
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure API Keys

Create a `.env` file in the root directory:

```bash
# Groq API Key (FREE - Recommended for testing)
# Get from: https://console.groq.com/keys
GROQ_API_KEY=your_groq_api_key_here

# DeepSeek API Key (Free tier available)
# Get from: https://platform.deepseek.com/usage
DEEPSEEK_API_KEY=your_deepseek_api_key_here

# OpenAI API Key (Paid - Optional)
# Get from: https://platform.openai.com/settings/organization/api-keys
OPENAI_API_KEY=your_openai_api_key_here

# Server Port (optional, defaults to 3002)
PORT=3002
```

**Getting API Keys:**
- **Groq** (FREE ⭐ Recommended): Sign up at [Groq Console](https://console.groq.com/keys) - Completely free with generous rate limits
- **DeepSeek**: Sign up at [DeepSeek Platform](https://platform.deepseek.com/usage) - Free tier available
- **OpenAI**: Sign up at [OpenAI Platform](https://platform.openai.com/settings/organization/api-keys) - Paid service

**Note:** You only need to set the API keys for the providers you want to use. For example, if you only want to use Groq (which is free), you only need to set `GROQ_API_KEY`.


```

### 4. Run the application

**Option 1: Run frontend and backend together (recommended for development)**

```bash
npm run dev:all
```

This will start:
- Frontend (Vite) on `http://localhost:8080`
- Backend (Express) on `http://localhost:3002`

**Option 2: Run separately**

Terminal 1 - Frontend:
```bash
npm run dev
```

Terminal 2 - Backend:
```bash
npm run dev:server
```

### 5. Access the application

Open your browser and navigate to:
- Frontend: `http://localhost:8080`
- Backend API Health Check: `http://localhost:3002/health`

---

## Project Structure

```
dual-chat-ai/
├── server/                 # Backend server
│   ├── index.js           # Express server entry point
│   ├── routes/            # API routes
│   │   └── llm.js        # LLM API endpoints (generate & stream)
│   └── services/          # Business logic
│       └── llmService.js  # LLM service (Groq, DeepSeek, OpenAI)
├── src/                   # Frontend React app
│   ├── components/        # React components
│   │   ├── ChatPanel.tsx  # Main chat panel component
│   │   ├── ModelSelector.tsx  # Model selection dropdown
│   │   ├── ParameterControl.tsx  # Temperature, tokens, etc.
│   │   └── ...
│   ├── pages/            # Page components
│   │   ├── Home.tsx      # Landing page with topic input
│   │   └── Index.tsx     # Main conversation page
│   ├── services/         # API client services
│   │   └── api.ts        # API client with streaming support
│   └── ...
├── .env                   # Environment variables (create this)
└── package.json
```

---

## How It Works

1. **User Input**: User enters a conversation topic and selects which LLM starts
2. **Initialization**: System sets up both LLMs with their independent configurations
3. **Turn-Based Flow**: 
   - User clicks "Send" on LLM1 panel → LLM1 generates response (streaming)
   - User clicks "Send" on LLM2 panel → LLM2 responds to LLM1 (streaming)
   - Conversation continues with alternating turns
4. **Streaming Responses**: 
   - Real-time character-by-character streaming for smooth UX
   - Each LLM sees the other's messages as context
   - Conversation history is maintained and passed to each model
5. **Backend Processing**: 
   - Uses OpenAI SDK for Groq, DeepSeek, and OpenAI models
   - LangChain for OpenAI model orchestration (optional)
   - Server-Sent Events (SSE) for streaming responses
   - Automatic model detection and API routing

---

## API Endpoints

### POST `/api/llm/generate`

Generates a non-streaming response from an LLM.

**Request Body:**
```json
{
  "model": "groq-llama-8b",
  "temperature": 0.7,
  "maxTokens": 200,
  "systemPrompt": "You are a helpful assistant...",
  "conversationHistory": [
    {
      "role": "user",
      "content": "Hello!"
    }
  ]
}
```

**Response:**
```json
{
  "content": "Hello! How can I help you?",
  "success": true
}
```

### POST `/api/llm/stream`

Generates a streaming response from an LLM using Server-Sent Events (SSE).

**Request Body:** (Same as `/generate`)

**Response:** Server-Sent Events stream
```
data: {"content": "Hello", "done": false}

data: {"content": "! How", "done": false}

data: {"content": "", "done": true}
```

**Supported Models:**
- Groq: `groq-llama-8b`, `groq-mixtral`, `groq-llama-70b`
- DeepSeek: `deepseek-chat`
- OpenAI: `gpt-3.5-turbo`, `gpt-4o`, `gpt-4o-mini`, `gpt-4`

---
## License

MIT License

---

## Author

Keshav Ghimire

---
