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
import { Undo2, User, Store, ShoppingBag } from "lucide-react";
import { RefundActions } from "./refund-actions";

async function getRefunds(token: string, status?: string) {
  try {
    const statusQuery = status ? `&status=${status}` : "";
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/v1"}/admin/refunds?limit=50${statusQuery}`, {
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

export default async function AdminRefundsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; locale: string }>
}) {
  const token = await requireAuth();
  const params = await searchParams;
  const data = await getRefunds(token, params.status);
  const t = await getTranslations("admin");

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat(params.locale, {
      style: "currency",
      currency: "EUR",
    }).format(cents / 100);
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'REQUESTED': return 'default';
      case 'APPROVED': return 'secondary';
      case 'PROCESSING': return 'outline';
      case 'COMPLETED': return 'default'; // Success usually
      case 'REJECTED': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Undo2 className="h-8 w-8 text-primary" />
            {t("refunds") || "Refunds & Disputes"}
          </h1>
          <p className="text-muted-foreground mt-1">Manage buyer refund requests and dispute escalations.</p>
        </div>
      </div>

      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order / Date</TableHead>
              <TableHead>Buyer</TableHead>
              <TableHead>Seller</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">{t("actions") || "Actions"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.items?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                  No refund requests found.
                </TableCell>
              </TableRow>
            ) : (
              data.items?.map((refund: any) => (
                <TableRow key={refund.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1 font-medium">
                        <ShoppingBag className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>Order #{refund.order?.id?.slice(-8).toUpperCase()}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(refund.createdAt).toLocaleDateString(params.locale)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div className="flex flex-col">
                        <span>{refund.buyer?.name || "N/A"}</span>
                        <span className="text-xs text-muted-foreground">{refund.buyer?.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Store className="h-4 w-4 text-muted-foreground" />
                      <span>{refund.seller?.displayName || "N/A"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-bold">
                    {formatPrice(refund.amountCents)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(refund.status)}>
                      {refund.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <RefundActions refundId={refund.id} status={refund.status} token={token} />
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
