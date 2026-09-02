export type Currency = 
  | 'SAR' 
  | 'AED' 
  | 'QAR' 
  | 'KWD' 
  | 'OMR' 
  | 'MYR' 
  | 'SGD' 
  | 'BHD' 
  | 'MVR' 
  | 'EUR' 
  | 'USD' 
  | 'GBP' 
  | 'BDT'
  | string;

export type AdminRole = 
  | 'SUPER_ADMIN' 
  | 'FINANCE_ADMIN' 
  | 'COMPLIANCE_ADMIN' 
  | 'SUPPORT_ADMIN' 
  | 'FX_ADMIN' 
  | 'AUDITOR';

export type KycStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'ADDITIONAL_INFO_REQUIRED';
export type AccountStatus = 'ACTIVE' | 'FROZEN' | 'SUSPENDED' | 'BANNED' | 'PENDING' | 'REJECTED';
export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export type DepositStatus = 
  | 'PENDING' 
  | 'PAYMENT_RECEIVED' 
  | 'UNDER_REVIEW' 
  | 'FUNDS_AVAILABLE' 
  | 'FAILED' 
  | 'CANCELLED' 
  | 'REFUNDED';

export type TransferStatus = 
  | 'CREATED' 
  | 'COMPLIANCE_REVIEW' 
  | 'PROCESSING' 
  | 'PAYOUT_PENDING' 
  | 'PAID' 
  | 'FAILED' 
  | 'CANCELLED' 
  | 'REFUND_PENDING' 
  | 'REFUNDED';

export type PayoutMethod = 'BKASH' | 'NAGAD' | 'ROCKET' | 'BANK' | 'BANK_TRANSFER' | string;

export type LedgerTransactionType = 
  | 'DEPOSIT' 
  | 'TRANSFER' 
  | 'FEE' 
  | 'FX_SPREAD' 
  | 'REFUND' 
  | 'ADJUSTMENT';

export type ReconciliationStatus = 
  | 'MATCHED' 
  | 'MISSING' 
  | 'DUPLICATE' 
  | 'AMOUNT_MISMATCH' 
  | 'REVERSED' 
  | 'UNKNOWN';

export type ProviderCategory = 'COLLECTION' | 'FX' | 'KYC' | 'PAYOUT';
export type ProviderStatus = 'CONNECTED' | 'NOT_CONFIGURED' | 'AUTHENTICATION_FAILED' | 'UNAVAILABLE';

export interface TimelineEvent {
  timestamp: string;
  status: string;
  actor: string;
  message: string;
}

export interface KycDocument {
  id: string;
  type: 'PASSPORT' | 'NATIONAL_ID' | 'IQAMA' | 'DRIVING_LICENSE' | 'WORK_PERMIT';
  docNumber: string;
  country: string;
  status: KycStatus;
  uploadedAt: string;
  verifiedAt?: string;
  fileUrl: string;
  rejectionReason?: string;
  reviewedBy?: string;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  country: string;
  countryCode: string;
  nativeCurrency: Currency;
  kycStatus: KycStatus;
  accountStatus: AccountStatus;
  verificationStatus: VerificationStatus;
  riskLevel: RiskLevel;
  balances: Partial<Record<Currency, number>>;
  createdAt: string;
  updatedAt?: string;
  kycDocuments: KycDocument[];
  address?: string;
  occupation?: string;
  isBanned?: boolean;
  banReason?: string;
  bannedAt?: string;
}

export interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  role: AdminRole;
  twoFactorEnabled: boolean;
  status: 'ACTIVE' | 'DISABLED';
  avatar?: string;
  lastLogin: string;
  createdAt: string;
}

export type PaymentMethodType = 'MFS' | 'MOBILE_FINANCIAL_SERVICE' | 'BANK_TRANSFER' | 'CARD' | 'WALLET' | 'OTHER';
export type PaymentMethodStatus = 'ACTIVE' | 'DISABLED' | 'ARCHIVED';

export interface PaymentMethodSnapshot {
  id: string;
  name?: string;
  providerName?: string;
  provider?: string;
  methodType: PaymentMethodType | string;
  displayName: string;
  country?: string;
  countryCode?: string;
  currencyCode?: Currency;
  currency?: Currency;
  accountName?: string;
  accountNumber?: string;
  walletNumber?: string;
  bankName?: string;
  branchName?: string;
  routingNumber?: string;
  iban?: string;
  swift?: string;
  instructions?: string[] | string;
  minimumAmount?: number;
  maximumAmount?: number;
  feePercent?: number;
  feeFixed?: number;
  status?: any;
  version?: number;
  recordedAt?: string;
  capturedAt?: string;
  timestamp?: string;
}

