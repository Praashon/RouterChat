import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'

export interface ChatMessage {
  id: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatSettings {
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  presence_penalty?: number;
  frequency_penalty?: number;
}

export interface Chat {
  id: string;
  title: string;
  messages: ChatMessage[];
  model: string;
  systemPrompt: string;
  settings: ChatSettings;
  createdAt: number;
  updatedAt: number;
}

export interface AppState {
  apiKey: string;
  setApiKey: (key: string) => void;
  
  chats: Chat[];
  activeChatId: string | null;
  
  createChat: (model: string, systemPrompt?: string, title?: string) => string;
  deleteChat: (id: string) => void;
  setActiveChat: (id: string | null) => void;
  updateChatTitle: (id: string, title: string) => void;
  
  addMessage: (chatId: string, message: Omit<ChatMessage, "id"> & { id?: string }) => void;
  updateMessage: (chatId: string, messageId: string, content: string) => void;
  
  updateChatModel: (chatId: string, model: string) => void;
  updateChatSettings: (chatId: string, settings: Partial<ChatSettings>) => void;
  updateSystemPrompt: (chatId: string, prompt: string) => void;
  
  // Personalization
  userName: string;
  assistantName: string;
  defaultSystemPrompt: string;
  setUserName: (name: string) => void;
  setAssistantName: (name: string) => void;
  setDefaultSystemPrompt: (prompt: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      apiKey: '',
      setApiKey: (key) => set({ apiKey: key }),
      
      chats: [],
      activeChatId: null,
      
      createChat: (model, systemPrompt, title) => {
        const id = uuidv4();
        const state = get();
        const initialSystemPrompt = systemPrompt !== undefined ? systemPrompt : state.defaultSystemPrompt;
        
        const newChat: Chat = {
          id,
          title: title || 'New Chat',
          messages: [],
          model,
          systemPrompt: initialSystemPrompt,
          settings: {
            temperature: 0.7,
            top_p: 1,
            presence_penalty: 0,
            frequency_penalty: 0,
          },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((state) => ({
          chats: [newChat, ...state.chats],
          activeChatId: id,
        }));
        return id;
      },
      
      deleteChat: (id) => set((state) => ({
        chats: state.chats.filter(c => c.id !== id),
        activeChatId: state.activeChatId === id ? (state.chats.find(c => c.id !== id)?.id || null) : state.activeChatId,
      })),
      
      setActiveChat: (id) => set({ activeChatId: id }),
      
      updateChatTitle: (id, title) => set((state) => ({
        chats: state.chats.map(c => c.id === id ? { ...c, title, updatedAt: Date.now() } : c)
      })),
      
      addMessage: (chatId, message) => set((state) => ({
        chats: state.chats.map(c => c.id === chatId ? {
          ...c,
          messages: [...c.messages, { ...message, id: message.id || uuidv4() }],
          updatedAt: Date.now()
        } : c)
      })),
      
      updateMessage: (chatId, messageId, content) => set((state) => ({
        chats: state.chats.map(c => c.id === chatId ? {
          ...c,
          messages: c.messages.map(m => m.id === messageId ? { ...m, content } : m),
          updatedAt: Date.now()
        } : c)
      })),
      
      updateChatModel: (chatId, model) => set((state) => ({
        chats: state.chats.map(c => c.id === chatId ? { ...c, model, updatedAt: Date.now() } : c)
      })),
      
      updateChatSettings: (chatId, settings) => set((state) => ({
        chats: state.chats.map(c => c.id === chatId ? { ...c, settings: { ...c.settings, ...settings }, updatedAt: Date.now() } : c)
      })),
      
      updateSystemPrompt: (chatId, prompt) => set((state) => ({
        chats: state.chats.map(c => c.id === chatId ? { ...c, systemPrompt: prompt, updatedAt: Date.now() } : c)
      })),
      
      userName: 'User',
      assistantName: 'Assistant',
      defaultSystemPrompt: '',
      setUserName: (name) => set({ userName: name }),
      setAssistantName: (name) => set({ assistantName: name }),
      setDefaultSystemPrompt: (prompt) => set({ defaultSystemPrompt: prompt }),
    }),
    {
      name: 'routerchat-storage',
      partialize: (state) => ({
        apiKey: state.apiKey,
        chats: state.chats,
        activeChatId: state.activeChatId,
        userName: state.userName,
        assistantName: state.assistantName,
        defaultSystemPrompt: state.defaultSystemPrompt,
      }),
    }
  )
);
