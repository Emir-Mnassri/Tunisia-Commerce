import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  ShoppingBag, TrendingUp, Clock, Package,
  LogOut, Download, RefreshCw, Pencil, Trash2, Plus, Minus, PlusCircle,
} from "lucide-react";
import {
  fetchAdminStats, fetchAdminOrders, fetchAdminProducts,
  createProduct, updateProduct, patchProductStock, deleteProduct,
  updateOrderStatus,
  AdminOrder, AdminProduct, CreateProductInput,
} from "@/lib/admin-api";
import { useListCategories } from "@workspace/api-client-react";
import { generateReceipt } from "@/lib/generate-receipt";
import { formatPrice } from "@/lib/format";

const STORAGE_KEY = "mm_admin_token";

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending:          { label: "En attente",       variant: "secondary" },
  awaiting_payment: { label: "Paiement attendu", variant: "outline" },
  paid:             { label: "Payé",             variant: "default" },
  shipped:          { label: "Expédié",          variant: "default" },
  delivered:        { label: "Livré",            variant: "default" },
  cancelled:        { label: "Annulé",           variant: "destructive" },
};
const ORDER_STATUSES = ["pending","awaiting_payment","paid","shipped","delivered","cancelled"];

// ─── Login ─────────────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: (t: string) => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await fetch(`${import.meta.env.BASE_URL?.replace(/\/$/, "") ?? ""}/api/admin/stats`, {
        headers: { Authorization: `Bearer ${password}` },
      });
      if (res.ok) { localStorage.setItem(STORAGE_KEY, password); onLogin(password); }
      else setError("Mot de passe incorrect");
    } catch { setError("Erreur de connexion"); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl font-bold">Maison <span className="text-primary">Marsa</span></h1>
          <p className="text-muted-foreground mt-2 text-sm">Espace Administration</p>
        </div>
        <div className="border border-border p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs uppercase tracking-wider text-muted-foreground block mb-2">Mot de passe admin</label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="rounded-none h-12" placeholder="••••••••" autoFocus />
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

// ─── Stat Card ─────────────────────────────────────────────────────────────────
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

// ─── Product Form Dialog ────────────────────────────────────────────────────────
const EMPTY_FORM: CreateProductInput & { id?: number } = {
  name: "", description: "", price: 0, discountPrice: null,
  isOnSale: false, imageUrl: "", stock: 0, sku: "", featured: false, categoryId: null,
};

function ProductFormDialog({
  open, onClose, token, editProduct,
}: {
  open: boolean; onClose: () => void; token: string; editProduct: AdminProduct | null;
}) {
  const qc = useQueryClient();
  const { data: categories = [] } = useListCategories();
  const [form, setForm] = useState<typeof EMPTY_FORM>(EMPTY_FORM);
  const [error, setError] = useState("");

  // Populate form when editing
  const prevOpen = open;
  if (prevOpen && !form.name && editProduct) {
    setForm({
      name: editProduct.name,
      description: editProduct.description ?? "",
      price: editProduct.price,
      discountPrice: editProduct.discountPrice,
      isOnSale: editProduct.isOnSale,
      imageUrl: editProduct.imageUrl ?? "",
      stock: editProduct.stock,
      sku: editProduct.sku ?? "",
      featured: editProduct.featured,
      categoryId: editProduct.categoryId,
    });
  }

  const handleOpen = useCallback(() => {
    setError("");
    if (editProduct) {
      setForm({
        name: editProduct.name,
        description: editProduct.description ?? "",
        price: editProduct.price,
        discountPrice: editProduct.discountPrice,
        isOnSale: editProduct.isOnSale,
        imageUrl: editProduct.imageUrl ?? "",
        stock: editProduct.stock,
        sku: editProduct.sku ?? "",
        featured: editProduct.featured,
        categoryId: editProduct.categoryId,
      });
    } else {
      setForm({ ...EMPTY_FORM });
    }
  }, [editProduct]);

  // Reset on open
  useState(() => { if (open) handleOpen(); });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: CreateProductInput = {
        name: form.name,
        description: form.description || null,
        price: Number(form.price),
        discountPrice: form.discountPrice ? Number(form.discountPrice) : null,
        isOnSale: form.isOnSale,
        imageUrl: form.imageUrl || null,
        stock: Number(form.stock),
        sku: form.sku || null,
        featured: form.featured,
        categoryId: form.categoryId || null,
      };
      if (editProduct) return updateProduct(token, editProduct.id, payload);
      return createProduct(token, payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-products", token] });
      qc.invalidateQueries({ queryKey: ["admin-stats", token] });
      onClose();
    },
    onError: (e: Error) => setError(e.message),
  });

  const set = (field: keyof typeof EMPTY_FORM, value: unknown) =>
    setForm((f) => ({ ...f, [field]: value }));

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { onClose(); setForm({ ...EMPTY_FORM }); setError(""); } else handleOpen(); }}>
      <DialogContent className="max-w-2xl rounded-none max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">
            {editProduct ? `Modifier — ${editProduct.name}` : "Ajouter un produit"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
          {/* Name */}
          <div className="sm:col-span-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Nom du produit *</Label>
            <Input className="rounded-none mt-1" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Ex: Vase en céramique de Nabeul" />
          </div>

          {/* SKU */}
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">SKU</Label>
            <Input className="rounded-none mt-1" value={form.sku ?? ""} onChange={(e) => set("sku", e.target.value)} placeholder="Ex: VAS-001" />
          </div>

          {/* Category */}
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Catégorie</Label>
            <Select
              value={form.categoryId?.toString() ?? "none"}
              onValueChange={(v) => set("categoryId", v === "none" ? null : parseInt(v))}
            >
              <SelectTrigger className="rounded-none mt-1">
                <SelectValue placeholder="Aucune catégorie" />
              </SelectTrigger>
              <SelectContent className="rounded-none">
                <SelectItem value="none">Aucune catégorie</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Price */}
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Prix de base (DT) *</Label>
            <Input className="rounded-none mt-1" type="number" min={0} step="0.001"
              value={form.price} onChange={(e) => set("price", parseFloat(e.target.value) || 0)} />
          </div>

          {/* Discount Price */}
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Prix promo (DT)</Label>
            <Input className="rounded-none mt-1" type="number" min={0} step="0.001"
              value={form.discountPrice ?? ""} placeholder="Laisser vide si pas de promo"
              onChange={(e) => set("discountPrice", e.target.value ? parseFloat(e.target.value) : null)} />
          </div>

          {/* Stock */}
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Stock initial</Label>
            <Input className="rounded-none mt-1" type="number" min={0}
              value={form.stock} onChange={(e) => set("stock", parseInt(e.target.value) || 0)} />
          </div>

          {/* Image URL */}
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">URL de l'image</Label>
            <Input className="rounded-none mt-1" value={form.imageUrl ?? ""}
              onChange={(e) => set("imageUrl", e.target.value)} placeholder="https://images.unsplash.com/..." />
          </div>

          {/* Description */}
          <div className="sm:col-span-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Description</Label>
            <Textarea className="rounded-none mt-1 resize-none" rows={3}
              value={form.description ?? ""} onChange={(e) => set("description", e.target.value)}
              placeholder="Description du produit..." />
          </div>

          {/* Toggles */}
          <div className="flex items-center gap-3">
            <Switch id="isOnSale" checked={form.isOnSale ?? false}
              onCheckedChange={(v) => set("isOnSale", v)} />
            <Label htmlFor="isOnSale" className="text-sm cursor-pointer">En promotion</Label>
          </div>
          <div className="flex items-center gap-3">
            <Switch id="featured" checked={form.featured ?? false}
              onCheckedChange={(v) => set("featured", v)} />
            <Label htmlFor="featured" className="text-sm cursor-pointer">Produit vedette</Label>
          </div>

          {/* Image preview */}
          {form.imageUrl && (
            <div className="sm:col-span-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground block mb-2">Aperçu</Label>
              <img src={form.imageUrl} alt="preview" className="h-32 w-auto object-cover border border-border" />
            </div>
          )}
        </div>

        {error && <p className="text-destructive text-sm mt-2">{error}</p>}

        <DialogFooter className="gap-2 mt-2">
          <Button variant="outline" className="rounded-none" onClick={() => { onClose(); setForm({ ...EMPTY_FORM }); setError(""); }}>
            Annuler
          </Button>
          <Button className="rounded-none" disabled={saveMutation.isPending || !form.name || !form.price}
            onClick={() => saveMutation.mutate()}>
            {saveMutation.isPending ? "Enregistrement..." : editProduct ? "Mettre à jour" : "Créer le produit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Products Table ─────────────────────────────────────────────────────────────
function ProductsTable({ token }: { token: string }) {
  const qc = useQueryClient();
  const { data: products = [], isLoading, refetch } = useQuery({
    queryKey: ["admin-products", token],
    queryFn: () => fetchAdminProducts(token),
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AdminProduct | null>(null);

  const stockMutation = useMutation({
    mutationFn: ({ id, delta }: { id: number; delta: number }) => patchProductStock(token, id, delta),
    onSuccess: (updated) => {
      qc.setQueryData<AdminProduct[]>(["admin-products", token], (old) =>
        old?.map((p) => p.id === updated.id ? { ...p, stock: updated.stock } : p) ?? [],
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteProduct(token, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-products", token] }),
  });

  const openAdd = () => { setEditTarget(null); setDialogOpen(true); };
  const openEdit = (p: AdminProduct) => { setEditTarget(p); setDialogOpen(true); };

  if (isLoading) return <div className="py-12 text-center text-muted-foreground">Chargement...</div>;

  return (
    <>
      <ProductFormDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditTarget(null); }}
        token={token}
        editProduct={editTarget}
      />

      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">{products.length} produit(s)</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="rounded-none" onClick={() => refetch()}>
            <RefreshCw className="w-3 h-3 mr-2" />Actualiser
          </Button>
          <Button size="sm" className="rounded-none" onClick={openAdd}>
            <PlusCircle className="w-3 h-3 mr-2" />Ajouter un produit
          </Button>
        </div>
      </div>

      <div className="border border-border rounded-none overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="text-xs uppercase tracking-wider">Produit</TableHead>
              <TableHead className="text-xs uppercase tracking-wider">SKU</TableHead>
              <TableHead className="text-xs uppercase tracking-wider">Prix</TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-center">Stock</TableHead>
              <TableHead className="text-xs uppercase tracking-wider">Statut</TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((p) => {
              const onSale = p.isOnSale && p.discountPrice != null;
              const lowStock = p.stock > 0 && p.stock < 3;
              return (
                <TableRow key={p.id} className="hover:bg-accent/20">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {p.imageUrl
                        ? <img src={p.imageUrl} alt="" className="w-12 h-12 object-cover shrink-0 border border-border/50" />
                        : <div className="w-12 h-12 bg-muted/50 shrink-0 flex items-center justify-center text-xs text-muted-foreground">—</div>
                      }
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate max-w-[180px]">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.categoryName ?? "Sans catégorie"}</p>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="font-mono text-xs text-muted-foreground">{p.sku ?? "—"}</TableCell>

                  <TableCell>
                    {onSale ? (
                      <div className="flex flex-col">
                        <span className="font-bold text-red-600 text-sm">{formatPrice(p.discountPrice!)}</span>
                        <span className="text-muted-foreground line-through text-xs">{formatPrice(p.price)}</span>
                      </div>
                    ) : (
                      <span className="text-sm font-medium">{formatPrice(p.price)}</span>
                    )}
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="outline" size="icon"
                        className="h-7 w-7 rounded-none border-border"
                        disabled={p.stock === 0 || stockMutation.isPending}
                        onClick={() => stockMutation.mutate({ id: p.id, delta: -1 })}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className={`w-9 text-center text-sm font-medium tabular-nums ${p.stock === 0 ? "text-destructive" : lowStock ? "text-amber-600" : ""}`}>
                        {p.stock}
                      </span>
                      <Button
                        variant="outline" size="icon"
                        className="h-7 w-7 rounded-none border-border"
                        disabled={stockMutation.isPending}
                        onClick={() => stockMutation.mutate({ id: p.id, delta: 1 })}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {onSale && <Badge className="rounded-none text-[10px] bg-red-600 text-white w-fit">Promo</Badge>}
                      {p.featured && <Badge variant="secondary" className="rounded-none text-[10px] w-fit">Vedette</Badge>}
                      {p.stock === 0 && <Badge variant="destructive" className="rounded-none text-[10px] w-fit">Épuisé</Badge>}
                      {lowStock && <Badge variant="outline" className="rounded-none text-[10px] border-amber-500 text-amber-600 w-fit">Stock bas</Badge>}
                      {!onSale && !p.featured && p.stock > 0 && <Badge variant="outline" className="rounded-none text-[10px] w-fit">Actif</Badge>}
                    </div>
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-none" onClick={() => openEdit(p)}>
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost" size="icon"
                        className="h-8 w-8 rounded-none text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => { if (confirm(`Supprimer "${p.name}" ?`)) deleteMutation.mutate(p.id); }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {products.length === 0 && (
          <div className="py-16 text-center">
            <Package className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Aucun produit pour le moment</p>
            <Button size="sm" className="rounded-none mt-4" onClick={openAdd}>
              <PlusCircle className="w-3 h-3 mr-2" />Créer le premier produit
            </Button>
          </div>
        )}
      </div>
    </>
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
    <>
      <div className="flex justify-end mb-4">
        <Button variant="outline" size="sm" className="rounded-none" onClick={() => refetch()}>
          <RefreshCw className="w-3 h-3 mr-2" />Actualiser
        </Button>
      </div>
      <div className="border border-border rounded-none overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="text-xs uppercase tracking-wider">ID</TableHead>
              <TableHead className="text-xs uppercase tracking-wider">Client</TableHead>
              <TableHead className="text-xs uppercase tracking-wider hidden md:table-cell">Gouvernorat</TableHead>
              <TableHead className="text-xs uppercase tracking-wider hidden lg:table-cell">Paiement</TableHead>
              <TableHead className="text-xs uppercase tracking-wider">Statut</TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-right">Total</TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-right">PDF</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id} className="hover:bg-accent/20">
                <TableCell className="font-mono text-xs font-medium">#{String(order.id).padStart(6,"0")}</TableCell>
                <TableCell>
                  <p className="font-medium text-sm">{order.customerName}</p>
                  <p className="text-xs text-muted-foreground hidden sm:block">{order.email}</p>
                </TableCell>
                <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{order.governorate}</TableCell>
                <TableCell className="hidden lg:table-cell text-xs">
                  {order.paymentMethod === "cash_on_delivery" ? "Livraison" : "Flouci"}
                </TableCell>
                <TableCell>
                  <select
                    className="text-xs border border-border rounded px-2 py-1 bg-background max-w-[140px]"
                    value={order.status}
                    onChange={(e) => statusMutation.mutate({ id: order.id, status: e.target.value })}
                  >
                    {ORDER_STATUSES.map(s => (
                      <option key={s} value={s}>{STATUS_LABELS[s]?.label ?? s}</option>
                    ))}
                  </select>
                </TableCell>
                <TableCell className="text-right font-medium text-primary text-sm">{formatPrice(order.total)}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" className="h-7 rounded-none text-xs" onClick={() => generateReceipt(order)}>
                    <Download className="w-3 h-3 mr-1" />PDF
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {orders.length === 0 && (
          <p className="text-center py-12 text-muted-foreground text-sm">Aucune commande pour le moment</p>
        )}
      </div>
    </>
  );
}

// ─── Dashboard ─────────────────────────────────────────────────────────────────
function Dashboard({ token, onLogout }: { token: string; onLogout: () => void }) {
  const { data: stats, isLoading, isError } = useQuery({
    queryKey: ["admin-stats", token],
    queryFn: () => fetchAdminStats(token),
    refetchInterval: 30_000,
  });

  if (isError) { onLogout(); return null; }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border sticky top-0 z-10 bg-background/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
          <h1 className="font-serif font-bold text-lg">
            Maison <span className="text-primary">Marsa</span>
            <span className="text-muted-foreground font-sans font-normal text-sm ml-2">Admin</span>
          </h1>
          <div className="flex items-center gap-3">
            <a href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
              Voir la boutique
            </a>
            <Separator orientation="vertical" className="h-4 hidden sm:block" />
            <Button variant="ghost" size="sm" className="rounded-none text-muted-foreground" onClick={onLogout}>
              <LogOut className="w-3 h-3 mr-2" />Déconnexion
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {/* Stat Cards */}
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[1,2,3,4].map(i => <div key={i} className="h-28 bg-muted/30 animate-pulse border border-border" />)}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard title="Total Commandes" value={stats.totalOrders.toLocaleString("fr-TN")} icon={ShoppingBag} sub="Toutes les commandes" />
            <StatCard title="Chiffre d'Affaires" value={formatPrice(stats.totalRevenue)} icon={TrendingUp} sub="Revenus cumulés" />
            <StatCard title="En Attente" value={stats.pendingOrders.toLocaleString("fr-TN")} icon={Clock} sub="À traiter" />
            <StatCard title="Produits" value={stats.totalProducts.toLocaleString("fr-TN")} icon={Package} sub="Dans le catalogue" />
          </div>
        ) : null}

        {/* Tabs */}
        <Tabs defaultValue="products">
          <TabsList className="rounded-none mb-6 bg-muted/40 border border-border h-auto p-1">
            <TabsTrigger value="products" className="rounded-none data-[state=active]:bg-background">
              <Package className="w-3 h-3 mr-2" />Produits &amp; Stock
            </TabsTrigger>
            <TabsTrigger value="orders" className="rounded-none data-[state=active]:bg-background">
              <ShoppingBag className="w-3 h-3 mr-2" />Commandes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            <ProductsTable token={token} />
          </TabsContent>

          <TabsContent value="orders">
            <OrdersTable token={token} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

// ─── Root ────────────────────────────────────────────────────────────────────
export default function Admin() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(STORAGE_KEY));
  if (!token) return <LoginScreen onLogin={(t) => setToken(t)} />;
  return <Dashboard token={token} onLogout={() => { localStorage.removeItem(STORAGE_KEY); setToken(null); }} />;
}
