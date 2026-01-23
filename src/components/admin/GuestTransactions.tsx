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
import { Loader2, Download, MapPin, Calendar, Users, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GuestTransaction {
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
  receiptUrl: string | null;
  bookingId: number | null;
  propertyName: string | null;
  propertyLocation: string | null;
  guestName: string | null;
  guestEmail: string | null;
  guestPhone: string | null;
  checkInDate: string | null;
  checkOutDate: string | null;
  numberOfGuests: number | null;
  bookingStatus: string | null;
  totalPrice: number | null;
  depositAmount: number | null;
  balanceAmount: number | null;
  depositPaid: number | null;
  balancePaid: number | null;
}

interface Stats {
  totalTransactions: number;
  totalRevenue: number;
  totalBookings: number;
  depositPayments: number;
  balancePayments: number;
  failedPayments: number;
}

export function GuestTransactions() {
  const [transactions, setTransactions] = useState<GuestTransaction[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/transactions/guests");
      const data = await response.json();

      if (data.success) {
        console.log("Guest Transactions data received:", data);
        setTransactions(data.transactions);
        setStats(data.stats);
      } else {
        setError(data.error || "Failed to fetch guest transactions");
      }
    } catch (err) {
      console.error("Error fetching guest transactions:", err);
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

  const getPaymentTypeBadge = (billingReason: string | null) => {
    if (billingReason === "booking_deposit") {
      return <Badge variant="secondary">Deposit</Badge>;
    }
    if (billingReason === "booking_balance") {
      return <Badge variant="outline">Balance</Badge>;
    }
    return null;
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
    });
  };

  const formatDateTime = (dateString: string) => {
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
        <span className="ml-2">Loading guest transactions...</span>
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
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
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
                Total Bookings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBookings}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Deposits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.depositPayments}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Balances
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.balancePayments}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Failed
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
          <CardTitle>Guest Booking Payments</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Home className="mx-auto h-12 w-12 opacity-50" />
              <p className="mt-2">No guest booking transactions found</p>
            </div>
          ) : (
            <Table>
              <TableCaption>
                A list of all guest booking payments (deposits & balances)
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Payment Date</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Guest</TableHead>
                  <TableHead>Check-in</TableHead>
                  <TableHead>Type</TableHead>
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
                      {formatDateTime(transaction.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium flex items-center gap-1">
                          <Home className="h-3 w-3" />
                          {transaction.propertyName}
                        </span>
                        {transaction.propertyLocation && (
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {transaction.propertyLocation}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{transaction.guestName}</span>
                        <span className="text-sm text-muted-foreground">
                          {transaction.guestEmail}
                        </span>
                        {transaction.numberOfGuests && (
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {transaction.numberOfGuests} guests
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {transaction.checkInDate && (
                        <div className="flex flex-col">
                          <span className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3 w-3" />
                            {formatDate(transaction.checkInDate)}
                          </span>
                          {transaction.checkOutDate && (
                            <span className="text-xs text-muted-foreground">
                              to {formatDate(transaction.checkOutDate)}
                            </span>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {getPaymentTypeBadge(transaction.billingReason)}
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
