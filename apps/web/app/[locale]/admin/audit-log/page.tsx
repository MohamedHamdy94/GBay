import { requireAuth } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileText, User, Shield, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

async function getAuditLogs(token: string, searchParams: { action?: string; adminId?: string }) {
  try {
    const q = new URLSearchParams();
    if (searchParams.action) q.append("action", searchParams.action);
    if (searchParams.adminId) q.append("adminId", searchParams.adminId);
    
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/v1"}/admin/audit-log?limit=50&${q.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      next: { revalidate: 0 }
    });
    if (!res.ok) return { items: [] };
    return await res.json();
  } catch (error) {
    return { items: [] };
  }
}

export default async function AdminAuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; adminId?: string; locale: string }>
}) {
  const token = await requireAuth();
  const params = await searchParams;
  const data = await getAuditLogs(token, params);
  const t = await getTranslations("admin");

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-8 w-8 text-primary" />
            Audit Logs
          </h1>
          <p className="text-muted-foreground mt-1">Trace all administrative actions and system configuration changes.</p>
        </div>
      </div>

      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Admin</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.items?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                  No audit logs found.
                </TableCell>
              </TableRow>
            ) : (
              data.items?.map((log: any) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-primary/70" />
                      <div className="flex flex-col">
                        <span className="font-medium">{log.admin?.name || "System"}</span>
                        <span className="text-[10px] text-muted-foreground">{log.admin?.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-[10px] uppercase">
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold">{log.targetType}</span>
                      <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[100px]">{log.targetId}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm italic">{log.reason || "N/A"}</span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(log.createdAt).toLocaleString(params.locale)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Info className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Audit Detail: {log.action}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="space-y-1">
                              <p className="text-muted-foreground">Action</p>
                              <p className="font-mono font-bold uppercase">{log.action}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-muted-foreground">Date</p>
                              <p>{new Date(log.createdAt).toLocaleString(params.locale)}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-muted-foreground">Target Type</p>
                              <p className="font-semibold">{log.targetType}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-muted-foreground">Target ID</p>
                              <p className="font-mono text-xs">{log.targetId}</p>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">Reason</p>
                            <p className="bg-muted p-2 rounded text-sm italic border">{log.reason || "No reason provided"}</p>
                          </div>
                          {log.details && (
                            <div className="space-y-1">
                              <p className="text-sm text-muted-foreground">Raw Details</p>
                              <pre className="bg-muted p-4 rounded text-xs overflow-auto max-h-[300px] border">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
