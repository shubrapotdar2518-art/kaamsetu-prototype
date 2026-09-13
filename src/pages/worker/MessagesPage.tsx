import React, { useState } from 'react';
import { MessageSquare, Phone, Send, ArrowLeft, CheckCheck, Clock, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../i18n/LanguageContext';

export const MessagesPage: React.FC = () => {
  const { showToast } = useApp();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [activeChatId, setActiveChatId] = useState('c-1');
  const [replyText, setReplyText] = useState('');

  const [conversations, setConversations] = useState([
    {
      id: 'c-1',
      name: 'Sharma Interior Solutions',
      role: 'Employer',
      lastMessage: 'Ravi, please bring your measuring tape and level tool tomorrow at 9 AM.',
      time: '11:30 AM',
      unread: 1,
      messages: [
        { sender: 'them', text: 'Namaste Ravi! We reviewed your 3-year carpentry experience and approved your application.', time: '11:00 AM' },
        { sender: 'me', text: 'Thank you Sharma ji. I am available tomorrow for the full day modular kitchen work.', time: '11:15 AM' },
        { sender: 'them', text: 'Ravi, please bring your measuring tape and level tool tomorrow at 9 AM. Address: Wing B, Oberoi Sky, Andheri West.', time: '11:30 AM' },
      ],
    },
    {
      id: 'c-2',
      name: 'Apex Woodcraft Ltd',
      role: 'Employer',
      lastMessage: 'Job is confirmed for Monday. Wage is ₹900/day with cash payout.',
      time: 'Yesterday',
      unread: 0,
      messages: [
        { sender: 'them', text: 'Job is confirmed for Monday. Wage is ₹900/day with cash payout.', time: 'Yesterday' },
      ],
    },
  ]);

  const activeChat = conversations.find((c) => c.id === activeChatId) || conversations[0];

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeChatId
          ? {
              ...c,
              lastMessage: replyText,
              time: 'Just now',
              messages: [
                ...c.messages,
                { sender: 'me', text: replyText, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
              ],
            }
          : c
      )
    );

    setReplyText('');
    showToast('Message sent to employer');
  };

  return (
    <DashboardLayout type="worker">
      <div className="space-y-4">
        <div>
          <button
            type="button"
            onClick={() => navigate('/worker-dashboard')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 mb-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
          <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-[#15803D]" />
            <span>{t('messages', 'Employer Messages')}</span>
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden h-[600px]">
          {/* Left conversations list */}
          <div className="md:col-span-5 border-r border-gray-100 flex flex-col">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-500">
                Recent Chats
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
              {conversations.map((c) => (
                <div
                  key={c.id}
                  onClick={() => setActiveChatId(c.id)}
                  className={`p-4 flex items-start gap-3 cursor-pointer transition-colors ${
                    activeChatId === c.id ? 'bg-[#ECFDF5]/80' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="w-11 h-11 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-500 shrink-0">
                    <User className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h4 className="text-xs sm:text-sm font-bold text-gray-900 truncate">{c.name}</h4>
                      <span className="text-[10px] text-gray-400 shrink-0">{c.time}</span>
                    </div>
                    <p className="text-[11px] text-[#15803D] font-semibold mb-0.5">{c.role}</p>
                    <p className="text-xs text-gray-500 truncate">{c.lastMessage}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right chat message thread */}
          <div className="md:col-span-7 flex flex-col h-full bg-[#FAFDF9]">
            {/* Thread Header */}
            <div className="p-4 border-b border-gray-100 bg-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-500 shrink-0">
                  <User className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">{activeChat.name}</h3>
                  <p className="text-xs text-emerald-600 font-semibold">{activeChat.role}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => showToast(`Calling ${activeChat.name}...`)}
                className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#15803D] transition-colors"
                title="Call Employer"
              >
                <Phone className="w-4 h-4" />
              </button>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {activeChat.messages.map((m, idx) => {
                const isMe = m.sender === 'me';
                return (
                  <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`p-3.5 rounded-2xl text-xs sm:text-sm max-w-[80%] leading-relaxed ${
                        isMe
                          ? 'bg-[#15803D] text-white rounded-tr-xs shadow-xs'
                          : 'bg-white text-gray-800 border border-gray-100 shadow-2xs rounded-tl-xs'
                      }`}
                    >
                      <p>{m.text}</p>
                      <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${isMe ? 'text-emerald-200' : 'text-gray-400'}`}>
                        <span>{m.time}</span>
                        {isMe && <CheckCheck className="w-3 h-3" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSendReply} className="p-3 bg-white border-t border-gray-100 flex gap-2">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your message to employer..."
                className="flex-1 px-4 py-2.5 text-xs rounded-xl bg-gray-50 border border-gray-200 outline-none focus:bg-white focus:border-[#15803D]"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-[#15803D] hover:bg-[#166534] text-white rounded-xl font-bold text-xs flex items-center gap-1 shadow-xs"
              >
                <span>{t('send', 'Send')}</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
