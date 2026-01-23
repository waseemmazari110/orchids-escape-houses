/**
 * Transactions Component
 * Admin dashboard component to view all payment transactions from owners
 * Similar to Stripe dashboard transaction view
 */

"use client";

import { useState, useEffect } from "react";
import { 
  CreditCard,
  Download,
  ExternalLink,
  Search,
  Loader2,
  RefreshCcw,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Transaction {
  id: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethodBrand: string;
  paymentMethodLast4: string;
  description: string;
  customer: {
    name: string;
    email: string;
    role?: string;
  };
  date: string;
  stripeId: string;
  propertyName?: string;
  failureMessage?: string | null;
  isBookingPayment?: boolean;
  receiptUrl?: string | null;
  refundAmount?: number;
}

interface StatusCounts {
  all: number;
  succeeded: number;
  pending: number;
  failed: number;
  refunded: number;
  canceled: number;
  bookingPayments?: number;
  subscriptionPayments?: number;
}

type StatusFilter = 'all' | 'succeeded' | 'pending' | 'failed' | 'refunded' | 'canceled';

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({
    all: 0,
    succeeded: 0,
    pending: 0,
    failed: 0,
    refunded: 0,
    canceled: 0,
  });
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState("");

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status: statusFilter,
        search: searchQuery,
        limit: '100',
      });

      const response = await fetch(`/api/admin/transactions?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Transactions data received:', {
          transactionsCount: data.transactions?.length,
          stats: data.stats,
          total: data.total
        });
        setTransactions(data.transactions || []);
        setStatusCounts({
          all: data.total || 0,
          succeeded: data.stats?.successful || 0,
          pending: data.stats?.pending || 0,
          failed: data.stats?.failed || 0,
          refunded: data.stats?.refunded || 0,
          canceled: data.stats?.cancelled || 0,
          bookingPayments: data.stats?.bookingPayments || 0,
          subscriptionPayments: data.stats?.subscriptionPayments || 0,
        });
        setTotalRevenue(data.stats?.totalRevenue || 0);
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch transactions:', response.status, errorText);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [statusFilter]);

  const handleSearch = () => {
    fetchTransactions();
  };

  const formatDate = (dateString: string | null | undefined): string => {
    // Early return for null/undefined/empty
    if (!dateString) return 'N/A';
    
    const str = String(dateString).trim();
    if (str === '' || str === 'null' || str === 'undefined') return 'N/A';
    
    // Just return the date string as-is if it looks valid
    // Don't try to format it to avoid any RangeError
    if (str.length > 8 && (str.includes('/') || str.includes('-') || str.includes('T'))) {
      return str.replace('T', ' ').split('.')[0]; // Clean format
    }
    
    return 'Invalid Date';
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'succeeded':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-amber-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'refunded':
        return <RefreshCcw className="w-4 h-4 text-blue-600" />;
      case 'canceled':
        return <XCircle className="w-4 h-4 text-gray-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'succeeded':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'pending':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'failed':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'refunded':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'canceled':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getCardBrandLogo = (brand: string) => {
    const brandLower = brand.toLowerCase();
    switch (brandLower) {
      case 'visa':
        return '💳';
      case 'mastercard':
        return '💳';
      case 'amex':
        return '💳';
      default:
        return '💳';
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      transaction.customer.email.toLowerCase().includes(query) ||
      transaction.customer.name.toLowerCase().includes(query) ||
      transaction.description.toLowerCase().includes(query) ||
      (transaction.stripePaymentIntentId && transaction.stripePaymentIntentId.toLowerCase().includes(query))
    );
  });

  return (
    <div className="w-full">
      {/* Header Section */}
      <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200 mb-6">
        <div className="mb-4">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
            Transactions
          </h2>
          <p className="text-gray-600 text-sm">
            View all payment transactions from owners
          </p>
        </div>

        {/* Revenue Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
          <div className="bg-green-50 rounded-lg p-3 border border-green-200">
            <div className="text-xs font-medium text-green-700 mb-1">Total Revenue</div>
            <div className="text-lg sm:text-xl font-bold text-green-600 truncate">
              {formatAmount(totalRevenue, 'GBP')}
            </div>
          </div>
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
            <div className="text-xs font-medium text-blue-700 mb-1">Successful</div>
            <div className="text-lg sm:text-xl font-bold text-blue-600">{statusCounts.succeeded}</div>
          </div>
          <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
            <div className="text-xs font-medium text-amber-700 mb-1">Pending</div>
            <div className="text-lg sm:text-xl font-bold text-amber-600">{statusCounts.pending}</div>
          </div>
          <div className="bg-red-50 rounded-lg p-3 border border-red-200">
            <div className="text-xs font-medium text-red-700 mb-1">Failed</div>
            <div className="text-lg sm:text-xl font-bold text-red-600">{statusCounts.failed}</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
            <div className="text-xs font-medium text-purple-700 mb-1">Bookings</div>
            <div className="text-lg sm:text-xl font-bold text-purple-600">{statusCounts.bookingPayments || 0}</div>
          </div>
          <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-200">
            <div className="text-xs font-medium text-indigo-700 mb-1">Subscriptions</div>
            <div className="text-lg sm:text-xl font-bold text-indigo-600">{statusCounts.subscriptionPayments || 0}</div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-4">
          {(['all', 'succeeded', 'pending', 'failed', 'refunded', 'canceled'] as StatusFilter[]).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-2 rounded-lg font-medium text-xs sm:text-sm whitespace-nowrap transition-all duration-200 ${
                statusFilter === status
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="hidden sm:inline">{status.charAt(0).toUpperCase() + status.slice(1)}</span>
              <span className="sm:hidden">{status.charAt(0).toUpperCase()}</span>
              <span className={`ml-1 text-xs ${statusFilter === status ? 'text-blue-100' : 'text-gray-500'}`}>
                ({statusCounts[status]})
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-9 pr-3 py-2 w-full text-sm"
            />
          </div>
          <Button onClick={handleSearch} variant="outline" size="sm" className="px-4 whitespace-nowrap">
            Search
          </Button>
        </div>
      </div>

      {/* Transactions Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl shadow-sm border border-gray-200">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
          <p className="text-gray-600 text-sm">Loading transactions...</p>
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-8 sm:p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
            <CreditCard className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
            {searchQuery ? 'No transactions found' : 'No transactions yet'}
          </h3>
          <p className="text-gray-600 text-sm max-w-md mx-auto mb-4">
            {searchQuery
              ? 'Try adjusting your search terms or select a different filter'
              : 'Payment transactions from owners will appear here automatically when they make payments through Stripe'}
          </p>
          {!searchQuery && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg max-w-md mx-auto">
              <p className="text-sm text-blue-800 mb-2">
                <strong>Note:</strong> Transactions are automatically captured via Stripe webhooks
              </p>
              <p className="text-xs text-blue-700">
                Make sure your Stripe webhook is configured at: <code className="bg-blue-100 px-1 rounded">/api/webhooks/billing</code>
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-max">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase hidden sm:table-cell">
                    Payment Method
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase hidden md:table-cell">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase hidden lg:table-cell">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTransactions.filter(t => t && t.id).map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {formatAmount(transaction.amount, transaction.currency)}
                      </div>
                      {transaction.refundAmount > 0 && (
                        <div className="text-xs text-red-600">
                          Refunded: {formatAmount(transaction.refundAmount, transaction.currency)}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(transaction.status)}`}>
                        {getStatusIcon(transaction.status)}
                        <span className="hidden sm:inline">{transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap hidden sm:table-cell">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{getCardBrandLogo(transaction.paymentMethodBrand)}</span>
                        <div>
                          <div className="text-xs font-medium text-gray-900">
                            {transaction.paymentMethodBrand.toUpperCase()}
                          </div>
                          <div className="text-xs text-gray-500">•••• {transaction.paymentMethodLast4}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900 truncate max-w-[150px]">{transaction.customer.name}</div>
                      <div className="text-xs text-gray-500 truncate max-w-[150px]">{transaction.customer.email}</div>
                      {transaction.customer.role === 'owner' && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                          Owner
                        </span>
                      )}
                      {transaction.isBookingPayment && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                          Booking
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="text-sm text-gray-900 max-w-[200px] truncate">{transaction.description}</div>
                      {transaction.propertyName && transaction.propertyName !== 'N/A' && (
                        <div className="text-xs text-blue-600 mt-1 font-medium">
                          🏠 {transaction.propertyName}
                        </div>
                      )}
                      {!transaction.isBookingPayment && (
                        <div className="text-xs text-purple-600 mt-1 font-medium">
                          💼 Subscription Payment
                        </div>
                      )}
                      {transaction.failureMessage && (
                        <div className="text-xs text-red-600 mt-1">
                          ❌ {transaction.failureMessage}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap hidden lg:table-cell">
                      <div className="text-xs text-gray-900">
                        {formatDate(transaction?.date)}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {transaction.stripeId && transaction.stripeId !== 'N/A' && (
                          <a
                            href={`https://dashboard.stripe.com/payments/${transaction.stripeId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700 p-1"
                            title="View in Stripe"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
