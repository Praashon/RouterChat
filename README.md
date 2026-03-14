# RouterChat

A premium, desktop-class AI chat interface built on Next.js 15, powered by [OpenRouter](https://openrouter.ai). This project lets you securely access thousands of AI models (both free and paid) including Claude, GPT-4o, Gemini, Llama, and Mistral, all through a beautiful interface.
It took around 8 hours to build this project. So, a star would be appreciated.

No database or backend required. Everything runs locally in your browser.

##  Features

- **Bring Your Own Key:** Enter your OpenRouter API key and access thousands of LLMs instantly. Your key and chat history are securely stored in your browser's local storage (`localStorage`).
- **Premium Design:** Flawless minimalist aesthetics built using Tailwind CSS and shadcn/ui.
- **Dynamic Model Selection:** Features an intelligent model selector with advanced filtering: Free, Paid, Recommended, Latest, Popular, and Mostly Used.
- **Failover & Zero-Downtime Fallback Engine:** If a free model gets rate-limited (429), it instantly and seamlessly routes your request to highly-available backup models (like Gemini 2.5 Flash, Llama 3.3 70B, etc).
- **Beautiful Markdown:** Supports robust Markdown parsing including syntax-highlighted code blocks with built-in "Copy" functionality.
- **Personalization:** Fully customize the Chat User Name, AI Assistant Name, and Default System Prompts via a dedicated settings page.
- **Privacy First:** Detailed handling logic immediately helps users fix OpenRouter privacy routing issues (e.g., "404 No Endpoints").
- **Strict Guidelines enforced:** Hardcoded prompt layers aggressively prohibit the use of unwanted stylistic traits like em dashes and emojis unless the user explicitly requests them.

##  Tech Stack

- **Framework:** [Next.js 15](https://nextjs.org/) (App Router, Turbopack)
- **Language:** TypeScript
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Components:** [shadcn/ui](https://ui.shadcn.com/) (Radix Primitives)
- **State Management:** [Zustand](https://zustand-demo.pmnd.rs/) (with persistent storage)
- **Markdown Processing:** `react-markdown`, `remark-gfm`, `rehype-raw`, `react-syntax-highlighter`
- **ICONS:** [Lucide React](https://lucide.dev/)
- **API Wrapper:** Official `openai` npm package configured for OpenRouter

##  Getting Started

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) (v18+) and `npm` installed.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/RouterChat.git
   cd RouterChat
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

##  Setup Guide (OpenRouter)

When you first open the app, follow the onboarding guide:

1. **Get an API Key:** Visit [openrouter.ai/keys](https://openrouter.ai/keys) to create a free key.
2. **Allow All Providers:** Go to your [OpenRouter Privacy Settings](https://openrouter.ai/settings/privacy) and set your Data Policy to "Allow all providers" to ensure all requests route properly without throwing a 404 block.
3. **Paste Key:** Click the "API Key" button in the app's top right corner and paste your key.

##  Usage Notes

- **Themes:** The default theme is Light mode to maintain a clean aesthetic, but Dark Mode is fully supported and toggled via the header.
- **Adding Credits:** Some models are strictly premium. The app detects these models and prompts you to add credits to your OpenRouter account if requested.

##  License

This project is open-source. Feel free to fork, customize, and deploy your own premium chat client.
