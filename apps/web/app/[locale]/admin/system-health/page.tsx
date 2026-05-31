import { requireAuth } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Activity, 
  Database, 
  Cpu, 
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Search
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

async function getHealthData(token: string) {
  const fetchOptions = {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 30 }
  };
  
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/v1";
  
  try {
    const [health, summary, errors] = await Promise.all([
      fetch(`${baseUrl}/admin/monitoring/health`, fetchOptions).then(res => res.json()),
      fetch(`${baseUrl}/admin/monitoring/metrics/summary`, fetchOptions).then(res => res.json()),
      fetch(`${baseUrl}/admin/monitoring/errors`, fetchOptions).then(res => res.json())
    ]);
    
    return { health, summary, errors };
  } catch (error) {
    return null;
  }
}

export default async function AdminHealthPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const token = await requireAuth();
  const { locale } = await params;
  const data = await getHealthData(token);
  const t = await getTranslations("admin");

  if (!data) return <div>Error loading health data.</div>;

  const formatMemory = (bytes: number) => {
    return (bytes / 1024 / 1024).toFixed(2) + " MB";
  };

  const getStatusIcon = (status: string) => {
    if (status === 'up' || status === 'ok') return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
    return <XCircle className="h-5 w-5 text-destructive" />;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Activity className="h-8 w-8 text-primary" />
          System Health
        </h1>
        <p className="text-muted-foreground mt-1">Real-time status monitoring of infrastructure and services.</p>
      </div>

      {/* Service Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              Database
              {getStatusIcon(data.health.info?.database?.status || 'down')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-mono">PostgreSQL (Neon)</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              Search Engine
              {getStatusIcon(data.health.info?.meilisearch?.status || 'down')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-mono">Meilisearch</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              Cache & Queues
              {getStatusIcon(data.health.info?.redis?.status || 'down')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-mono">Redis (Upstash)</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Runtime Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Cpu className="h-5 w-5 text-blue-500" />
              Runtime Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Uptime</p>
                <p className="font-mono text-sm">{(data.summary.uptime / 3600).toFixed(2)} hours</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Heap Used</p>
                <p className="font-mono text-sm">{formatMemory(data.summary.memoryUsage?.heapUsed)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">RSS</p>
                <p className="font-mono text-sm">{formatMemory(data.summary.memoryUsage?.rss)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Last Metric Update</p>
                <p className="font-mono text-[10px]">{new Date(data.summary.timestamp).toLocaleString(locale)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Tracking */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Recent System Errors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.errors.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground italic text-sm">
                  No critical errors reported in the last 24h.
                </div>
              ) : (
                data.errors.map((err: any, i: number) => (
                  <div key={i} className="border-l-2 border-destructive pl-4 py-1">
                    <p className="text-xs font-bold text-destructive uppercase">{err.type || 'Error'}</p>
                    <p className="text-sm font-medium line-clamp-1">{err.message}</p>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
                      <Clock className="h-3 w-3" />
                      {new Date(err.timestamp).toLocaleString(locale)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