export interface Deposit {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  country: string;
  currency: Currency;
  amount: number;
  paymentMethodId: string;
  paymentMethodName: string;
  paymentMethodSnapshot?: PaymentMethodSnapshot;
  customerTrxId?: string;
  reference: string;
  providerReference: string;
  fundingAccountId?: string;
  fundingAccountName?: string;
  status: DepositStatus;
  paymentStatus: 'AWAITING_PAYMENT' | 'RECEIVED' | 'CONFIRMED' | 'FAILED';
  complianceStatus: 'CLEARED' | 'FLAGGED' | 'MANUAL_REVIEW';
  ledgerStatus: 'POSTED' | 'PENDING' | 'REVERSED';
  notes?: string;
  receiptUrl?: string;
  createdAt: string;
  updatedAt: string;
  timeline: TimelineEvent[];
}

export interface Transfer {
  id: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  country: string;
  currency: Currency;
  amount: number;
  payableForeignAmount?: number;
  requestedBdtAmount?: number;
  fxRate: number;
  fee: number;
  recipientName: string;
  recipientPhone: string;
  recipientRelationship: string;
  payoutMethod: PayoutMethod;
  payoutAccountNumber: string;
  accountType?: 'personal' | 'agent' | string;
  bankName?: string;
  branchName?: string;
  routingNumber?: string;
  bdtAmount: number;
  targetCurrency?: Currency;
  couponCode?: string;
  bonusPercent?: number;
  status: TransferStatus;
  providerReference: string;
  payoutReference: string;
  complianceStatus: 'CLEARED' | 'SUSPECT' | 'ESCALATED' | 'BLOCKED';
  riskResult: {
    score: number; // 0-100
    flagged: boolean;
    flagReason?: string;
  };
  ledgerTransactionId?: string;
  createdAt: string;
  updatedAt: string;
  timeline: TimelineEvent[];
  auditHistory: Array<{
    timestamp: string;
    adminId: string;
    role: AdminRole;
    action: string;
    reason: string;
  }>;
}

