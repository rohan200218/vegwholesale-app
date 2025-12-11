import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Building2, Save } from "lucide-react";
import type { CompanySettings } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

export default function Settings() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    gstNumber: "",
    bankDetails: "",
  });

  const { data: companySettings, isLoading } = useQuery<CompanySettings | null>({
    queryKey: ["/api/company-settings"],
  });

  useEffect(() => {
    if (companySettings) {
      setFormData({
        name: companySettings.name || "",
        address: companySettings.address || "",
        phone: companySettings.phone || "",
        email: companySettings.email || "",
        gstNumber: companySettings.gstNumber || "",
        bankDetails: companySettings.bankDetails || "",
      });
    }
  }, [companySettings]);

  const saveSettings = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest("POST", "/api/company-settings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/company-settings"] });
      toast({ title: "Settings saved", description: "Company settings have been updated successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save settings.", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast({ title: "Validation Error", description: "Company name is required.", variant: "destructive" });
      return;
    }
    saveSettings.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-semibold" data-testid="text-page-title">
          Settings
        </h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Building2 className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>This information will appear on printed invoices and documents</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Company Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Your Company Name"
                  data-testid="input-company-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  data-testid="input-company-phone"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="company@example.com"
                  data-testid="input-company-email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gstNumber">GST Number</Label>
                <Input
                  id="gstNumber"
                  value={formData.gstNumber}
                  onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                  placeholder="22AAAAA0000A1Z5"
                  data-testid="input-gst-number"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Business Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Enter your complete business address"
                rows={3}
                data-testid="input-company-address"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bankDetails">Bank Details</Label>
              <Textarea
                id="bankDetails"
                value={formData.bankDetails}
                onChange={(e) => setFormData({ ...formData, bankDetails: e.target.value })}
                placeholder="Bank Name: ABC Bank&#10;Account No: 1234567890&#10;IFSC: ABCD0001234"
                rows={4}
                data-testid="input-bank-details"
              />
              <p className="text-xs text-muted-foreground">
                This will appear on invoices for payment reference
              </p>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={saveSettings.isPending} data-testid="button-save-settings">
                <Save className="h-4 w-4 mr-2" />
                {saveSettings.isPending ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
