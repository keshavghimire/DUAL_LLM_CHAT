
# # Dual LLM Conversation System

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
* Thinking indicators
* Full conversation history display
* Supports **OpenAI** and **DeepSeek** models

---

## Tech Stack

**Frontend:**

* React 
* TailwindCSS / CSS

**Backend:**

* Node.js + Express
* LangChain 
* Axios / Fetch for LLM API calls

**LLM Providers:**

* OpenAI API
* DeepSeek API

---

## Architecture Overview

```
Frontend (React)
 ├─ LLM1 panel UI
 ├─ LLM2 panel UI
 ├─ Model settings and controls
 └─ REST/WS calls → Backend API

Backend (Node.js)
 ├─ Conversation Controller
 ├─ Turn Manager
 ├─ LLM Client (OpenAI + DeepSeek)
 ├─ LangChain Orchestrator (optional)
 └─ Returns responses → Frontend

LLM Providers
 ├─ OpenAI API
 └─ DeepSeek API
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



### 3. Run the development server

```bash
npm run dev
```

---

## License

MIT License

---

## Author

Keshav Ghimire

---
