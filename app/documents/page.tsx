"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { Shell } from "@/components/layout/shell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/documents");
      if (res.ok) setDocuments(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleVerify = async (id: string, verificationStatus: string) => {
    try {
      const res = await fetch(`/api/documents/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verificationStatus }),
      });
      if (res.ok) loadDocuments();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Shell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Tenant Documents & KYC Vault</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Secure identity proofs, Aadhaar, PAN, police verifications, and agreements
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-muted/50 font-semibold text-muted-foreground">
                <tr>
                  <th className="p-3.5">Document Title</th>
                  <th className="p-3.5">Resident</th>
                  <th className="p-3.5">Type</th>
                  <th className="p-3.5">Uploaded Date</th>
                  <th className="p-3.5">Verification Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">Loading documents...</td>
                  </tr>
                ) : documents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-muted-foreground">No documents uploaded</td>
                  </tr>
                ) : (
                  documents.map((d) => (
                    <tr key={d.id} className="hover:bg-accent/40 transition-colors">
                      <td className="p-3.5 font-semibold text-foreground flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        <span>{d.title}</span>
                      </td>
                      <td className="p-3.5 font-medium">{d.tenant?.fullName}</td>
                      <td className="p-3.5">
                        <span className="rounded bg-secondary px-2 py-0.5 text-[11px] font-semibold">
                          {d.documentType}
                        </span>
                      </td>
                      <td className="p-3.5 text-muted-foreground">{formatDate(d.createdAt)}</td>
                      <td className="p-3.5">
                        <Badge variant={d.verificationStatus === "VERIFIED" ? "success" : "warning"}>
                          {d.verificationStatus}
                        </Badge>
                      </td>
                      <td className="p-3.5 text-right">
                        {d.verificationStatus !== "VERIFIED" ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleVerify(d.id, "VERIFIED")}
                              className="text-xs h-7 px-2 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10"
                            >
                              Verify
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleVerify(d.id, "REJECTED")}
                              className="text-xs h-7 px-2 text-rose-600 border-rose-500/30 hover:bg-rose-500/10"
                            >
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="text-emerald-600 font-semibold flex items-center justify-end gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Verified
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Shell>
  );
}
