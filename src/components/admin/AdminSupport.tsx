import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Conversation,
  SupportMessage,
  SupportSettings,
  SupportAuditLog,
  SupportCategory,
  SupportPriority,
  SupportStatus,
  User,
  AdminUser,
} from '../../types';
import { VoiceAudioPlayer } from '../support/VoiceAudioPlayer';
import { VoiceRecorder } from '../support/VoiceRecorder';
import {
  MessageSquare,
  Search,
  Filter,
  RefreshCw,
  Send,
  User as UserIcon,
  Shield,
  ShieldCheck,
  Clock,
  CheckCheck,
  Check,
  AlertCircle,
  AlertTriangle,
  Settings,
  ArrowDownLeft,
  ArrowUpRight,
  ExternalLink,
  ChevronDown,
  Sparkles,
  Link as LinkIcon,
  Unlink,
  CheckCircle2,
  XCircle,
  Sliders,
  History,
  Phone,
  Mail,
  MapPin,
  Wallet,
  Zap,
} from 'lucide-react';

export const AdminSupport: React.FC = () => {
  const { admin, getAuthHeader } = useAuth();

  // Conversations & selected conversation state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [customer, setCustomer] = useState<User | null>(null);
  const [recentDeposits, setRecentDeposits] = useState<any[]>([]);
  const [recentTransfers, setRecentTransfers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<SupportAuditLog[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);

  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [assignedToMeOnly, setAssignedToMeOnly] = useState(false);
  const [unreadOnly, setUnreadOnly] = useState(false);

  // Composer state
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isCustomerTyping, setIsCustomerTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);

  // Settings modal
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [supportSettings, setSupportSettings] = useState<SupportSettings | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);

  // Quick replies
  const quickReplies = [
    'Your deposit has been verified and credited to your wallet balance.',
    'Thank you for reaching out. We are currently processing your transfer with the partner bank.',
    'Please ensure you have submitted your valid National ID or Iqama for KYC review.',
    'We have resolved this inquiry. Please feel free to reply if you need any further assistance.',
    'Please provide the transaction reference number and bank receipt for faster verification.',
  ];

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<any>(null);

  // Initial fetch
  useEffect(() => {
    fetchConversations();
    fetchSettings();
  }, [statusFilter, priorityFilter, categoryFilter, assignedToMeOnly, unreadOnly]);

  // Polling interval
  useEffect(() => {
    const interval = setInterval(() => {
      if (selectedConvId) {
        fetchConversationDetails(selectedConvId, true);
      }
      fetchConversations(true);
    }, 3000);
    return () => clearInterval(interval);
  }, [selectedConvId]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isCustomerTyping]);

  const fetchConversations = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (priorityFilter !== 'ALL') params.append('priority', priorityFilter);
      if (categoryFilter !== 'ALL') params.append('category', categoryFilter);
      if (assignedToMeOnly) params.append('assignedToMe', 'true');
      if (unreadOnly) params.append('unreadOnly', 'true');

      const res = await fetch(`/api/admin/support/conversations?${params.toString()}`, {
        headers: getAuthHeader(),
      });
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
        // If nothing selected, select first conversation
        if (!selectedConvId && data.conversations.length > 0 && !silent) {
          selectConversation(data.conversations[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const selectConversation = async (id: string) => {
    setSelectedConvId(id);
    setMessagesLoading(true);
    try {
      const res = await fetch(`/api/admin/support/conversations/${id}`, {
        headers: getAuthHeader(),
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedConv(data.conversation);
        setMessages(data.messages || []);
        setCustomer(data.customer || null);
        setRecentDeposits(data.recentDeposits || []);
        setRecentTransfers(data.recentTransfers || []);
        setAuditLogs(data.auditLogs || []);
        setAdminUsers(data.adminUsers || []);

        // Refresh list to update unread badge
        fetchConversations(true);
      }
    } catch (err) {
      console.error('Failed to load conversation details:', err);
    } finally {
      setMessagesLoading(false);
    }
  };

  const fetchConversationDetails = async (id: string, silent = false) => {
    try {
      const res = await fetch(`/api/admin/support/conversations/${id}`, {
        headers: getAuthHeader(),
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedConv(data.conversation);
        setMessages(data.messages || []);
        setCustomer(data.customer || null);
        setRecentDeposits(data.recentDeposits || []);
        setRecentTransfers(data.recentTransfers || []);
        setAuditLogs(data.auditLogs || []);
      }
    } catch (err) {
      console.error('Failed to refresh conversation details:', err);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/support/settings', {
        headers: getAuthHeader(),
      });
      if (res.ok) {
        const data = await res.json();
        setSupportSettings(data);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  const handleSendReply = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!replyText.trim() || !selectedConvId || isSending) return;

    const text = replyText.trim();
    setReplyText('');
    setIsSending(true);

    const tempMsg: SupportMessage = {
      id: `temp-${Date.now()}`,
      conversationId: selectedConvId,
      senderType: 'ADMIN',
      senderId: admin?.id || 'adm-1',
      senderName: admin?.fullName || 'Admin',
      senderRole: admin?.role.replace(/_/g, ' ') || 'Support Admin',
      messageType: 'TEXT',
      text,
      status: 'SENT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      const res = await fetch(`/api/admin/support/conversations/${selectedConvId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({ text }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => prev.map((m) => (m.id === tempMsg.id ? data.message : m)));
        fetchConversations(true);
      }
    } catch (err) {
      console.error('Failed to send admin reply:', err);
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
    if (!selectedConvId) return;

    try {
      const res = await fetch(`/api/admin/support/conversations/${selectedConvId}/voice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify(voiceData),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, data.message]);
        fetchConversations(true);
      }
    } catch (err) {
      console.error('Failed to upload admin voice note:', err);
    }
  };

  const handleUpdateStatus = async (newStatus: SupportStatus) => {
    if (!selectedConvId) return;
    try {
      const res = await fetch(`/api/admin/support/conversations/${selectedConvId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedConv(data.conversation);
        fetchConversationDetails(selectedConvId, true);
        fetchConversations(true);
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleUpdatePriority = async (newPriority: SupportPriority) => {
    if (!selectedConvId) return;
    try {
      const res = await fetch(`/api/admin/support/conversations/${selectedConvId}/priority`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({ priority: newPriority }),
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedConv(data.conversation);
        fetchConversations(true);
      }
    } catch (err) {
      console.error('Failed to update priority:', err);
    }
  };

  const handleAssignAdmin = async (targetAdminId: string) => {
    if (!selectedConvId) return;
    try {
      const res = await fetch(`/api/admin/support/conversations/${selectedConvId}/assign`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({ adminId: targetAdminId }),
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedConv(data.conversation);
        fetchConversationDetails(selectedConvId, true);
        fetchConversations(true);
      }
    } catch (err) {
      console.error('Failed to assign ticket:', err);
    }
  };

  const handleLinkTransaction = async (txId: string, txType: 'DEPOSIT' | 'TRANSFER') => {
    if (!selectedConvId) return;
    try {
      const res = await fetch(`/api/admin/support/conversations/${selectedConvId}/link-transaction`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({ transactionId: txId, transactionType: txType }),
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedConv(data.conversation);
        fetchConversationDetails(selectedConvId, true);
        fetchConversations(true);
      }
    } catch (err) {
      console.error('Failed to link transaction:', err);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportSettings) return;
    setSavingSettings(true);
    try {
      const res = await fetch('/api/admin/support/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify(supportSettings),
      });
      if (res.ok) {
        setIsSettingsOpen(false);
      }
    } catch (err) {
      console.error('Failed to update support settings:', err);
    } finally {
      setSavingSettings(false);
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

  const getPriorityBadge = (p: SupportPriority) => {
    switch (p) {
      case 'URGENT':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">URGENT</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">HIGH</span>;
      case 'NORMAL':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">NORMAL</span>;
      case 'LOW':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">LOW</span>;
    }
  };

  const totalUnreadCount = conversations.reduce((sum, c) => sum + (c.unreadAdminCount || 0), 0);
  const openTicketsCount = conversations.filter((c) => c.status === 'OPEN').length;
  const urgentTicketsCount = conversations.filter((c) => c.priority === 'URGENT' || c.priority === 'HIGH').length;

  return (
    <div className="space-y-4">
      {/* Top Banner & Quick Stats */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Support Chat & Help Desk</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Live Real-Time Voice & Text
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Omni-channel customer inquiries, transaction verification, voice notes, and agent assignment.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick Metrics */}
          <div className="hidden sm:flex items-center gap-2 text-xs">
            <div className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 flex items-center gap-1.5 font-semibold text-slate-700">
              <span>Open:</span>
              <span className="text-emerald-700 font-bold">{openTicketsCount}</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-red-50 border border-red-200 flex items-center gap-1.5 font-semibold text-red-700">
              <span>Urgent/High:</span>
              <span className="text-red-800 font-bold">{urgentTicketsCount}</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-1.5 font-semibold text-amber-700">
              <span>Unread:</span>
              <span className="text-amber-800 font-bold">{totalUnreadCount}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Settings className="w-4 h-4 text-slate-600" />
            <span className="hidden sm:inline">Support Settings</span>
          </button>
        </div>
      </div>

      {/* 3-Column Layout (List | Chat | Customer 360) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[750px]">
        {/* ==================================================== */}
        {/* COLUMN 1: Conversations Directory (Width: 4/12)     */}
        {/* ==================================================== */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden h-full">
          {/* Search & Filter Bar */}
          <div className="p-3 border-b border-slate-100 space-y-2.5 bg-slate-50/50">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search ticket, customer, or message..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  fetchConversations();
                }}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {['ALL', 'OPEN', 'PENDING', 'RESOLVED', 'CLOSED'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition ${
                    statusFilter === st
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {st === 'ALL' ? 'All' : st}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1">
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={assignedToMeOnly}
                  onChange={(e) => setAssignedToMeOnly(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                />
                <span>Assigned to me</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={unreadOnly}
                  onChange={(e) => setUnreadOnly(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                />
                <span>Unread only ({totalUnreadCount})</span>
              </label>
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-48 text-slate-400 text-xs">
                <RefreshCw className="w-5 h-5 animate-spin mb-2 text-emerald-600" />
                <span>Loading tickets...</span>
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No support conversations found.
              </div>
            ) : (
              conversations.map((conv) => {
                const isSelected = selectedConvId === conv.id;
                const hasUnread = (conv.unreadAdminCount || 0) > 0;

                return (
                  <div
                    key={conv.id}
                    onClick={() => selectConversation(conv.id)}
                    className={`p-3.5 cursor-pointer transition flex flex-col gap-1.5 ${
                      isSelected
                        ? 'bg-emerald-50/70 border-l-4 border-emerald-600'
                        : hasUnread
                        ? 'bg-amber-50/30 hover:bg-slate-50'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    {/* Row 1: Ticket + Customer Name + Priority */}
                    <div className="flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-mono text-[11px] font-bold text-slate-700">
                          {conv.ticketId}
                        </span>
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {conv.customerName}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {getPriorityBadge(conv.priority)}
                        {hasUnread && (
                          <span className="w-5 h-5 rounded-full bg-red-600 text-white font-bold text-[10px] flex items-center justify-center animate-pulse">
                            {conv.unreadAdminCount}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Row 2: Subject */}
                    <p className="text-xs font-semibold text-slate-800 line-clamp-1">
                      {conv.subject}
                    </p>

                    {/* Row 3: Last Message Preview */}
                    <p className="text-[11px] text-slate-500 line-clamp-1">
                      {conv.lastMessageType === 'VOICE' ? '🎤 Voice message' : conv.lastMessageText || 'No message'}
                    </p>

                    {/* Row 4: Category & Status Footer */}
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                      <span className={`px-2 py-0.5 rounded-md font-semibold border ${getCategoryColor(conv.category)}`}>
                        {conv.category.replace(/_/g, ' ')}
                      </span>
                      <span>
                        {conv.lastMessageAt
                          ? new Date(conv.lastMessageAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : ''}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ==================================================== */}
        {/* COLUMN 2: Active Chat Thread (Width: 5/12)          */}
        {/* ==================================================== */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden h-full">
          {selectedConv ? (
            <>
              {/* Header with Quick Actions */}
              <div className="p-3.5 border-b border-slate-200 bg-slate-50 flex flex-col gap-2 shrink-0">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900">
                        {selectedConv.ticketId}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getCategoryColor(selectedConv.category)}`}>
                        {selectedConv.category.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 mt-0.5 line-clamp-1">
                      {selectedConv.subject}
                    </h3>
                  </div>

                  {/* Actions Dropdowns */}
                  <div className="flex items-center gap-2">
                    {/* Status Dropdown */}
                    <select
                      value={selectedConv.status}
                      onChange={(e) => handleUpdateStatus(e.target.value as SupportStatus)}
                      className="text-xs font-semibold p-1.5 rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="OPEN">Status: OPEN</option>
                      <option value="PENDING">Status: PENDING</option>
                      <option value="RESOLVED">Status: RESOLVED</option>
                      <option value="CLOSED">Status: CLOSED</option>
                    </select>

                    {/* Priority Dropdown */}
                    <select
                      value={selectedConv.priority}
                      onChange={(e) => handleUpdatePriority(e.target.value as SupportPriority)}
                      className="text-xs font-semibold p-1.5 rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="LOW">Priority: LOW</option>
                      <option value="NORMAL">Priority: NORMAL</option>
                      <option value="HIGH">Priority: HIGH</option>
                      <option value="URGENT">Priority: URGENT</option>
                    </select>
                  </div>
                </div>

                {/* Assignee Row */}
                <div className="flex items-center justify-between text-xs text-slate-600 pt-1 border-t border-slate-200/60">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">Assigned To:</span>
                    <select
                      value={selectedConv.assignedAdminId || ''}
                      onChange={(e) => handleAssignAdmin(e.target.value)}
                      className="text-xs font-medium bg-transparent border-b border-slate-300 focus:outline-none"
                    >
                      <option value="">-- Unassigned --</option>
                      {adminUsers.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.fullName} ({a.role.replace(/_/g, ' ')})
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedConv.relatedTransactionInfo && (
                    <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Linked {selectedConv.relatedTransactionInfo.type}: {selectedConv.relatedTransactionInfo.reference}
                    </span>
                  )}
                </div>
              </div>

              {/* Messages Stream */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-100/50">
                {messagesLoading ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs">
                    <RefreshCw className="w-5 h-5 animate-spin mb-2 text-emerald-600" />
                    <span>Loading messages...</span>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isAdmin = msg.senderType === 'ADMIN';
                    const isSystem = msg.senderType === 'SYSTEM';

                    if (isSystem) {
                      return (
                        <div key={msg.id} className="flex justify-center my-2">
                          <div className="bg-slate-200 text-slate-700 px-3 py-1 rounded-full text-[10px] font-medium flex items-center gap-1 shadow-sm max-w-sm text-center">
                            <Sparkles className="w-3 h-3 text-amber-600 shrink-0" />
                            <span>{msg.text}</span>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 mb-1 px-1">
                          <span>{msg.senderName}</span>
                          {isAdmin && (
                            <span className="text-emerald-700 bg-emerald-50 px-1 rounded text-[9px]">
                              {msg.senderRole || 'Admin'}
                            </span>
                          )}
                          <span>
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        {msg.messageType === 'VOICE' && msg.mediaUrl ? (
                          <VoiceAudioPlayer
                            mediaUrl={msg.mediaUrl}
                            duration={msg.mediaDuration}
                            waveform={msg.mediaWaveform}
                            senderType={msg.senderType}
                          />
                        ) : (
                          <div
                            className={`p-3 rounded-2xl max-w-[85%] text-xs leading-relaxed shadow-sm ${
                              isAdmin
                                ? 'bg-slate-900 text-white rounded-tr-none'
                                : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Composer */}
              <div className="p-3 bg-white border-t border-slate-200 space-y-2 shrink-0">
                {/* Quick canned replies */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
                    Quick:
                  </span>
                  {quickReplies.map((qr, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setReplyText(qr)}
                      className="text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md whitespace-nowrap transition"
                    >
                      {qr.substring(0, 24)}...
                    </button>
                  ))}
                </div>

                {/* Form */}
                <form onSubmit={handleSendReply} className="space-y-2">
                  <div className="flex items-end gap-2">
                    <VoiceRecorder onSendVoice={handleSendVoice} disabled={isSending} />

                    <div className="flex-1">
                      <textarea
                        rows={1}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendReply();
                          }
                        }}
                        placeholder="Type reply to customer..."
                        className="w-full resize-none p-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 bg-slate-50 max-h-24 min-h-[40px]"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={!replyText.trim() || isSending}
                      className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold transition disabled:opacity-40"
                      title="Send Reply"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs">
              <MessageSquare className="w-10 h-10 text-slate-300 mb-2" />
              <span>Select a conversation from the directory to start support.</span>
            </div>
          )}
        </div>

        {/* ==================================================== */}
        {/* COLUMN 3: Customer 360 & Context Sidebar (3/12)      */}
        {/* ==================================================== */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-y-auto h-full p-4 space-y-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-100">
            Customer Profile & Context
          </h2>

          {customer ? (
            <div className="space-y-4">
              {/* Customer Profile Card */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900">{customer.fullName}</h4>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    customer.kycStatus === 'VERIFIED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    KYC: {customer.kycStatus}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{customer.email}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{customer.phone}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{customer.country} ({customer.countryCode})</span>
                  </div>
                </div>

                {/* Balances */}
                <div className="pt-2 border-t border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Wallet Balances:</span>
                  <div className="grid grid-cols-2 gap-1 mt-1 text-[11px]">
                    {Object.entries(customer.balances || {}).map(([curr, amt]) => (
                      <div key={curr} className="bg-white p-1 rounded border border-slate-200 text-slate-700">
                        <span className="font-semibold">{curr}:</span> {Number(amt).toLocaleString()}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Linked Transaction Card */}
              {selectedConv?.relatedTransactionInfo && (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-900">Linked {selectedConv.relatedTransactionInfo.type}</span>
                    <button
                      type="button"
                      onClick={() => handleLinkTransaction('', 'DEPOSIT')}
                      className="text-[10px] text-red-600 hover:underline flex items-center gap-0.5"
                    >
                      <Unlink className="w-3 h-3" /> Unlink
                    </button>
                  </div>
                  <p className="font-mono text-xs font-bold text-slate-800">
                    {selectedConv.relatedTransactionInfo.reference}
                  </p>
                  <div className="flex items-center justify-between text-xs text-emerald-800">
                    <span>{selectedConv.relatedTransactionInfo.amount} {selectedConv.relatedTransactionInfo.currency}</span>
                    <span className="font-bold">{selectedConv.relatedTransactionInfo.status}</span>
                  </div>
                </div>
              )}

              {/* Recent Activity List (Linkable) */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-700">Recent Transactions</span>
                <div className="space-y-1.5">
                  {recentDeposits.map((d) => (
                    <div
                      key={d.id}
                      className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-[11px] flex items-center justify-between"
                    >
                      <div>
                        <span className="font-semibold text-emerald-700 flex items-center gap-1">
                          <ArrowDownLeft className="w-3 h-3" /> Deposit
                        </span>
                        <span className="font-mono text-slate-600 text-[10px]">{d.reference || d.customerTrxId || d.id}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-800">{d.amount} {d.currency}</div>
                        {selectedConv?.relatedTransactionId !== d.id && (
                          <button
                            type="button"
                            onClick={() => handleLinkTransaction(d.id, 'DEPOSIT')}
                            className="text-[10px] text-emerald-600 hover:underline"
                          >
                            Link to Ticket
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {recentTransfers.map((t) => (
                    <div
                      key={t.id}
                      className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-[11px] flex items-center justify-between"
                    >
                      <div>
                        <span className="font-semibold text-blue-700 flex items-center gap-1">
                          <ArrowUpRight className="w-3 h-3" /> Transfer
                        </span>
                        <span className="font-mono text-slate-600 text-[10px]">{t.payoutReference}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-800">{t.amount} {t.currency}</div>
                        {selectedConv?.relatedTransactionId !== t.id && (
                          <button
                            type="button"
                            onClick={() => handleLinkTransaction(t.id, 'TRANSFER')}
                            className="text-[10px] text-blue-600 hover:underline"
                          >
                            Link to Ticket
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Audit Logs for this Ticket */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                  <History className="w-3.5 h-3.5 text-slate-400" />
                  Ticket Audit History
                </span>
                <div className="space-y-1.5 max-h-44 overflow-y-auto">
                  {auditLogs.length === 0 ? (
                    <span className="text-[11px] text-slate-400">No audit events recorded.</span>
                  ) : (
                    auditLogs.map((log) => (
                      <div key={log.id} className="p-1.5 rounded bg-slate-50 border border-slate-100 text-[10px] space-y-0.5">
                        <div className="font-semibold text-slate-800">{log.action}</div>
                        <div className="text-slate-500">{log.details}</div>
                        <div className="text-[9px] text-slate-400">{new Date(log.timestamp).toLocaleString()}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-slate-400 text-xs text-center py-8">
              No customer context loaded.
            </div>
          )}
        </div>
      </div>

      {/* Support Settings Modal */}
      {isSettingsOpen && supportSettings && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center">
                  <Settings className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Support System Settings</h3>
                  <p className="text-xs text-slate-500">Configure voice messaging limits and auto-response</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4 mt-4 text-xs">
              {/* Max voice duration */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Max Voice Duration (seconds)
                </label>
                <input
                  type="number"
                  min={10}
                  max={600}
                  value={supportSettings.maxVoiceDurationSeconds}
                  onChange={(e) =>
                    setSupportSettings({
                      ...supportSettings,
                      maxVoiceDurationSeconds: parseInt(e.target.value) || 120,
                    })
                  }
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-medium"
                />
              </div>

              {/* Auto Response Toggle */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 block">Enable Automated First Reply</span>
                  <span className="text-[11px] text-slate-500">Automatically sends a bot acknowledgment when ticket opens</span>
                </div>
                <input
                  type="checkbox"
                  checked={supportSettings.autoResponseEnabled}
                  onChange={(e) =>
                    setSupportSettings({
                      ...supportSettings,
                      autoResponseEnabled: e.target.checked,
                    })
                  }
                  className="w-4 h-4 text-emerald-600 rounded"
                />
              </div>

              {/* Auto Response Text */}
              {supportSettings.autoResponseEnabled && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Auto-Response Message Text
                  </label>
                  <textarea
                    rows={3}
                    value={supportSettings.autoResponseText}
                    onChange={(e) =>
                      setSupportSettings({
                        ...supportSettings,
                        autoResponseText: e.target.value,
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
              )}

              {/* Business Hours */}
              <div>
                <span className="font-bold text-slate-700 block mb-1">Business Hours & Timezone</span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Start (e.g. 08:00)"
                    value={supportSettings.businessHoursStart}
                    onChange={(e) =>
                      setSupportSettings({
                        ...supportSettings,
                        businessHoursStart: e.target.value,
                      })
                    }
                    className="p-2 rounded-xl border border-slate-300"
                  />
                  <input
                    type="text"
                    placeholder="End (e.g. 23:00)"
                    value={supportSettings.businessHoursEnd}
                    onChange={(e) =>
                      setSupportSettings({
                        ...supportSettings,
                        businessHoursEnd: e.target.value,
                      })
                    }
                    className="p-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold flex items-center gap-1.5 shadow"
                >
                  {savingSettings ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>Save Settings</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
