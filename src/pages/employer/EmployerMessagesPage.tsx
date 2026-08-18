import React, { useState } from 'react';
import { MessageSquare, Phone, Send, ArrowLeft, CheckCheck, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../i18n/LanguageContext';

export const EmployerMessagesPage: React.FC = () => {
  const { showToast } = useApp();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [activeWorkerId, setActiveWorkerId] = useState('w-1');
  const [replyText, setReplyText] = useState('');

  const [threads, setThreads] = useState([
    {
      id: 'w-1',
      name: 'Ravi Kumar',
      trade: 'Carpenter (3 yrs exp)',
      phone: '9876543210',
      lastMessage: 'Namaste sir, I have 3 years of modular kitchen experience. Can join tomorrow.',
      time: '10:45 AM',
      messages: [
        { sender: 'them', text: 'Namaste sir, I saw your post for Master Carpenter in Andheri.', time: '10:30 AM' },
        { sender: 'me', text: 'Namaste Ravi. Do you have experience with Hettich and Hafele fittings?', time: '10:40 AM' },
        { sender: 'them', text: 'Yes sir, I have 3 years of modular kitchen experience. Can join tomorrow at 9 AM.', time: '10:45 AM' },
      ],
    },
    {
      id: 'w-2',
      name: 'Suresh Yadav',
      trade: 'Mason (5 yrs exp)',
      phone: '9812345678',
      lastMessage: 'Sir, I have a team of 3 helpers ready for plastering.',
      time: 'Yesterday',
      messages: [
        { sender: 'them', text: 'Sir, I have a team of 3 helpers ready for plastering.', time: 'Yesterday' },
      ],
    },
  ]);

  const activeThread = threads.find((t) => t.id === activeWorkerId) || threads[0];

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setThreads((prev) =>
      prev.map((item) =>
        item.id === activeWorkerId
          ? {
              ...item,
              lastMessage: replyText,
              time: 'Just now',
              messages: [
                ...item.messages,
                { sender: 'me', text: replyText, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
              ],
            }
          : item
      )
    );

    setReplyText('');
    showToast('Message sent to worker');
  };

  return (
    <DashboardLayout type="employer">
      <div className="space-y-4">
        <div>
          <button
            type="button"
            onClick={() => navigate('/employer-dashboard')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 mb-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
          <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-[#15803D]" />
            <span>{t('messages', 'Worker Applications & Chats')}</span>
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden h-[600px]">
          {/* Worker list */}
          <div className="md:col-span-5 border-r border-gray-100 flex flex-col">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-500">
                Applicants &amp; Inquiries
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
              {threads.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setActiveWorkerId(item.id)}
                  className={`p-4 flex items-start gap-3 cursor-pointer transition-colors ${
                    activeWorkerId === item.id ? 'bg-[#ECFDF5]/80' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="w-11 h-11 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-500 shrink-0">
                    <User className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h4 className="text-xs sm:text-sm font-bold text-gray-900 truncate">{item.name}</h4>
                      <span className="text-[10px] text-gray-400 shrink-0">{item.time}</span>
                    </div>
                    <p className="text-[11px] text-[#15803D] font-semibold mb-0.5">{item.trade}</p>
                    <p className="text-xs text-gray-500 truncate">{item.lastMessage}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chat thread */}
          <div className="md:col-span-7 flex flex-col h-full bg-[#FAFDF9]">
            <div className="p-4 border-b border-gray-100 bg-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-500 shrink-0">
                  <User className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">{activeThread.name}</h3>
                  <p className="text-xs text-emerald-600 font-semibold">{activeThread.trade}</p>
                </div>
              </div>

              <a
                href={`tel:${activeThread.phone}`}
                onClick={(e) => {
                  e.preventDefault();
                  showToast(`Calling ${activeThread.name} at +91 ${activeThread.phone}...`);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#15803D] text-xs font-bold transition-colors cursor-pointer"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call</span>
              </a>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {activeThread.messages.map((m, idx) => {
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

            <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-100 flex gap-2">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type reply or work instructions..."
                className="flex-1 px-4 py-2.5 text-xs rounded-xl bg-gray-50 border border-gray-200 outline-none focus:bg-white focus:border-[#15803D]"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-[#15803D] hover:bg-[#166534] text-white rounded-xl font-bold text-xs flex items-center gap-1 shadow-xs cursor-pointer"
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