export interface Coupon {
  id: string;
  code: string;
  bonusPercent: number;
  isActive: boolean;
  description?: string;
  maxUses: number;
  usedCount: number;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface FundingAccount {
  id: string;
  country: string;
  countryCode: string;
  currency: Currency;
  provider: string;
  paymentMethod: string;
  accountDisplayName: string;
  bankName: string;
  accountNumber: string;
  iban?: string;
  swift?: string;
  paymentInstructions: string;
  status: 'ACTIVE' | 'DISABLED' | 'ARCHIVED';
  minDeposit?: number;
  maxDeposit?: number;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  code?: string;
  providerName?: string;
  provider?: string;
  methodType: PaymentMethodType;
  country?: string;
  countryCode: string;
  currencyCode?: Currency;
  currency?: Currency;
  supportedCountries?: string[];
  supportedCurrencies?: string[];
  displayName: string;
  accountName: string;
  accountNumber?: string;
  walletNumber?: string;
  bankName?: string;
  branchName?: string;
  routingNumber?: string;
  iban?: string;
  swift?: string;
  instructions: string[];
  minimumAmount?: number;
  maximumAmount?: number;
  minLimit?: number;
  maxLimit?: number;
  feePercent: number;
  feeFixed: number;
  status: PaymentMethodStatus;
  displayOrder: number;
  currentVersion: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
  icon?: string;
}

export interface PaymentMethodVersion {
  id: string;
  paymentMethodId: string;
  version: number;
  snapshot?: any;
  configurationSnapshot?: Partial<PaymentMethod>;
  changedBy?: string;
  changedByEmail?: string;
  changedByRole?: AdminRole;
  changeReason?: string;
  createdAt: string;
  status?: 'ACTIVE' | 'SUPERSEDED' | 'PENDING_APPROVAL' | 'REJECTED';
  diffSummary?: Array<{ field: string; oldVal: any; newVal: any }>;
}

export interface PaymentMethodProposal {
  id: string;
  paymentMethodId: string;
  proposedVersion: number;
  proposedData: Partial<PaymentMethod>;
  previousData: Partial<PaymentMethod>;
  proposedBy: string;
  proposedByEmail: string;
  proposedByRole: AdminRole;
  reason: string;
  createdAt: string;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  reviewedBy?: string;
  reviewedByEmail?: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

export interface PaymentMethodAuditLog {
  id: string;
  paymentMethodId: string;
  paymentMethodName?: string;
  adminId: string;
  adminEmail: string;
  adminRole: AdminRole;
  action: string;
  oldValue?: any;
  newValue?: any;
  changes?: Array<{ field: string; oldValue?: any; newValue?: any }>;
  reason?: string;
  ipAddress?: string;
  ip?: string;
  userAgent?: string;
  createdAt?: string;
  timestamp?: string;
}

export interface FXRate {
  pair: string;
  fromCurrency: Currency;
  toCurrency: 'BDT';
  providerRate: number;
  customerRate: number;
  spread: number;
  feePercent: number;
  quoteValiditySeconds: number;
  status: 'ACTIVE' | 'STALE' | 'PAUSED';
  lastUpdated: string;
  high24h?: number;
  low24h?: number;
}

export interface LedgerEntry {
  id: string;
  date: string;
  transactionId: string;
  transactionType: LedgerTransactionType;
  currency: Currency;
  debit: number;
  credit: number;
  balance: number;
  reference: string;
  accountType: 'USER_WALLET' | 'SETTLEMENT_RESERVE' | 'PAYOUT_POOL' | 'FEE_REVENUE';
  notes: string;
  createdAt: string;
}

export interface ReconciliationRecord {
  id: string;
  date: string;
  externalReference: string;
  internalReference: string;
  provider: string;
  internalAmount: number;
  providerAmount: number;
  currency: Currency;
  status: ReconciliationStatus;
  notes: string;
  resolvedBy?: string;
  resolvedAt?: string;
}

export interface ProviderHealth {
  id: string;
  name: string;
  category: ProviderCategory;
  status: ProviderStatus;
  latencyMs: number;
  successRate: number;
  lastCheck: string;
  errorSummary?: string;
  endpoint: string;
}

export interface AuditLog {
  id: string;
  adminId: string;
  adminEmail: string;
  adminRole: AdminRole;
  action: string;
  resource: string;
  resourceId: string;
  oldState: any;
  newState: any;
  reason: string;
  timestamp: string;
  ip: string;
  userAgent: string;
}

export interface SystemNotification {
  id: string;
  type: 
    | 'NEW_DEPOSIT' 
    | 'NEW_TRANSFER' 
    | 'PAYMENT_RECEIVED' 
    | 'DEPOSIT_REVIEW' 
    | 'TRANSFER_REVIEW' 
    | 'PAYOUT_COMPLETED' 
    | 'PAYOUT_FAILED' 
    | 'KYC_REVIEW' 
    | 'FRAUD_RISK' 
    | 'PROVIDER_ERROR'
    | 'NEW_ACCOUNT'
    | 'ACCOUNT_VERIFIED'
    | 'ACCOUNT_REJECTED'
    | 'ACCOUNT_SUSPENDED'
    | 'ACCOUNT_BANNED'
    | 'ACCOUNT_UNBANNED'
    | 'ACCOUNT_FROZEN'
    | 'ACCOUNT_ACTIVATED'
    | 'DEPOSIT_APPROVED'
    | 'DEPOSIT_REJECTED'
    | 'TRANSFER_APPROVED'
    | 'TRANSFER_REJECTED'
    | 'NEW_USDT_SELL'
    | 'KYC_VERIFIED'
    | 'KYC_REJECTED';
  title: string;
  message: string;
  amount?: number;
  currency?: Currency;
  userId?: string;
  userName?: string;
  transactionId?: string;
  referenceId?: string;
  referenceType?: 'DEPOSIT' | 'TRANSFER' | 'KYC' | 'PROVIDER' | 'USER' | 'USDT_SELL';
  createdAt: string;
  read: boolean;
}

export interface SystemSettings {
  countries: Array<{ code: string; name: string; currency: Currency; active: boolean }>;
  maintenanceMode: boolean;
  autoApproveDepositLimit: number;
  requireKycForTransfersAbove: number;
  dailyTransferLimitBdt: number;
  webhookSecretConfigured: boolean;
  smsNotificationsEnabled: boolean;
  emailNotificationsEnabled: boolean;
  requirePaymentMethodApproval: boolean;
}

// ==========================================
// CUSTOMER SUPPORT CHAT SYSTEM TYPES
// ==========================================

export type SupportCategory =
  | 'DEPOSIT'
  | 'DEPOSIT_ISSUE'
  | 'SEND_MONEY'
  | 'TRANSFER_DELAY'
  | 'KYC'
  | 'ACCOUNT_VERIFICATION'
  | 'ACCOUNT'
  | 'PAYMENT'
  | 'PAYMENT_METHOD'
  | 'EXCHANGE_RATE'
  | 'FX_INQUIRY'
  | 'REFUND'
  | 'TECHNICAL_PROBLEM'
  | 'OTHER';

export type SupportStatus = 'OPEN' | 'PENDING' | 'RESOLVED' | 'CLOSED';

export type SupportPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export type MessageSenderType = 'CUSTOMER' | 'ADMIN' | 'SYSTEM';

export type MessageType = 'TEXT' | 'VOICE' | 'IMAGE' | 'SYSTEM';

export type MessageDeliveryStatus = 'SENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';

export interface RelatedTransactionInfo {
  id: string;
  type: 'DEPOSIT' | 'TRANSFER';
  reference: string;
  amount: number;
  currency: Currency;
  status: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  ticketId: string; // e.g. "SUP-20260826-000123"
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerCountry: string;
  assignedAdminId?: string;
  assignedAdminName?: string;
  assignedAdminRole?: AdminRole;
  status: SupportStatus;
  priority: SupportPriority;
  category: SupportCategory;
  subject?: string;
  relatedTransactionId?: string;
  relatedTransactionType?: 'DEPOSIT' | 'TRANSFER';
  relatedTransactionInfo?: RelatedTransactionInfo;
  unreadCustomerCount: number;
  unreadAdminCount: number;
  lastMessageText?: string;
  lastMessageType?: MessageType;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  resolvedAt?: string;
}

export interface SupportMessage {
  id: string;
  conversationId: string;
  senderType: MessageSenderType;
  senderId: string;
  senderName: string;
  senderRole?: string;
  messageType: MessageType;
  text?: string;
  mediaUrl?: string; // Secure tokenized media playback endpoint
  mediaDuration?: number; // Duration in seconds
  mediaMimeType?: string; // e.g. "audio/webm"
  mediaSize?: number; // in bytes
  mediaWaveform?: number[]; // Waveform amplitudes for visual waveform UI
  status: MessageDeliveryStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  deletedBy?: string;
}

export interface SupportSettings {
  maxVoiceDurationSeconds: number; // e.g. 120
  maxVoiceSizeBytes: number; // e.g. 10485760 (10MB)
  allowedAudioMimeTypes: string[];
  autoResponseEnabled: boolean;
  autoResponseText: string;
  autoCloseAfterHours: number;
  businessHoursEnabled: boolean;
  businessHours: {
    days: string[]; // ["SUN", "MON", "TUE", "WED", "THU"]
    start: string; // "09:00"
    end: string; // "22:00"
    timezone: string; // "Asia/Dhaka"
  };
  offlineNoticeMessage: string;
  categories: Array<{
    id: SupportCategory;
    name: string;
    description: string;
    active: boolean;
  }>;
  priorityOptions: Array<{
    id: SupportPriority;
    label: string;
    badgeColor: string;
  }>;
}

export interface SupportAuditLog {
  id: string;
  conversationId: string;
  ticketId: string;
  adminId: string;
  adminEmail: string;
  adminRole: AdminRole;
  action:
    | 'CONVERSATION_ASSIGNED'
    | 'CONVERSATION_REASSIGNED'
    | 'CONVERSATION_STATUS_CHANGED'
    | 'PRIORITY_CHANGED'
    | 'CATEGORY_CHANGED'
    | 'TRANSACTION_LINKED'
    | 'TRANSACTION_UNLINKED'
    | 'MESSAGE_DELETED'
    | 'CUSTOMER_ACCESS_LOGGED'
    | 'AUTO_RESPONSE_SENT';
  details: string;
  oldValue?: any;
  newValue?: any;
  timestamp: string;
}

export interface StoredMediaFile {
  id: string;
  conversationId: string;
  uploadedBy: string;
  uploaderType: 'CUSTOMER' | 'ADMIN';
  mimeType: string;
  fileBufferBase64: string;
  durationSeconds: number;
  sizeBytes: number;
  waveform: number[];
  token: string;
  createdAt: string;
}

