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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";

async function getSellers(token: string, searchParams: { [key: string]: string | string[] | undefined }) {
  try {
    const q = searchParams.q ? `&q=${searchParams.q}` : "";
    const status = searchParams.status ? `&status=${searchParams.status}` : "";
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/v1"}/admin/sellers?limit=50${q}${status}`, {
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

export default async function AdminSellersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const token = await requireAuth();
  const params = await searchParams;
  const data = await getSellers(token, params);
  const t = await getTranslations("admin");

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("sellers") || "Sellers & KYC"}</h1>
          <p className="text-muted-foreground mt-1">Review seller applications and manage accounts.</p>
        </div>
        
        <div className="flex gap-2">
          <Button asChild variant={params.status === "SUBMITTED" ? "default" : "outline"}>
            <Link href="?status=SUBMITTED">Pending KYC</Link>
          </Button>
          <Button asChild variant={!params.status ? "default" : "outline"}>
            <Link href="/admin/sellers">All Sellers</Link>
          </Button>
          <form className="flex w-full md:max-w-xs items-center space-x-2">
            <Input type="search" name="q" placeholder={t("search") || "Search..."} defaultValue={params.q as string} />
            <Button type="submit" size="icon" variant="secondary">
              <Search className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>

      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Store Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead className="text-right">{t("actions") || "Actions"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.items?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                  No sellers found.
                </TableCell>
              </TableRow>
            ) : (
              data.items?.map((seller: any) => (
                <TableRow key={seller.id}>
                  <TableCell className="font-medium">{seller.displayName}</TableCell>
                  <TableCell>{seller.businessType}</TableCell>
                  <TableCell>{seller.countryCode}</TableCell>
                  <TableCell>
                    <Badge variant={
                      seller.status === 'APPROVED' ? 'default' : 
                      seller.status === 'SUBMITTED' ? 'secondary' : 
                      'destructive'
                    }>
                      {seller.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(seller.submittedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    {seller.status === 'SUBMITTED' ? (
                      <>
                        <Button variant="outline" size="sm" className="text-emerald-600">
                          <CheckCircle className="h-4 w-4 mr-1" /> Approve
                        </Button>
                        <Button variant="outline" size="sm" className="text-destructive">
                          <XCircle className="h-4 w-4 mr-1" /> Reject
                        </Button>
                      </>
                    ) : (
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    )}
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
