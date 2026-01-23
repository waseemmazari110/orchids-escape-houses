"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OwnerTransactions } from "@/components/admin/OwnerTransactions";
import { GuestTransactions } from "@/components/admin/GuestTransactions";
import { CreditCard, Home, Users } from "lucide-react";

export default function TransactionsWithTabs() {
  const [activeTab, setActiveTab] = useState("guests");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Transaction Management</h2>
        <p className="text-muted-foreground mt-1">
          View and manage all payment transactions across the platform
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="guests" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            Guest Bookings
          </TabsTrigger>
          <TabsTrigger value="owners" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Owner Plans
          </TabsTrigger>
        </TabsList>

        <TabsContent value="guests" className="mt-6">
          <GuestTransactions />
        </TabsContent>

        <TabsContent value="owners" className="mt-6">
          <OwnerTransactions />
        </TabsContent>
      </Tabs>
    </div>
  );
}
