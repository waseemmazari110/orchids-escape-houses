"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Download, ExternalLink, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OwnerTransaction {
  id: number;
  userId: string;
  userName: string | null;
  userEmail: string | null;
  userRole: string | null;
  amount: number;
  currency: string;
  status: string;
  paymentMethod: string | null;
  paymentMethodBrand: string | null;
  paymentMethodLast4: string | null;
  description: string | null;
  billingReason: string | null;
  createdAt: string;
  stripePaymentIntentId: string | null;
  stripeSubscriptionId: string | null;
  receiptUrl: string | null;
  subscriptionId: number | null;
  planName: string | null;
  planType: string | null;
  subscriptionStatus: string | null;
  subscriptionInterval: string | null;
  currentPeriodEnd: string | null;
}

interface Stats {
  totalTransactions: number;
  totalRevenue: number;
  activeSubscriptions: number;
  failedPayments: number;
}

export function OwnerTransactions() {
  const [transactions, setTransactions] = useState<OwnerTransaction[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/transactions/owners");
      const data = await response.json();

      if (data.success) {
        console.log("Owner Transactions data received:", data);
        setTransactions(data.transactions);
        setStats(data.stats);
      } else {
        setError(data.error || "Failed to fetch owner transactions");
      }
    } catch (err) {
      console.error("Error fetching owner transactions:", err);
      setError("An error occurred while fetching transactions");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: "default" | "destructive" | "secondary" | "outline"; label: string }> = {
      succeeded: { variant: "default", label: "Paid" },
      pending: { variant: "secondary", label: "Pending" },
      failed: { variant: "destructive", label: "Failed" },
      requires_payment_method: { variant: "destructive", label: "Payment Required" },
      processing: { variant: "secondary", label: "Processing" },
    };

    const statusInfo = statusMap[status] || { variant: "outline" as const, label: status };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading owner transactions...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-red-800">{error}</p>
        <Button onClick={fetchTransactions} className="mt-2" variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTransactions}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats.totalRevenue, "GBP")}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Subscriptions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeSubscriptions}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Failed Payments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats.failedPayments}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Owner Plan & Subscription Payments</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <CreditCard className="mx-auto h-12 w-12 opacity-50" />
              <p className="mt-2">No owner transactions found</p>
            </div>
          ) : (
            <Table>
              <TableCaption>
                A list of all owner subscription and plan payments
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="whitespace-nowrap">
                      {formatDate(transaction.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{transaction.userName || "N/A"}</span>
                        <span className="text-sm text-muted-foreground">
                          {transaction.userEmail}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{transaction.planName}</span>
                        <span className="text-sm text-muted-foreground">
                          {transaction.planType} - {transaction.subscriptionInterval}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {transaction.description}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(transaction.amount, transaction.currency)}
                    </TableCell>
                    <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                    <TableCell>
                      {transaction.paymentMethod && (
                        <div className="flex items-center gap-1">
                          <span className="capitalize">
                            {transaction.paymentMethodBrand || transaction.paymentMethod}
                          </span>
                          {transaction.paymentMethodLast4 && (
                            <span className="text-muted-foreground">
                              •••• {transaction.paymentMethodLast4}
                            </span>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {transaction.receiptUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                        >
                          <a
                            href={transaction.receiptUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Receipt
                          </a>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
