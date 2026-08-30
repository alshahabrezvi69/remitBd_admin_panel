import {
  Currency,
  Deposit,
  FundingAccount,
  PaymentMethod,
  PaymentMethodAuditLog,
  PaymentMethodSnapshot,
  PaymentMethodVersion,
  TimelineEvent,
  Transfer,
  User,
} from '../types';

export type AnyRecord = Record<string, any>;

export const getApiBaseUrl = (): string => {
  const custom = typeof window !== 'undefined' ? localStorage.getItem('remitbd_api_base_url') : null;
  if (custom && custom.trim()) {
    return custom.trim().replace(/\/+$/, '');
  }
  const envUrl = (import.meta.env.VITE_API_BASE_URL || '').trim();
  if (envUrl) {
    return envUrl.replace(/\/+$/, '');
  }
  return '';
};

export const setCustomApiBaseUrl = (url: string | null): void => {
  if (typeof window === 'undefined') return;
  if (!url || !url.trim()) {
    localStorage.removeItem('remitbd_api_base_url');
  } else {
    localStorage.setItem('remitbd_api_base_url', url.trim().replace(/\/+$/, ''));
  }
};

export const apiUrl = (path: string): string => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const base = getApiBaseUrl();
  return base ? `${base}${cleanPath}` : cleanPath;
};

export const apiFetch = (input: string, init?: RequestInit): Promise<Response> => {
  return fetch(apiUrl(input), init);
};

export const asString = (value: unknown, fallback = ''): string => {
  if (value === null || value === undefined) return fallback;
  return String(value);
};

