import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, Send, Sparkles, MessageSquare, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../i18n/LanguageContext';

export const ChatAssistantWidget: React.FC = () => {
  const { chatMessages, sendChatMessage, userProfile } = useApp();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [inputText, setInputText] = useState('');

  const firstName = userProfile.name ? userProfile.name.split(' ')[0] : 'Ravi';

  const handleQuickAction = (text: string) => {
    sendChatMessage(text);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendChatMessage(inputText);
    setInputText('');
  };

  return (
    <div className="bg-gradient-to-br from-white via-[#F0FDF4] to-[#ECFDF5] rounded-3xl p-5 sm:p-6 border border-emerald-100 shadow-xs relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-200/30 rounded-full blur-2xl pointer-events-none" />

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-[#15803D] flex items-center justify-center text-white shadow-sm">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-1.5">
              {t('chatAssistant', 'Chat Assistant')}
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#DCFCE7] text-[#15803D]">
                <Sparkles className="w-2.5 h-2.5" /> AI
              </span>
            </h3>
            <p className="text-xs text-gray-500 font-medium">Instant help with jobs & payments</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/chat')}
          className="text-xs font-bold text-[#15803D] hover:text-[#166534] flex items-center gap-1 hover:underline"
        >
          <span>Full Screen</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Greeting Bubble */}
      <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-2xs mb-4">
        <p className="text-sm font-semibold text-gray-800 leading-relaxed">
          Hi {firstName}! 👋
          <br />
          <span className="text-xs font-normal text-gray-600">
            {t('chatBotWelcome', 'How can I help you today?')}
          </span>
        </p>
      </div>

      {/* Quick Action Chips */}
      <div className="space-y-2 mb-4">
        <button
          type="button"
          onClick={() => handleQuickAction(t('showNearbyJobs', 'Show me nearby jobs'))}
          className="w-full text-left px-3.5 py-2.5 rounded-xl bg-white hover:bg-emerald-50 border border-emerald-100/80 text-xs font-semibold text-gray-700 hover:text-[#15803D] transition-all flex items-center justify-between group shadow-2xs"
        >
          <span>🔍 {t('showNearbyJobs', 'Show me nearby jobs')}</span>
          <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#15803D] transition-transform group-hover:translate-x-0.5" />
        </button>

        <button
          type="button"
          onClick={() => handleQuickAction(t('howToGetPaid', 'How to get paid?'))}
          className="w-full text-left px-3.5 py-2.5 rounded-xl bg-white hover:bg-emerald-50 border border-emerald-100/80 text-xs font-semibold text-gray-700 hover:text-[#15803D] transition-all flex items-center justify-between group shadow-2xs"
        >
          <span>💰 {t('howToGetPaid', 'How to get paid?')}</span>
          <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#15803D] transition-transform group-hover:translate-x-0.5" />
        </button>

        <button
          type="button"
          onClick={() => handleQuickAction(t('welfareSchemesForWorkers', 'Welfare schemes for workers'))}
          className="w-full text-left px-3.5 py-2.5 rounded-xl bg-white hover:bg-emerald-50 border border-emerald-100/80 text-xs font-semibold text-gray-700 hover:text-[#15803D] transition-all flex items-center justify-between group shadow-2xs"
        >
          <span>🏛️ {t('welfareSchemesForWorkers', 'Welfare schemes for workers')}</span>
          <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#15803D] transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>

      {/* Chat Messages Preview (last message if any) */}
      {chatMessages.length > 1 && (
        <div className="mb-4 space-y-2 max-h-36 overflow-y-auto pr-1">
          {chatMessages.slice(-2).map((msg) => (
            <div
              key={msg.id}
              className={`p-2.5 rounded-xl text-xs ${
                msg.sender === 'user'
                  ? 'bg-[#15803D] text-white ml-auto max-w-[85%]'
                  : 'bg-white text-gray-800 border border-gray-100 mr-auto max-w-[90%] whitespace-pre-line'
              }`}
            >
              {msg.text}
            </div>
          ))}
        </div>
      )}

      {/* Input bar and Start Chat button */}
      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={t('typeMessage', 'Type your question...')}
          className="flex-1 px-3.5 py-2 text-xs rounded-xl bg-white border border-gray-200 focus:border-[#15803D] focus:ring-1 focus:ring-[#15803D] outline-none"
        />
        <button
          type="submit"
          className="px-3.5 py-2 bg-[#15803D] hover:bg-[#166534] text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>

      <div className="mt-3 text-center">
        <button
          type="button"
          onClick={() => navigate('/chat')}
          className="w-full py-2 rounded-xl bg-white border border-[#15803D] text-[#15803D] hover:bg-[#ECFDF5] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          {t('startChat', 'Start Chat')}
        </button>
      </div>
    </div>
  );
};
