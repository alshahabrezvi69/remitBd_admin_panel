import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Conversation, SupportMessage, SupportCategory, SupportStatus } from '../../types';
import { VoiceAudioPlayer } from './VoiceAudioPlayer';
import { VoiceRecorder } from './VoiceRecorder';
import {
  MessageSquare,
  Plus,
  ArrowLeft,
  Send,
  Clock,
  CheckCheck,
  Check,
  AlertCircle,
  HelpCircle,
  PhoneCall,
  ShieldCheck,
  ArrowDownLeft,
  ArrowUpRight,
  Sparkles,
  RefreshCw,
  Search,
  Filter,
  Paperclip,
  CheckCircle2,
  Lock,
  Headphones,
  UserCheck,
} from 'lucide-react';

interface CustomerSupportChatProps {
  initialTransactionId?: string;
  initialTransactionType?: 'DEPOSIT' | 'TRANSFER';
}

export const CustomerSupportChat: React.FC<CustomerSupportChatProps> = ({
  initialTransactionId,
  initialTransactionType,
}) => {
  const { currentCustomer } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isAgentTyping, setIsAgentTyping] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // New ticket modal state
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [newCategory, setNewCategory] = useState<SupportCategory>('DEPOSIT_ISSUE');
  const [newSubject, setNewSubject] = useState('');
  const [newInitialText, setNewInitialText] = useState('');
  const [selectedTxId, setSelectedTxId] = useState<string>(initialTransactionId || '');
  const [selectedTxType, setSelectedTxType] = useState<'DEPOSIT' | 'TRANSFER'>(initialTransactionType || 'DEPOSIT');
  const [userTransactions, setUserTransactions] = useState<{ deposits: any[]; transfers: any[] }>({ deposits: [], transfers: [] });
  const [newSubmitting, setNewSubmitting] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<any>(null);

  // Initial load
  useEffect(() => {
    fetchConversations();
    fetchUserTransactions();

    // If initial transaction provided, open new ticket dialog pre-filled
    if (initialTransactionId) {
      setIsNewTicketOpen(true);
      setSelectedTxId(initialTransactionId);
      setSelectedTxType(initialTransactionType || 'DEPOSIT');
      setNewSubject(`Inquiry regarding ${initialTransactionType} #${initialTransactionId}`);
    }
  }, [currentCustomer?.id]);

  // Real-time polling & SSE listener fallback
  useEffect(() => {
    const pollInterval = setInterval(() => {
      if (activeConversationId) {
        fetchActiveConversationMessages(activeConversationId, true);
      }
      fetchConversations(true);
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [activeConversationId]);

  // Auto scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAgentTyping]);

  const fetchConversations = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch('/api/customer/support/conversations');
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const fetchUserTransactions = async () => {
    try {
      const res = await fetch('/api/customer/transactions');
      if (res.ok) {
        const data = await res.json();
        setUserTransactions(data);
      }
    } catch (err) {
      console.error('Failed to load customer transactions:', err);
    }
  };

  const openConversation = async (id: string) => {
    setActiveConversationId(id);
    setMessagesLoading(true);
    try {
      const res = await fetch(`/api/customer/support/conversations/${id}`);
      if (res.ok) {
        const data = await res.json();
        setActiveConversation(data.conversation);
        setMessages(data.messages || []);
        // Refresh conversation list to clear unread badge
        fetchConversations(true);
      }
    } catch (err) {
      console.error('Failed to load conversation details:', err);
    } finally {
      setMessagesLoading(false);
    }
  };

  const fetchActiveConversationMessages = async (id: string, silent = false) => {
    try {
      const res = await fetch(`/api/customer/support/conversations/${id}`);
      if (res.ok) {
        const data = await res.json();
        setActiveConversation(data.conversation);
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error('Failed to refresh messages:', err);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !activeConversationId || isSending) return;

    const textToSend = inputText.trim();
    setInputText('');
    setIsSending(true);

    // Optimistic message append
    const tempMsg: SupportMessage = {
      id: `temp-${Date.now()}`,
      conversationId: activeConversationId,
      senderType: 'CUSTOMER',
      senderId: currentCustomer?.id || 'usr-101',
      senderName: currentCustomer?.fullName || 'Customer',
      messageType: 'TEXT',
      text: textToSend,
      status: 'SENT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      const res = await fetch(`/api/customer/support/conversations/${activeConversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToSend }),
      });
      if (res.ok) {
        const data = await res.json();
        // Replace temp message with server message
        setMessages((prev) => prev.map((m) => (m.id === tempMsg.id ? data.message : m)));
        fetchConversations(true);
      }
    } catch (err) {
      console.error('Failed to send text message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleSendVoice = async (voiceData: {
    audioBase64: string;
    mimeType: string;
    durationSeconds: number;
    sizeBytes: number;
    waveform: number[];
  }) => {
    if (!activeConversationId) return;

    try {
      const res = await fetch(`/api/customer/support/conversations/${activeConversationId}/voice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(voiceData),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, data.message]);
        fetchConversations(true);
      }
    } catch (err) {
      console.error('Failed to send voice recording:', err);
    }
  };

  const handleTyping = (text: string) => {
    setInputText(text);
    if (!activeConversationId) return;

    // Send typing broadcast to server
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    fetch(`/api/customer/support/conversations/${activeConversationId}/typing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isTyping: true }),
    }).catch(() => {});

    typingTimeoutRef.current = setTimeout(() => {
      fetch(`/api/customer/support/conversations/${activeConversationId}/typing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isTyping: false }),
      }).catch(() => {});
    }, 2000);
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInitialText.trim()) return;

    setNewSubmitting(true);
    try {
      const res = await fetch('/api/customer/support/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: newCategory,
          subject: newSubject || `${newCategory.replace(/_/g, ' ')} Inquiry`,
          initialMessage: newInitialText.trim(),
          relatedTransactionId: selectedTxId || undefined,
          relatedTransactionType: selectedTxType || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setIsNewTicketOpen(false);
        setNewInitialText('');
        setNewSubject('');
        setSelectedTxId('');
        await fetchConversations();
        if (data.conversation?.id) {
          openConversation(data.conversation.id);
        }
      }
    } catch (err) {
      console.error('Failed to create ticket:', err);
    } finally {
      setNewSubmitting(false);
    }
  };

  const getCategoryLabel = (cat: SupportCategory) => {
    switch (cat) {
      case 'DEPOSIT_ISSUE':
        return 'Deposit Issue';
      case 'TRANSFER_DELAY':
        return 'Transfer Delay';
      case 'ACCOUNT_VERIFICATION':
        return 'KYC Verification';
      case 'PAYMENT_METHOD':
        return 'Payment Method';
      case 'FX_INQUIRY':
        return 'Exchange Rates';
      default:
        return 'General Support';
    }
  };

  const getCategoryColor = (cat: SupportCategory) => {
    switch (cat) {
      case 'DEPOSIT_ISSUE':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'TRANSFER_DELAY':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'ACCOUNT_VERIFICATION':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'PAYMENT_METHOD':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'FX_INQUIRY':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusBadge = (status: SupportStatus) => {
    switch (status) {
      case 'OPEN':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">Open</span>;
      case 'PENDING':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">In Review</span>;
      case 'RESOLVED':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">Resolved</span>;
      case 'CLOSED':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">Closed</span>;
    }
  };

  const filteredConversations = conversations.filter((c) => {
    if (filterStatus !== 'ALL' && c.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchSubject = c.subject?.toLowerCase().includes(q);
      const matchTicket = c.ticketId.toLowerCase().includes(q);
      const matchLastMsg = c.lastMessageText?.toLowerCase().includes(q);
      if (!matchSubject && !matchTicket && !matchLastMsg) return false;
    }
    return true;
  });

  return (
    <div className="w-full max-w-5xl mx-auto py-2">
      {/* If No Active Conversation: Show Ticket List */}
      {!activeConversationId ? (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Live Support Desk • Real-Time Voice & Chat
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  Customer Support
                </h1>
                <p className="text-sm text-emerald-100 max-w-xl">
                  Have a question regarding your Add Money deposits, Send Money payouts, or account verification? Our support team is ready to assist you.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsNewTicketOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm shadow-lg transition transform active:scale-95 shrink-0"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>New Inquiry</span>
              </button>
            </div>
          </div>

          {/* Search & Status Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search ticket # or subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              {['ALL', 'OPEN', 'PENDING', 'RESOLVED', 'CLOSED'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setFilterStatus(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                    filterStatus === st
                      ? 'bg-emerald-700 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st === 'ALL' ? 'All Tickets' : st}
                </button>
              ))}
            </div>
          </div>

          {/* Conversations List */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin mb-3 text-emerald-600" />
              <p className="text-sm font-medium">Loading your support conversations...</p>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <Headphones className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-800">No Support Tickets Found</h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto">
                  {searchQuery || filterStatus !== 'ALL'
                    ? 'No conversations match your search filter criteria.'
                    : 'You do not have any active support inquiries right now. If you need assistance with any transaction, create a new inquiry.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsNewTicketOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow transition"
              >
                <Plus className="w-4 h-4" /> Start New Inquiry
              </button>
            </div>
          ) : (
            <div className="grid gap-3 sm:gap-4">
              {filteredConversations.map((conv) => {
                const hasUnread = (conv.unreadCustomerCount || 0) > 0;
                return (
                  <div
                    key={conv.id}
                    onClick={() => openConversation(conv.id)}
                    className={`bg-white rounded-2xl p-4 sm:p-5 border transition-all cursor-pointer hover:border-emerald-400 hover:shadow-md ${
                      hasUnread
                        ? 'border-emerald-500 ring-1 ring-emerald-500/20 bg-emerald-50/20'
                        : 'border-slate-200'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                          {conv.ticketId}
                        </span>
                        <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-md border ${getCategoryColor(conv.category)}`}>
                          {getCategoryLabel(conv.category)}
                        </span>
                        {getStatusBadge(conv.status)}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          {conv.lastMessageAt
                            ? new Date(conv.lastMessageAt).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : new Date(conv.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 flex items-start justify-between gap-4">
                      <div className="space-y-1 flex-1">
                        <h4 className="text-sm sm:text-base font-bold text-slate-900">
                          {conv.subject}
                        </h4>
                        <p className="text-xs text-slate-600 line-clamp-2">
                          {conv.lastMessageType === 'VOICE' ? '🎤 Voice Message' : conv.lastMessageText || 'No message'}
                        </p>

                        {/* Linked transaction preview */}
                        {conv.relatedTransactionInfo && (
                          <div className="mt-2 inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600 font-medium">
                            {conv.relatedTransactionType === 'DEPOSIT' ? (
                              <ArrowDownLeft className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <ArrowUpRight className="w-3 h-3 text-blue-600" />
                            )}
                            <span>
                              {conv.relatedTransactionInfo.type}: {conv.relatedTransactionInfo.reference} ({conv.relatedTransactionInfo.amount} {conv.relatedTransactionInfo.currency})
                            </span>
                          </div>
                        )}
                      </div>

                      {hasUnread && (
                        <div className="flex flex-col items-end shrink-0">
                          <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center animate-bounce shadow">
                            {conv.unreadCustomerCount}
                          </span>
                          <span className="text-[10px] font-semibold text-emerald-700 mt-1">New Reply</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Active Chat View */
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden flex flex-col h-[700px]">
          {/* Chat Header */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setActiveConversationId(null);
                  setActiveConversation(null);
                  fetchConversations();
                }}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                title="Back to Tickets"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-emerald-400">
                    {activeConversation?.ticketId}
                  </span>
                  {activeConversation && getStatusBadge(activeConversation.status)}
                </div>
                <h3 className="text-sm sm:text-base font-bold text-white line-clamp-1">
                  {activeConversation?.subject}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden sm:flex flex-col items-end text-xs text-emerald-300">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  RemitBD Support Team
                </span>
                <span className="text-[10px] text-slate-400">
                  {activeConversation?.assignedAdminName ? `Assigned to: ${activeConversation.assignedAdminName}` : 'Live Agent Queue'}
                </span>
              </div>
            </div>
          </div>

          {/* Linked Transaction Card Banner (If any) */}
          {activeConversation?.relatedTransactionInfo && (
            <div className="bg-emerald-50 border-b border-emerald-100 p-3 px-4 flex items-center justify-between text-xs text-emerald-900 shrink-0">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span className="font-semibold">Linked Transaction:</span>
                <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-emerald-200">
                  {activeConversation.relatedTransactionInfo.reference}
                </span>
                <span>
                  ({activeConversation.relatedTransactionInfo.amount} {activeConversation.relatedTransactionInfo.currency})
                </span>
              </div>
              <span className="font-bold px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-800 text-[10px]">
                {activeConversation.relatedTransactionInfo.status}
              </span>
            </div>
          )}

          {/* Message Stream */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/50">
            {messagesLoading ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin mb-2 text-emerald-600" />
                <p className="text-xs">Loading message history...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                No messages yet. Send a message to start conversation.
              </div>
            ) : (
              messages.map((msg) => {
                const isCustomer = msg.senderType === 'CUSTOMER';
                const isSystem = msg.senderType === 'SYSTEM';

                if (isSystem) {
                  return (
                    <div key={msg.id} className="flex justify-center my-3">
                      <div className="bg-slate-200/80 text-slate-700 px-3 py-1 rounded-full text-[11px] font-medium flex items-center gap-1.5 shadow-sm max-w-md text-center">
                        <Sparkles className="w-3 h-3 text-amber-600 shrink-0" />
                        <span>{msg.text}</span>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isCustomer ? 'items-end' : 'items-start'}`}
                  >
                    {/* Sender identity */}
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 mb-1 px-1">
                      {!isCustomer && (
                        <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                          <UserCheck className="w-3 h-3" />
                          {msg.senderName} ({msg.senderRole || 'Admin'})
                        </span>
                      )}
                      <span>
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {/* Message Bubble */}
                    {msg.messageType === 'VOICE' && msg.mediaUrl ? (
                      <VoiceAudioPlayer
                        mediaUrl={msg.mediaUrl}
                        duration={msg.mediaDuration}
                        waveform={msg.mediaWaveform}
                        senderType={msg.senderType}
                      />
                    ) : (
                      <div
                        className={`p-3.5 sm:p-4 rounded-2xl max-w-[85%] sm:max-w-[75%] text-xs sm:text-sm leading-relaxed shadow-sm ${
                          isCustomer
                            ? 'bg-emerald-700 text-white rounded-tr-none'
                            : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                      </div>
                    )}

                    {/* Delivery status for customer */}
                    {isCustomer && (
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1 px-1">
                        {msg.status === 'READ' ? (
                          <span className="flex items-center gap-0.5 text-emerald-600 font-medium">
                            <CheckCheck className="w-3.5 h-3.5" /> Read
                          </span>
                        ) : (
                          <span className="flex items-center gap-0.5">
                            <Check className="w-3.5 h-3.5" /> Sent
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {isAgentTyping && (
              <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full w-fit animate-pulse">
                <span className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce [animation-delay:0.4s]" />
                </span>
                <span>Support agent is typing...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Composer Input Bar */}
          <div className="p-3 sm:p-4 bg-white border-t border-slate-200 shrink-0">
            {activeConversation?.status === 'CLOSED' ? (
              <div className="p-3 bg-slate-100 rounded-2xl text-center text-xs text-slate-600">
                This inquiry is marked as <strong>Closed</strong>. Sending a new message will automatically reopen this ticket.
              </div>
            ) : null}

            <form onSubmit={handleSendMessage} className="space-y-2 mt-1">
              <div className="flex items-end gap-2">
                {/* Voice Recorder button/drawer */}
                <VoiceRecorder onSendVoice={handleSendVoice} disabled={isSending} />

                {/* Text input */}
                <div className="flex-1 relative">
                  <textarea
                    rows={1}
                    value={inputText}
                    onChange={(e) => handleTyping(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Type your message or use voice..."
                    maxLength={2000}
                    className="w-full resize-none p-3 pr-10 text-xs sm:text-sm rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 max-h-32 min-h-[44px]"
                  />
                </div>

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={!inputText.trim() || isSending}
                  className="p-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center shrink-0"
                  title="Send message"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Inquiry Modal */}
      {isNewTicketOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Create Support Inquiry</h3>
                  <p className="text-xs text-slate-500">Contact authorized RemitBD support agents</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNewTicketOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4 mt-4">
              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Inquiry Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as SupportCategory)}
                  className="w-full p-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white font-medium focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="DEPOSIT_ISSUE">Add Money (Deposit) Issue</option>
                  <option value="TRANSFER_DELAY">Send Money (Transfer) Delay</option>
                  <option value="ACCOUNT_VERIFICATION">Account & KYC Verification</option>
                  <option value="PAYMENT_METHOD">Payment Method Question</option>
                  <option value="FX_INQUIRY">Exchange Rate & Fees</option>
                  <option value="GENERAL">General Support & Feedback</option>
                </select>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Subject / Summary <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Deposit reference not matching or transfer delay"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="w-full p-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Optional Link Transaction */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Link Related Transaction (Optional)
                </label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTxType('DEPOSIT');
                      setSelectedTxId('');
                    }}
                    className={`p-2 rounded-xl text-xs font-semibold border text-center transition ${
                      selectedTxType === 'DEPOSIT'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    Deposit (Add Money)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTxType('TRANSFER');
                      setSelectedTxId('');
                    }}
                    className={`p-2 rounded-xl text-xs font-semibold border text-center transition ${
                      selectedTxType === 'TRANSFER'
                        ? 'bg-blue-50 border-blue-300 text-blue-800'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    Transfer (Send Money)
                  </button>
                </div>

                <select
                  value={selectedTxId}
                  onChange={(e) => setSelectedTxId(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-300 bg-white"
                >
                  <option value="">-- No transaction linked --</option>
                  {selectedTxType === 'DEPOSIT'
                    ? userTransactions.deposits.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.referenceNumber} - {d.amount} {d.currency} ({d.status}) - {new Date(d.createdAt).toLocaleDateString()}
                        </option>
                      ))
                    : userTransactions.transfers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.payoutReference} - {t.amount} {t.currency} to {t.recipientName} ({t.status})
                        </option>
                      ))}
                </select>
              </div>

              {/* Initial Message */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Detailed Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe your issue or question clearly..."
                  value={newInitialText}
                  onChange={(e) => setNewInitialText(e.target.value)}
                  className="w-full p-3 text-xs sm:text-sm rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewTicketOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={newSubmitting || !newInitialText.trim()}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {newSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>Submit Ticket</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
