import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Phone, Send, ArrowLeft, CheckCheck, User, Loader2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { DashboardLayout } from '../../layouts/DashboardLayout';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../i18n/LanguageContext';
import {
    getMyConversations,
  subscribeToMessages,
  sendMessage,
  markConversationRead,
  type Conversation,
  type ChatMessageDoc,
} from '../../services/messageService';

export const EmployerMessagesPage: React.FC = () => {
  const { userProfile, showToast } = useApp();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessageDoc[]>([]);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState<boolean>(true);
  const [sending, setSending] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversations list for this employer
  const loadConversations = async (selectId?: string) => {
    if (!userProfile.uid) return;
    try {
      setLoading(true);
      const list = await getMyConversations(userProfile.uid, 'employer');
      setConversations(list);

      const targetId =
        selectId ||
        (location.state as { conversationId?: string })?.conversationId;

      if (targetId && list.some((c) => c.id === targetId)) {
        setActiveConversationId(targetId);
      } else if (targetId) {
        // If passed ID is brand new and not yet in list, keep it selected
        setActiveConversationId(targetId);
      } else if (list.length > 0) {
        setActiveConversationId((prev) =>
          prev && list.some((c) => c.id === prev) ? prev : list[0].id
        );
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
      showToast('Could not load conversations', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userProfile.uid) {
      loadConversations();
    }
  }, [userProfile.uid]);

  // Subscribe to real-time messages for the active conversation
  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }

    const unsubscribe = subscribeToMessages(activeConversationId, (newMessages) => {
      setMessages(newMessages);
    });

    return () => {
      unsubscribe();
    };
  }, [activeConversationId]);

  // Auto-scroll to the bottom of the chat on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
    // Mark the conversation as read when the employer opens it
  useEffect(() => {
    if (!activeConversationId) return;

    markConversationRead(activeConversationId, 'employer', userProfile.uid).catch((err) => {
      console.error('Failed to mark conversation as read:', err);
    });
  }, [activeConversationId, userProfile.uid]);

  const activeConversation = conversations.find((c) => c.id === activeConversationId);

  // Send message handler
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = replyText.trim();
    if (!text || !activeConversation || !userProfile.uid || sending) return;

    setSending(true);
    try {
      await sendMessage(
        activeConversation.id,
        userProfile.uid,
        activeConversation.workerId,
        text
      );
      setReplyText('');
      // Optimistically update conversation's last message in the list
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConversation.id
            ? {
                ...c,
                lastMessage: text,
                lastMessageAt: { seconds: Math.floor(Date.now() / 1000) },
                lastSenderId: userProfile.uid || '',
              }
            : c
        )
      );
    } catch (err) {
      console.error('Failed to send message:', err);
      showToast('Failed to send message. Please try again.', 'error');
    } finally {
      setSending(false);
    }
  };

  // Safe timestamp formatting that survives pending local writes
  const formatTime = (sentAt?: { seconds: number } | null): string => {
    if (!sentAt || typeof sentAt.seconds !== 'number') {
      return 'Just now';
    }
    const date = new Date(sentAt.seconds * 1000);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <DashboardLayout type="employer">
      <div className="space-y-4">
        <div>
          <button
            type="button"
            onClick={() => navigate('/employer-dashboard')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 mb-1.5 cursor-pointer"
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
          {/* Worker / conversations list */}
          <div className="md:col-span-5 border-r border-gray-100 flex flex-col">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-500">
                Applicants &amp; Inquiries
              </h3>
              {loading && <Loader2 className="w-3.5 h-3.5 text-gray-400 animate-spin" />}
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
              {conversations.length === 0 && !loading && (
                <div className="p-8 text-center text-xs text-gray-400">
                  <p className="font-semibold text-gray-600 mb-1">No conversations yet</p>
                  <span>Click &quot;Message&quot; on any applicant in your dashboard to start chatting.</span>
                </div>
              )}

              {conversations.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setActiveConversationId(item.id)}
                  className={`p-4 flex items-start gap-3 cursor-pointer transition-colors ${
                    activeConversationId === item.id ? 'bg-[#ECFDF5]/80' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="w-11 h-11 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-500 shrink-0">
                    <User className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h4 className="text-xs sm:text-sm font-bold text-gray-900 truncate">{item.workerName}</h4>
                      <span className="text-[10px] text-gray-400 shrink-0">{formatTime(item.lastMessageAt)}</span>
                    </div>
                    <p className="text-[11px] text-[#15803D] font-semibold mb-0.5">{item.jobTitle || 'Worker'}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {item.lastMessage || 'Conversation started'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chat thread */}
          <div className="md:col-span-7 flex flex-col h-full bg-[#FAFDF9]">
            {activeConversation ? (
              <>
                {/* Header */}
                <div className="p-4 border-b border-gray-100 bg-white flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-500 shrink-0">
                      <User className="w-5 h-5 text-gray-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">{activeConversation.workerName}</h3>
                      <p className="text-xs text-emerald-600 font-semibold">
                        {activeConversation.jobTitle || 'Worker'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      showToast(`Calling ${activeConversation.workerName}...`);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#15803D] text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call</span>
                  </button>
                </div>

                {/* Messages scroll pane */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 text-xs py-12">
                      <MessageSquare className="w-8 h-8 text-emerald-300 mb-2" />
                      <p className="font-semibold text-gray-700">No messages in this chat yet</p>
                      <p className="text-gray-400">Say hello or send job instructions to get started.</p>
                    </div>
                  )}

                  {messages.map((m) => {
                    const isMe = m.senderId === userProfile.uid;
                    return (
                      <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`p-3.5 rounded-2xl text-xs sm:text-sm max-w-[80%] leading-relaxed ${
                            isMe
                              ? 'bg-[#15803D] text-white rounded-tr-xs shadow-xs'
                              : 'bg-white text-gray-800 border border-gray-100 shadow-2xs rounded-tl-xs'
                          }`}
                        >
                          <p className="break-words">{m.text}</p>
                          <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${isMe ? 'text-emerald-200' : 'text-gray-400'}`}>
                            <span>{formatTime(m.sentAt)}</span>
                            {isMe && <CheckCheck className="w-3 h-3" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input bar */}
                <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-100 flex gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type reply or work instructions..."
                    disabled={sending}
                    className="flex-1 px-4 py-2.5 text-xs rounded-xl bg-gray-50 border border-gray-200 outline-none focus:bg-white focus:border-[#15803D]"
                  />
                  <button
                    type="submit"
                    disabled={!replyText.trim() || sending}
                    className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1 shadow-xs transition-colors ${
                      !replyText.trim() || sending
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-[#15803D] hover:bg-[#166534] text-white cursor-pointer'
                    }`}
                  >
                    <span>{sending ? 'Sending...' : t('send', 'Send')}</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-400">
                <MessageSquare className="w-12 h-12 text-gray-300 mb-3" />
                <h3 className="text-sm font-bold text-gray-700 mb-1">No conversation selected</h3>
                <p className="text-xs max-w-sm">
                  Select an applicant from the list on the left, or click &quot;Message&quot; on an application in your dashboard.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
