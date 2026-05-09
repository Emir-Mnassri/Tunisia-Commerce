import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  ShoppingBag, TrendingUp, Clock, Package,
  LogOut, Download, RefreshCw, Pencil, Trash2, Check, X,
} from "lucide-react";
import {
  fetchAdminStats, fetchAdminOrders, fetchAdminProducts,
  updateProductField, deleteProduct, updateOrderStatus,
  AdminOrder, AdminProduct,
} from "@/lib/admin-api";
import { generateReceipt } from "@/lib/generate-receipt";
import { formatPrice } from "@/lib/format";

const STORAGE_KEY = "mm_admin_token";

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending:          { label: "En attente",        variant: "secondary" },
  awaiting_payment: { label: "Paiement attendu",  variant: "outline" },
  paid:             { label: "Payé",              variant: "default" },
  shipped:          { label: "Expédié",           variant: "default" },
  delivered:        { label: "Livré",             variant: "default" },
  cancelled:        { label: "Annulé",            variant: "destructive" },
};

const ORDER_STATUSES = ["pending","awaiting_payment","paid","shipped","delivered","cancelled"];

// ─── Login Screen ─────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: (t: string) => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${import.meta.env.BASE_URL?.replace(/\/$/, "") ?? ""}/api/admin/stats`, {
        headers: { Authorization: `Bearer ${password}` },
      });
      if (res.ok) {
        localStorage.setItem(STORAGE_KEY, password);
        onLogin(password);
      } else {
        setError("Mot de passe incorrect");
      }
    } catch {
      setError("Erreur de connexion au serveur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl font-bold">
            Maison <span className="text-primary">Marsa</span>
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">Espace Administration</p>
        </div>
        <div className="border border-border p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs uppercase tracking-wider text-muted-foreground block mb-2">
                Mot de passe admin
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-none h-12"
                placeholder="••••••••"
                autoFocus
              />
            </div>
            {error && <p className="text-destructive text-sm">{error}</p>}
            <Button type="submit" className="w-full h-12 rounded-none" disabled={loading}>
              {loading ? "Connexion..." : "Accéder au tableau de bord"}
            </Button>
          </form>
        </div>
        <p className="text-center mt-6 text-xs text-muted-foreground">
          <a href="/" className="hover:text-primary transition-colors">← Retour à la boutique</a>
        </p>
      </div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ title, value, icon: Icon, sub }: { title: string; value: string; icon: React.ElementType; sub?: string }) {
  return (
    <Card className="rounded-none border-border">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{title}</CardTitle>
        <Icon className="w-4 h-4 text-primary" />
      </CardHeader>
      <CardContent>
        <p className="font-serif text-3xl font-bold">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

// ─── Orders Table ─────────────────────────────────────────────────────────────
function OrdersTable({ token }: { token: string }) {
  const qc = useQueryClient();
  const { data: orders = [], isLoading, refetch } = useQuery({
    queryKey: ["admin-orders", token],
    queryFn: () => fetchAdminOrders(token),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => updateOrderStatus(token, id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-orders", token] }),
  });

  if (isLoading) return <div className="py-12 text-center text-muted-foreground">Chargement...</div>;

  return (
    <div className="overflow-x-auto">
      <div className="flex justify-end mb-3">
        <Button variant="outline" size="sm" className="rounded-none" onClick={() => refetch()}>
          <RefreshCw className="w-3 h-3 mr-2" /> Actualiser
        </Button>
      </div>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            {["ID","Client","Gouvernorat","Paiement","Statut","Total","Date","Actions"].map(h => (
              <th key={h} className="text-left px-3 py-3 text-xs uppercase tracking-wider text-muted-foreground font-medium whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
              <td className="px-3 py-3 font-mono font-medium">#{String(order.id).padStart(6,"0")}</td>
              <td className="px-3 py-3">
                <p className="font-medium">{order.customerName}</p>
                <p className="text-xs text-muted-foreground">{order.email}</p>
              </td>
              <td className="px-3 py-3 text-muted-foreground">{order.governorate}</td>
              <td className="px-3 py-3">
                <span className="text-xs">
                  {order.paymentMethod === "cash_on_delivery" ? "Livraison" : "Flouci"}
                </span>
              </td>
              <td className="px-3 py-3">
                <select
                  className="text-xs border border-border rounded px-2 py-1 bg-background"
                  value={order.status}
                  onChange={(e) => statusMutation.mutate({ id: order.id, status: e.target.value })}
                >
                  {ORDER_STATUSES.map(s => (
                    <option key={s} value={s}>{STATUS_LABELS[s]?.label ?? s}</option>
                  ))}
                </select>
              </td>
              <td className="px-3 py-3 font-medium text-primary">{formatPrice(order.total)}</td>
              <td className="px-3 py-3 text-muted-foreground whitespace-nowrap">
                {new Date(order.createdAt).toLocaleDateString("fr-TN")}
              </td>
              <td className="px-3 py-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 rounded-none text-xs"
                  onClick={() => generateReceipt(order)}
                >
                  <Download className="w-3 h-3 mr-1" /> PDF
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {orders.length === 0 && (
        <p className="text-center py-12 text-muted-foreground">Aucune commande pour le moment</p>
      )}
    </div>
  );
}

// ─── Products Table ───────────────────────────────────────────────────────────
function ProductsTable({ token }: { token: string }) {
  const qc = useQueryClient();
  const { data: products = [], isLoading, refetch } = useQuery({
    queryKey: ["admin-products", token],
    queryFn: () => fetchAdminProducts(token),
  });

  const [editing, setEditing] = useState<{ id: number; field: "stock" | "sku" | "price"; value: string } | null>(null);

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof updateProductField>[2] }) =>
      updateProductField(token, id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-products", token] });
      setEditing(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteProduct(token, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-products", token] }),
  });

  const saveEdit = useCallback(() => {
    if (!editing) return;
    const { id, field, value } = editing;
    const data =
      field === "stock"
        ? { stock: Math.max(0, parseInt(value, 10) || 0) }
        : field === "price"
        ? { price: parseFloat(value) || 0 }
        : { sku: value || null };
    updateMutation.mutate({ id, data });
  }, [editing, updateMutation]);

  if (isLoading) return <div className="py-12 text-center text-muted-foreground">Chargement...</div>;

  return (
    <div className="overflow-x-auto">
      <div className="flex justify-end mb-3">
        <Button variant="outline" size="sm" className="rounded-none" onClick={() => refetch()}>
          <RefreshCw className="w-3 h-3 mr-2" /> Actualiser
        </Button>
      </div>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            {["Produit","SKU","Catégorie","Stock","Prix","En vedette","Actions"].map(h => (
              <th key={h} className="text-left px-3 py-3 text-xs uppercase tracking-wider text-muted-foreground font-medium whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {products.map((product) => {
            const isEditingStock = editing?.id === product.id && editing.field === "stock";
            const isEditingSku   = editing?.id === product.id && editing.field === "sku";
            const isEditingPrice = editing?.id === product.id && editing.field === "price";

            return (
              <tr key={product.id} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                <td className="px-3 py-3">
                  <div className="flex items-center gap-3">
                    {product.imageUrl && (
                      <img src={product.imageUrl} alt="" className="w-10 h-10 object-cover shrink-0" />
                    )}
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.categoryName ?? "—"}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3">
                  {isEditingSku ? (
                    <div className="flex items-center gap-1">
                      <Input
                        className="h-7 w-24 text-xs rounded-none"
                        value={editing.value}
                        onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                        onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") setEditing(null); }}
                        autoFocus
                      />
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={saveEdit}><Check className="w-3 h-3" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditing(null)}><X className="w-3 h-3" /></Button>
                    </div>
                  ) : (
                    <button
                      className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 group"
                      onClick={() => setEditing({ id: product.id, field: "sku", value: product.sku ?? "" })}
                    >
                      <span>{product.sku ?? "—"}</span>
                      <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-50" />
                    </button>
                  )}
                </td>
                <td className="px-3 py-3 text-muted-foreground text-xs">{product.categoryName ?? "—"}</td>
                <td className="px-3 py-3">
                  {isEditingStock ? (
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        min={0}
                        className="h-7 w-16 text-xs rounded-none"
                        value={editing.value}
                        onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                        onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") setEditing(null); }}
                        autoFocus
                      />
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={saveEdit}><Check className="w-3 h-3" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditing(null)}><X className="w-3 h-3" /></Button>
                    </div>
                  ) : (
                    <button
                      className={`flex items-center gap-1 group font-medium ${product.stock === 0 ? "text-destructive" : product.stock < 3 ? "text-amber-600" : "text-foreground"}`}
                      onClick={() => setEditing({ id: product.id, field: "stock", value: String(product.stock) })}
                    >
                      {product.stock}
                      <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-50" />
                    </button>
                  )}
                </td>
                <td className="px-3 py-3">
                  {isEditingPrice ? (
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        min={0}
                        step="0.001"
                        className="h-7 w-20 text-xs rounded-none"
                        value={editing.value}
                        onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                        onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") setEditing(null); }}
                        autoFocus
                      />
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={saveEdit}><Check className="w-3 h-3" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditing(null)}><X className="w-3 h-3" /></Button>
                    </div>
                  ) : (
                    <button
                      className="flex items-center gap-1 group text-sm"
                      onClick={() => setEditing({ id: product.id, field: "price", value: String(product.price) })}
                    >
                      {formatPrice(product.price)}
                      <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-50" />
                    </button>
                  )}
                </td>
                <td className="px-3 py-3">
                  {product.featured ? (
                    <Badge variant="default" className="rounded-none text-xs">Vedette</Badge>
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </td>
                <td className="px-3 py-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      if (confirm(`Supprimer "${product.name}" ?`)) {
                        deleteMutation.mutate(product.id);
                      }
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {products.length === 0 && (
        <p className="text-center py-12 text-muted-foreground">Aucun produit</p>
      )}
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({ token, onLogout }: { token: string; onLogout: () => void }) {
  const { data: stats, isLoading, isError } = useQuery({
    queryKey: ["admin-stats", token],
    queryFn: () => fetchAdminStats(token),
    refetchInterval: 30_000,
  });

  if (isError) {
    onLogout();
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="border-b border-border sticky top-0 z-10 bg-background/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="font-serif font-bold text-lg">
              Maison <span className="text-primary">Marsa</span>
              <span className="text-muted-foreground font-sans font-normal text-sm ml-2">Admin</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <a href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Voir la boutique
            </a>
            <Separator orientation="vertical" className="h-4" />
            <Button variant="ghost" size="sm" className="rounded-none text-muted-foreground" onClick={onLogout}>
              <LogOut className="w-3 h-3 mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stat Cards */}
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[1,2,3,4].map(i => <div key={i} className="h-28 bg-muted/30 animate-pulse border border-border" />)}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              title="Total Commandes"
              value={stats.totalOrders.toLocaleString("fr-TN")}
              icon={ShoppingBag}
              sub="Toutes les commandes"
            />
            <StatCard
              title="Chiffre d'Affaires"
              value={formatPrice(stats.totalRevenue)}
              icon={TrendingUp}
              sub="Revenus cumulés"
            />
            <StatCard
              title="En Attente"
              value={stats.pendingOrders.toLocaleString("fr-TN")}
              icon={Clock}
              sub="Commandes à traiter"
            />
            <StatCard
              title="Produits"
              value={stats.totalProducts.toLocaleString("fr-TN")}
              icon={Package}
              sub="Dans le catalogue"
            />
          </div>
        ) : null}

        {/* Recent orders preview */}
        {stats?.recentOrders && stats.recentOrders.length > 0 && (
          <div className="mb-8 border border-border p-6">
            <h2 className="font-serif text-lg font-bold mb-4">Transactions récentes</h2>
            <div className="space-y-3">
              {stats.recentOrders.slice(0, 5).map((order) => (
                <div key={order.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-xs text-muted-foreground">#{String(order.id).padStart(6,"0")}</span>
                    <span className="font-medium">{order.customerName}</span>
                    <span className="text-muted-foreground hidden md:block">{order.governorate}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge
                      variant={STATUS_LABELS[order.status]?.variant ?? "secondary"}
                      className="rounded-none text-xs"
                    >
                      {STATUS_LABELS[order.status]?.label ?? order.status}
                    </Badge>
                    <span className="font-medium text-primary">{formatPrice(order.total)}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 rounded-none text-xs"
                      onClick={() => generateReceipt(order as AdminOrder)}
                    >
                      <Download className="w-3 h-3 mr-1" />PDF
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Full Tables */}
        <Tabs defaultValue="orders">
          <TabsList className="rounded-none mb-6 bg-muted/40 border border-border h-auto p-1">
            <TabsTrigger value="orders" className="rounded-none data-[state=active]:bg-background">
              <ShoppingBag className="w-3 h-3 mr-2" />Commandes
            </TabsTrigger>
            <TabsTrigger value="products" className="rounded-none data-[state=active]:bg-background">
              <Package className="w-3 h-3 mr-2" />Produits &amp; Stock
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            <div className="border border-border p-1">
              <OrdersTable token={token} />
            </div>
          </TabsContent>

          <TabsContent value="products">
            <div className="border border-border p-1">
              <ProductsTable token={token} />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function Admin() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(STORAGE_KEY));

  const handleLogin = (t: string) => setToken(t);
  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
  };

  if (!token) return <LoginScreen onLogin={handleLogin} />;
  return <Dashboard token={token} onLogout={handleLogout} />;
}
