import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, ArrowLeft, Sparkles, Mic, HelpCircle, PhoneCall } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../i18n/LanguageContext';

export const ChatAssistantPage: React.FC = () => {
  const { chatMessages, sendChatMessage, userProfile, showToast } = useApp();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendChatMessage(input);
    setInput('');
  };

  const handleQuickChip = (text: string) => {
    sendChatMessage(text);
  };

  return (
    <DashboardLayout type="worker">
      <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-140px)]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/worker-dashboard')}
              className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="w-10 h-10 rounded-2xl bg-[#15803D] flex items-center justify-center text-white shadow-sm">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-extrabold text-gray-900 flex items-center gap-1.5">
                <span>KaamSetu Saathi</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#DCFCE7] text-[#15803D]">
                  Online
                </span>
              </h1>
              <p className="text-xs text-gray-500">24x7 Multi-lingual Worker Assistant</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => showToast('Connecting to KaamSetu Worker Toll-free Helpline: 1800-200-5226')}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 text-xs font-bold text-[#15803D] hover:bg-emerald-100"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Toll-Free Helpline</span>
          </button>
        </div>

        {/* Chat message bubbles pane */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4">
          {chatMessages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div key={msg.id} className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-[#15803D] text-white flex items-center justify-center shrink-0 mt-1 shadow-2xs">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={`p-4 rounded-2xl text-xs sm:text-sm max-w-[82%] leading-relaxed ${
                    isUser
                      ? 'bg-[#15803D] text-white rounded-tr-xs shadow-xs'
                      : 'bg-white text-gray-800 border border-gray-100 shadow-2xs rounded-tl-xs whitespace-pre-line'
                  }`}
                >
                  <p>{msg.text}</p>
                  <span className={`text-[10px] block mt-1.5 font-medium ${isUser ? 'text-emerald-200 text-right' : 'text-gray-400'}`}>
                    {msg.time}
                  </span>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 shrink-0">
          <button
            type="button"
            onClick={() => handleQuickChip('Show me nearby carpenter jobs with high pay')}
            className="px-3 py-1.5 rounded-full bg-white border border-emerald-200 text-xs font-semibold text-[#15803D] hover:bg-emerald-50 whitespace-nowrap shrink-0 shadow-2xs"
          >
            🔨 Jobs matching my trade
          </button>
          <button
            type="button"
            onClick={() => handleQuickChip('How does KaamSetu guarantee my daily payment?')}
            className="px-3 py-1.5 rounded-full bg-white border border-emerald-200 text-xs font-semibold text-[#15803D] hover:bg-emerald-50 whitespace-nowrap shrink-0 shadow-2xs"
          >
            💳 Guaranteed Daily Wage
          </button>
          <button
            type="button"
            onClick={() => handleQuickChip('How to apply for Ayushman health insurance?')}
            className="px-3 py-1.5 rounded-full bg-white border border-emerald-200 text-xs font-semibold text-[#15803D] hover:bg-emerald-50 whitespace-nowrap shrink-0 shadow-2xs"
          >
            🏥 ₹5 Lakh Health Cover
          </button>
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="flex items-center gap-2 p-2 bg-white rounded-2xl border border-gray-200 shadow-sm shrink-0">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about jobs, wages, or welfare schemes in your language..."
            className="flex-1 px-3 py-2 text-xs sm:text-sm text-gray-800 outline-none placeholder:text-gray-400"
          />
          <button
            type="button"
            onClick={() => showToast('Voice search activated. Please speak your question...')}
            className="p-2 text-gray-400 hover:text-[#15803D] hover:bg-gray-50 rounded-xl transition-colors"
            title="Voice Input"
          >
            <Mic className="w-4 h-4" />
          </button>
          <button
            type="submit"
            className="px-4 py-2.5 bg-[#15803D] hover:bg-[#166534] text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <span>{t('send', 'Send')}</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
};