export const asNumber = (value: unknown, fallback = 0): number => {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const asBoolean = (value: unknown, fallback = false): boolean => {
  if (typeof value === 'boolean') return value;
  if (value === 'true' || value === 1 || value === '1') return true;
  if (value === 'false' || value === 0 || value === '0') return false;
  return fallback;
};

export const readApiError = (payload: unknown, fallback = 'The server could not complete the request.') => {
  const data = payload as any;
  if (typeof data === 'string' && data.trim()) return data;
  if (data && typeof data.detail === 'string' && data.detail.trim()) return data.detail;
  if (data && typeof data.error === 'string' && data.error.trim()) return data.error;
  if (data && Array.isArray(data.detail)) {
    const messages = data.detail.map((item: AnyRecord) => item?.msg).filter(Boolean);
    if (messages.length) return messages.join('; ');
  }
  return fallback;
};

const value = (item: AnyRecord, camel: string, snake: string, fallback?: unknown) =>
  item?.[camel] ?? item?.[snake] ?? fallback;

const normalizeTimeline = (items: unknown): TimelineEvent[] => {
  if (!Array.isArray(items)) return [];
  return items.map((item: AnyRecord) => ({
    timestamp: asString(value(item, 'timestamp', 'timestamp'), ''),
    status: asString(value(item, 'status', 'status'), 'UNKNOWN'),
    actor: asString(value(item, 'actor', 'actor'), 'SYSTEM'),
    message: asString(value(item, 'message', 'message'), ''),
  }));
};

export const normalizeUser = (item: AnyRecord = {}): User => {
  const balances = value(item, 'balances', 'balances', {});
  const normalizedBalances = Object.fromEntries(
    Object.entries(balances && typeof balances === 'object' ? balances : {}).map(([key, amount]) => [key, asNumber(amount)])
  ) as Partial<Record<Currency, number>>;
  const name = asString(value(item, 'fullName', 'full_name'), 'Unnamed customer');
  return {
    id: asString(item.id, 'unknown-user'),
    fullName: name,
    email: asString(item.email, 'No email provided'),
    phone: asString(item.phone, 'No phone provided'),
    country: asString(item.country, 'Not specified'),
    countryCode: asString(value(item, 'countryCode', 'country_code')),
    nativeCurrency: asString(value(item, 'nativeCurrency', 'native_currency'), 'SAR') as Currency,
    kycStatus: asString(value(item, 'kycStatus', 'kyc_status'), 'NOT_SUBMITTED') as User['kycStatus'],
    accountStatus: asString(value(item, 'accountStatus', 'account_status'), 'ACTIVE') as User['accountStatus'],
    riskLevel: asString(value(item, 'riskLevel', 'risk_level'), 'LOW') as User['riskLevel'],
    balances: normalizedBalances,
    createdAt: asString(value(item, 'createdAt', 'created_at')),
    kycDocuments: Array.isArray(value(item, 'kycDocuments', 'kyc_documents')) ? value(item, 'kycDocuments', 'kyc_documents') : [],
    address: asString(item.address),
    occupation: asString(item.occupation),
    isBanned: asBoolean(value(item, 'isBanned', 'is_banned', item.account_status === 'BANNED' || item.accountStatus === 'BANNED')),
    banReason: asString(value(item, 'banReason', 'ban_reason')),
    bannedAt: asString(value(item, 'bannedAt', 'banned_at')),
  };
};

export const normalizeDeposit = (item: AnyRecord = {}): Deposit => ({
  id: asString(item.id, 'unknown-deposit'),
  userId: asString(value(item, 'userId', 'user_id')),
  userName: asString(value(item, 'userName', 'user_name'), 'Unknown customer'),
  userEmail: asString(value(item, 'userEmail', 'user_email'), 'No email provided'),
  country: asString(item.country, 'Not specified'),
  currency: asString(item.currency, 'SAR') as Currency,
  amount: asNumber(item.amount),
  paymentMethodId: asString(value(item, 'paymentMethodId', 'payment_method_id')),
  paymentMethodName: asString(value(item, 'paymentMethodName', 'payment_method_name'), 'Manual funding'),
  paymentMethodSnapshot: normalizePaymentMethodSnapshot(value(item, 'paymentMethodSnapshot', 'payment_method_snapshot')),
  customerTrxId: asString(value(item, 'customerTrxId', 'customer_trx_id')),
  reference: asString(item.reference, 'No reference'),
  providerReference: asString(value(item, 'providerReference', 'provider_reference')),
  fundingAccountId: asString(value(item, 'fundingAccountId', 'funding_account_id')),
  fundingAccountName: asString(value(item, 'fundingAccountName', 'funding_account_name'), 'Configured funding account'),
  status: asString(item.status, 'PENDING') as Deposit['status'],
  paymentStatus: asString(value(item, 'paymentStatus', 'payment_status'), 'AWAITING_PAYMENT') as Deposit['paymentStatus'],
  complianceStatus: asString(value(item, 'complianceStatus', 'compliance_status'), 'CLEARED') as Deposit['complianceStatus'],
  ledgerStatus: asString(value(item, 'ledgerStatus', 'ledger_status'), 'PENDING') as Deposit['ledgerStatus'],
  notes: asString(item.notes),
  receiptUrl: asString(value(item, 'receiptUrl', 'receipt_url')),
  createdAt: asString(value(item, 'createdAt', 'created_at')),
  updatedAt: asString(value(item, 'updatedAt', 'updated_at')),
  timeline: normalizeTimeline(item.timeline),
});

export const normalizeTransfer = (item: AnyRecord = {}): Transfer => {
  const risk = value(item, 'riskResult', 'risk_result', {});
  return {
    id: asString(item.id, 'unknown-transfer'),
    senderId: asString(value(item, 'senderId', 'sender_id')),
    senderName: asString(value(item, 'senderName', 'sender_name'), 'Unknown sender'),
    senderEmail: asString(value(item, 'senderEmail', 'sender_email'), 'No email provided'),
    country: asString(item.country, 'Not specified'),
    currency: asString(item.currency, 'SAR') as Currency,
    amount: asNumber(item.amount),
    fxRate: asNumber(value(item, 'fxRate', 'fx_rate')),
    fee: asNumber(item.fee),
    recipientName: asString(value(item, 'recipientName', 'recipient_name'), 'Unknown recipient'),
    recipientPhone: asString(value(item, 'recipientPhone', 'recipient_phone'), 'No phone provided'),
    recipientRelationship: asString(value(item, 'recipientRelationship', 'recipient_relationship'), 'Family'),
    payoutMethod: asString(value(item, 'payoutMethod', 'payout_method'), 'BANK_TRANSFER') as Transfer['payoutMethod'],
    payoutAccountNumber: asString(value(item, 'payoutAccountNumber', 'payout_account_number'), 'Not provided'),
    bankName: asString(item.bankName ?? item.bank_name),
    branchName: asString(item.branchName ?? item.branch_name),
    routingNumber: asString(item.routingNumber ?? item.routing_number),
    bdtAmount: asNumber(value(item, 'bdtAmount', 'bdt_amount')),
    status: asString(item.status, 'CREATED') as Transfer['status'],
    providerReference: asString(value(item, 'providerReference', 'provider_reference')),
    payoutReference: asString(value(item, 'payoutReference', 'payout_reference')),
    complianceStatus: asString(value(item, 'complianceStatus', 'compliance_status'), 'CLEARED') as Transfer['complianceStatus'],
    riskResult: {
      score: asNumber(value(risk, 'score', 'score')),
      flagged: asBoolean(value(risk, 'flagged', 'flagged')),
      flagReason: asString(value(risk, 'flagReason', 'flag_reason')),
    },
    ledgerTransactionId: asString(value(item, 'ledgerTransactionId', 'ledger_transaction_id')),
    createdAt: asString(value(item, 'createdAt', 'created_at')),
    updatedAt: asString(value(item, 'updatedAt', 'updated_at')),
    timeline: normalizeTimeline(item.timeline),
    auditHistory: Array.isArray(value(item, 'auditHistory', 'audit_history')) ? value(item, 'auditHistory', 'audit_history').map((entry: AnyRecord) => ({
      timestamp: asString(entry.timestamp),
      adminId: asString(value(entry, 'adminId', 'admin_id')),
      role: asString(entry.role, 'AUDITOR') as User['riskLevel'] as any,
      action: asString(entry.action),
      reason: asString(entry.reason),
    })) : [],
  };
};

export const normalizePaymentMethodSnapshot = (item: AnyRecord | null | undefined): PaymentMethodSnapshot | undefined => {
  if (!item || typeof item !== 'object') return undefined;
  return {
    ...item,
    id: asString(item.id, 'snapshot'),
    providerName: asString(value(item, 'providerName', 'provider_name')),
    methodType: asString(value(item, 'methodType', 'method_type')),
    displayName: asString(value(item, 'displayName', 'display_name'), 'Payment method'),
    countryCode: asString(value(item, 'countryCode', 'country_code')),
    currencyCode: asString(value(item, 'currencyCode', 'currency_code')) as Currency,
    accountName: asString(value(item, 'accountName', 'account_name')),
    accountNumber: asString(value(item, 'accountNumber', 'account_number')),
    bankName: asString(value(item, 'bankName', 'bank_name')),
    minimumAmount: asNumber(value(item, 'minimumAmount', 'minimum_amount')),
    maximumAmount: asNumber(value(item, 'maximumAmount', 'maximum_amount')),
  };
};

export const normalizePaymentMethod = (item: AnyRecord = {}): PaymentMethod => ({
  id: asString(item.id, 'unknown-payment-method'),
  name: asString(item.name ?? value(item, 'displayName', 'display_name'), 'Payment method'),
  code: asString(item.code),
  providerName: asString(value(item, 'providerName', 'provider_name')),
  provider: asString(item.provider),
  methodType: asString(value(item, 'methodType', 'method_type'), 'BANK_TRANSFER') as PaymentMethod['methodType'],
  country: asString(item.country, 'Not specified'),
  countryCode: asString(value(item, 'countryCode', 'country_code')),
  currencyCode: asString(value(item, 'currencyCode', 'currency_code')) as Currency,
  currency: asString(item.currency) as Currency,
  supportedCountries: Array.isArray(item.supportedCountries) ? item.supportedCountries : [],
  supportedCurrencies: Array.isArray(item.supportedCurrencies) ? item.supportedCurrencies : [],
  displayName: asString(value(item, 'displayName', 'display_name'), 'Payment method'),
  accountName: asString(value(item, 'accountName', 'account_name')),
  accountNumber: asString(value(item, 'accountNumber', 'account_number')),
  walletNumber: asString(value(item, 'walletNumber', 'wallet_number')),
  bankName: asString(value(item, 'bankName', 'bank_name')),
  branchName: asString(value(item, 'branchName', 'branch_name')),
  routingNumber: asString(value(item, 'routingNumber', 'routing_number')),
  iban: asString(item.iban),
  swift: asString(item.swift),
  instructions: Array.isArray(item.instructions) ? item.instructions : item.instructions ? [String(item.instructions)] : [],
  minimumAmount: asNumber(value(item, 'minimumAmount', 'minimum_amount')),
  maximumAmount: asNumber(value(item, 'maximumAmount', 'maximum_amount')),
  minLimit: asNumber(item.minLimit),
  maxLimit: asNumber(item.maxLimit),
  feePercent: asNumber(value(item, 'feePercent', 'fee_percent')),
  feeFixed: asNumber(value(item, 'feeFixed', 'fee_fixed')),
  status: asString(item.status, 'ACTIVE') as PaymentMethod['status'],
  displayOrder: asNumber(value(item, 'displayOrder', 'display_order')),
  currentVersion: asNumber(value(item, 'currentVersion', 'current_version'), 1),
  createdAt: asString(value(item, 'createdAt', 'created_at')),
  updatedAt: asString(value(item, 'updatedAt', 'updated_at')),
  createdBy: asString(value(item, 'createdBy', 'created_by')),
  updatedBy: asString(value(item, 'updatedBy', 'updated_by')),
  icon: asString(item.icon),
});

export const normalizeFundingAccount = (item: AnyRecord = {}): FundingAccount => ({
  id: asString(item.id, 'unknown-funding-account'),
  country: asString(item.country, 'Not specified'),
  countryCode: asString(value(item, 'countryCode', 'country_code')),
  currency: asString(item.currency, 'SAR') as Currency,
  provider: asString(item.provider, 'Manual collection'),
  paymentMethod: asString(value(item, 'paymentMethod', 'payment_method'), 'Bank Transfer'),
  accountDisplayName: asString(value(item, 'accountDisplayName', 'account_display_name'), 'Funding account'),
  bankName: asString(value(item, 'bankName', 'bank_name')),
  accountNumber: asString(value(item, 'accountNumber', 'account_number')),
  iban: asString(item.iban),
  swift: asString(item.swift),
  paymentInstructions: asString(value(item, 'paymentInstructions', 'payment_instructions')),
  status: asString(item.status, 'ACTIVE') as FundingAccount['status'],
  minDeposit: asNumber(value(item, 'minDeposit', 'min_deposit')),
  maxDeposit: asNumber(value(item, 'maxDeposit', 'max_deposit')),
  createdAt: asString(value(item, 'createdAt', 'created_at')),
  updatedAt: asString(value(item, 'updatedAt', 'updated_at')),
});

export const normalizePaymentMethodVersion = (item: AnyRecord = {}): PaymentMethodVersion => ({
  id: asString(item.id, 'unknown-version'),
  paymentMethodId: asString(value(item, 'paymentMethodId', 'payment_method_id')),
  version: asNumber(item.version, 1),
  snapshot: normalizePaymentMethodSnapshot(value(item, 'snapshot', 'snapshot')),
  configurationSnapshot: normalizePaymentMethodSnapshot(value(item, 'configurationSnapshot', 'configuration_snapshot')) as Partial<PaymentMethod> | undefined,
  changedBy: asString(value(item, 'changedBy', 'created_by')),
  changedByEmail: asString(value(item, 'changedByEmail', 'created_by')),
  changedByRole: asString(value(item, 'changedByRole', 'created_by_role'), 'AUDITOR') as PaymentMethodVersion['changedByRole'],
  changeReason: asString(value(item, 'changeReason', 'reason')),
  createdAt: asString(value(item, 'createdAt', 'created_at')),
  status: asString(item.status, 'ACTIVE') as PaymentMethodVersion['status'],
  diffSummary: Array.isArray(item.diffSummary) ? item.diffSummary : [],
});

export const normalizePaymentMethodAuditLog = (item: AnyRecord = {}): PaymentMethodAuditLog => ({
  id: asString(item.id, 'unknown-audit-log'),
  paymentMethodId: asString(value(item, 'paymentMethodId', 'resource_id')),
  paymentMethodName: asString(value(item, 'paymentMethodName', 'resource')),
  adminId: asString(value(item, 'adminId', 'admin_id')),
  adminEmail: asString(value(item, 'adminEmail', 'admin_email'), 'Unknown administrator'),
  adminRole: asString(value(item, 'adminRole', 'admin_role'), 'AUDITOR') as PaymentMethodAuditLog['adminRole'],
  action: asString(item.action, 'UPDATE'),
  oldValue: value(item, 'oldValue', 'old_state'),
  newValue: value(item, 'newValue', 'new_state'),
  changes: Array.isArray(item.changes) ? item.changes : [],
  reason: asString(item.reason),
  ipAddress: asString(value(item, 'ipAddress', 'ip_address')),
  ip: asString(item.ip),
  userAgent: asString(item.userAgent),
  createdAt: asString(value(item, 'createdAt', 'created_at')),
  timestamp: asString(item.timestamp ?? item.created_at),
});
