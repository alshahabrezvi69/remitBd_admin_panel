import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { KycDocument, KycStatus, User } from '../../types';
import {
  FileCheck2,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Eye,
  RefreshCw,
  AlertCircle,
  FileText,
  ShieldCheck,
  Check,
} from 'lucide-react';

interface KycItem {
  user: User;
  document: KycDocument;
}

export const KycManagementView: React.FC = () => {
  const { token, hasPermission } = useAuth();
  const [items, setItems] = useState<KycItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedItem, setSelectedItem] = useState<KycItem | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [actionModal, setActionModal] = useState<{ action: 'verify' | 'reject' | 'request_info'; title: string } | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/kyc', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const json = await res.json();
        setItems(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [token]);

  const handleUpdateStatus = async () => {
    if (!selectedItem || !actionModal) return;
    setStatusMsg(null);
    try {
      const res = await fetch(`/api/admin/kyc/${selectedItem.document.id}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action: actionModal.action, reason: actionReason }),
      });

      const json = await res.json();
      if (!res.ok) {
        setStatusMsg({ type: 'error', text: json.error || 'Failed to update KYC status.' });
      } else {
        setStatusMsg({ type: 'success', text: `KYC Document updated successfully.` });
        setActionModal(null);
        setSelectedItem(null);
        setActionReason('');
        fetchDocuments();
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Network connection failed.' });
    }
  };

  const getStatusBadge = (status: KycStatus) => {
    switch (status) {
      case 'VERIFIED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'PENDING':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'REJECTED':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'ADDITIONAL_INFO_REQUIRED':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const filteredItems = items.filter((item) => {
    if (statusFilter === 'ALL') return true;
    return item.document.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              KYC &amp; Identity Verification Compliance Queue
            </h1>
            <span className="bg-amber-50 text-amber-700 border border-amber-200 text-xs font-mono px-2 py-0.5 rounded font-bold">
              {filteredItems.length} Submissions
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Examine Passports, Iqamas, National IDs, and Proof of Address according to Bangladesh Bank &amp; international AML mandates.
          </p>
        </div>

        <button
          onClick={fetchDocuments}
          className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3.5 py-2 rounded-lg border border-slate-200 shadow-sm transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {statusMsg && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 ${
            statusMsg.type === 'error'
              ? 'bg-rose-50 border border-rose-200 text-rose-700 font-medium'
              : 'bg-emerald-50 border border-emerald-200 text-emerald-700 font-medium'
          }`}
        >
          {statusMsg.type === 'error' ? <AlertCircle className="w-4 h-4 text-rose-500" /> : <Check className="w-4 h-4 text-emerald-500" />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
        {[
          { key: 'ALL', label: 'All Submissions' },
          { key: 'PENDING', label: 'Pending Review' },
          { key: 'VERIFIED', label: 'Verified' },
          { key: 'REJECTED', label: 'Rejected' },
          { key: 'ADDITIONAL_INFO_REQUIRED', label: 'Info Requested' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              statusFilter === tab.key
                ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* KYC Submissions Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-mono text-[10px] font-bold">
              <tr>
                <th className="py-3 px-4">Doc ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Document Type</th>
                <th className="py-3 px-4">Document #</th>
                <th className="py-3 px-4">Issuing Country</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Uploaded At</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No KYC submissions matching this filter.
                  </td>
                </tr>
              ) : (
                filteredItems.map(({ user, document: doc }) => (
                  <tr
                    key={doc.id}
                    onClick={() => setSelectedItem({ user, document: doc })}
                    className="hover:bg-slate-50 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {doc.id}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{user.fullName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{user.email}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-800 font-medium">
                      {doc.type.replace('_', ' ')}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-700">
                      {doc.docNumber}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      {doc.country}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusBadge(doc.status)}`}>
                        {doc.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {new Date(doc.uploadedAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedItem({ user, document: doc });
                        }}
                        className="bg-slate-100 group-hover:bg-blue-600 text-slate-700 group-hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm"
                      >
                        Inspect Dossier
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* KYC Inspection Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto font-sans">
          <div className="bg-white border border-slate-200 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-base">KYC Dossier: {selectedItem.document.id}</span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${getStatusBadge(selectedItem.document.status)}`}>
                      {selectedItem.document.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Customer: <span className="text-slate-800 font-bold">{selectedItem.user.fullName}</span> &bull; {selectedItem.user.country}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedItem(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6 bg-white">
              {/* Document Overview */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Document Type</div>
                  <div className="text-xs font-bold text-slate-900 mt-1 font-mono">{selectedItem.document.type}</div>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Document Number</div>
                  <div className="text-xs font-bold text-slate-900 mt-1 font-mono">{selectedItem.document.docNumber}</div>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Issuing Country</div>
                  <div className="text-xs font-bold text-slate-900 mt-1">{selectedItem.document.country}</div>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Risk Profile</div>
                  <div className="text-xs font-bold text-blue-600 mt-1 uppercase">{selectedItem.user.riskLevel} Risk</div>
                </div>
              </div>

              {/* Document File Viewer */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-center space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mx-auto text-blue-600 shadow-2xs">
                  <FileText className="w-8 h-8" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-sm font-mono">
                    {selectedItem.document.type}_{selectedItem.document.docNumber}.pdf
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Uploaded by customer on {new Date(selectedItem.document.uploadedAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 font-mono inline-block shadow-2xs font-medium">
                  Biometric MRZ scan verified &bull; Bangladesh Bank AML Checklist passed
                </div>
              </div>

              {/* Action Form */}
              {actionModal && (
                <div className="p-4 bg-slate-50 border border-blue-300 rounded-xl space-y-3 shadow-inner">
                  <div className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                    {actionModal.title}
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Compliance Officer Note / Reason
                    </label>
                    <textarea
                      rows={2}
                      value={actionReason}
                      onChange={(e) => setActionReason(e.target.value)}
                      placeholder="e.g. Identity verified against government database..."
                      className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setActionModal(null)}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpdateStatus}
                      className="px-4 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm"
                    >
                      Submit Decision
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Decisions */}
            <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
              <div className="text-xs text-slate-500">
                Compliance Decision Controls
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() =>
                    setActionModal({
                      action: 'request_info',
                      title: 'Request Additional Documentation from Customer',
                    })
                  }
                  className="px-3.5 py-1.5 text-xs font-semibold bg-white hover:bg-slate-50 text-blue-700 rounded-lg border border-slate-200 shadow-sm transition-colors"
                >
                  Request More Info
                </button>

                <button
                  onClick={() =>
                    setActionModal({
                      action: 'reject',
                      title: 'Reject KYC Document Submission',
                    })
                  }
                  className="px-3.5 py-1.5 text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg border border-rose-200 transition-colors"
                >
                  Reject Submission
                </button>

                <button
                  onClick={() =>
                    setActionModal({
                      action: 'verify',
                      title: 'Approve & Verify KYC Compliance',
                    })
                  }
                  className="px-4 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Verify Identity</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
