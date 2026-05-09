import { useState } from "react";
import { useParams, Link } from "wouter";
import { useGetProduct, getGetProductQueryKey, useListProducts, getListProductsQueryKey } from "@workspace/api-client-react";
import { useCart } from "@/lib/cart-context";
import { PageTransition } from "@/components/layout/page-transition";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { Minus, Plus, ShoppingBag, ArrowLeft, CheckCircle2, ShieldCheck, Truck, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ProductCard } from "@/components/product-card";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const productId = parseInt(id || "0", 10);
  const { toast } = useToast();
  
  const { data: product, isLoading, isError } = useGetProduct(productId, {
    query: {
      enabled: !!productId && !isNaN(productId),
      queryKey: getGetProductQueryKey(productId)
    }
  });

  const relatedParams = { categoryId: product?.categoryId || undefined, limit: 4 };
  const { data: relatedProducts } = useListProducts(relatedParams, {
    query: {
      enabled: !!product?.categoryId,
      queryKey: getListProductsQueryKey(relatedParams),
    }
  });

  const filteredRelated = relatedProducts?.products.filter(p => p.id !== productId).slice(0, 4) || [];

  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  const increment = () => {
    if (product && quantity < product.stock) {
      setQuantity(q => q + 1);
    }
  };

  const decrement = () => {
    if (quantity > 1) {
      setQuantity(q => q - 1);
    }
  };

  const handleAddToCart = () => {
    if (!product || product.stock <= 0) return;
    
    setIsAdding(true);
    
    // Simulate slight delay for better feel
    setTimeout(() => {
      addItem({
        productId: product.id,
        productName: product.name,
        quantity,
        unitPrice: product.price,
        totalPrice: product.price * quantity,
        imageUrl: product.imageUrl || null
      });
      
      setIsAdding(false);
      setQuantity(1);
      
      toast({
        title: "Ajouté au panier",
        description: `${quantity}x ${product.name} ajouté(s) avec succès.`,
        duration: 3000,
        className: "bg-primary text-primary-foreground border-primary rounded-none",
      });
    }, 400);
  };

  if (isLoading) {
    return (
      <PageTransition className="container mx-auto px-4 md:px-6 py-12">
        <div className="mb-8">
          <Skeleton className="h-6 w-24 mb-4" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
          <Skeleton className="aspect-[4/5] w-full" />
          <div className="space-y-6 pt-8">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-12 w-full max-w-md" />
            <Skeleton className="h-8 w-40" />
            <div className="space-y-3 pt-6">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            <div className="pt-10 flex gap-4">
              <Skeleton className="h-14 w-32" />
              <Skeleton className="h-14 flex-1" />
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  if (isError || !product) {
    return (
      <PageTransition className="container mx-auto px-4 py-24 text-center">
        <h1 className="font-serif text-3xl font-bold mb-4">Produit introuvable</h1>
        <p className="text-muted-foreground mb-8">Ce produit n'existe pas ou n'est plus disponible.</p>
        <Link href="/products">
          <Button className="rounded-none">Retour à la boutique</Button>
        </Link>
      </PageTransition>
    );
  }

  const isOutOfStock = product.stock <= 0;

  return (
    <PageTransition className="bg-background pb-24">
      {/* Breadcrumb */}
      <div className="border-b border-border/40 bg-accent/10">
        <div className="container mx-auto px-4 md:px-6 py-4 flex items-center text-sm text-muted-foreground">
          <Link href="/products" className="hover:text-primary transition-colors flex items-center">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Boutique
          </Link>
          <span className="mx-3">/</span>
          {product.categoryName && (
            <>
              <Link href={`/products?categoryId=${product.categoryId}`} className="hover:text-primary transition-colors">
                {product.categoryName}
              </Link>
              <span className="mx-3">/</span>
            </>
          )}
          <span className="text-foreground font-medium truncate">{product.name}</span>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 mb-24">
          {/* Images */}
          <div className="relative aspect-[4/5] bg-muted/30 group">
            {product.imageUrl ? (
              <img 
                src={product.imageUrl} 
                alt={product.name} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-accent/30 text-muted-foreground font-serif text-2xl">
                Maison Marsa
              </div>
            )}
            {product.featured && (
              <Badge className="absolute top-6 left-6 bg-primary text-primary-foreground font-medium rounded-none uppercase tracking-wider text-xs px-3 py-1.5">
                Exclusivité
              </Badge>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-col justify-center">
            <p className="text-sm uppercase tracking-widest text-muted-foreground mb-3 font-medium">
              {product.categoryName || "Catégorie"}
            </p>
            <h1 className="font-serif text-4xl md:text-5xl font-bold leading-[1.1] mb-6 text-foreground" data-testid="text-detail-name">
              {product.name}
            </h1>
            
            {product.isOnSale && product.discountPrice != null && product.discountPrice < product.price ? (
              <div className="flex items-baseline gap-3 mb-8" data-testid="text-detail-price">
                <span className="text-3xl font-bold text-red-600">{formatPrice(product.discountPrice)}</span>
                <span className="text-xl text-muted-foreground line-through">{formatPrice(product.price)}</span>
                <Badge className="rounded-none bg-red-600 text-white text-xs uppercase tracking-wider">Promo</Badge>
              </div>
            ) : (
              <p className="text-3xl font-medium text-primary mb-8" data-testid="text-detail-price">
                {formatPrice(product.price)}
              </p>
            )}

            <div className="prose prose-neutral max-w-none text-muted-foreground leading-relaxed mb-10" data-testid="text-detail-desc">
              {product.description ? (
                <p>{product.description}</p>
              ) : (
                <p>Aucune description disponible pour ce produit.</p>
              )}
            </div>

            <div className="space-y-6 pt-6 border-t border-border/60">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm uppercase tracking-wider text-muted-foreground">Disponibilité</span>
                <span className="font-medium" data-testid="text-detail-stock">
                  {isOutOfStock ? (
                    <span className="text-destructive flex items-center"><X className="w-4 h-4 mr-1" /> Épuisé</span>
                  ) : product.stock < 5 ? (
                    <span className="text-orange-500 flex items-center">Seulement {product.stock} restants</span>
                  ) : (
                    <span className="text-green-600 flex items-center"><CheckCircle2 className="w-4 h-4 mr-1" /> En stock</span>
                  )}
                </span>
              </div>

              <div className="flex gap-4 items-end">
                <div className="w-32">
                  <label className="text-xs uppercase tracking-wider font-medium text-muted-foreground block mb-2">Quantité</label>
                  <div className="flex items-center border border-input h-14 bg-background">
                    <button 
                      type="button"
                      onClick={decrement}
                      disabled={isOutOfStock || quantity <= 1}
                      className="w-10 h-full flex items-center justify-center text-muted-foreground hover:bg-accent disabled:opacity-50 transition-colors"
                      data-testid="button-qty-dec"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="flex-1 text-center font-medium" data-testid="text-qty-val">{quantity}</span>
                    <button 
                      type="button"
                      onClick={increment}
                      disabled={isOutOfStock || quantity >= product.stock}
                      className="w-10 h-full flex items-center justify-center text-muted-foreground hover:bg-accent disabled:opacity-50 transition-colors"
                      data-testid="button-qty-inc"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <Button 
                  size="lg" 
                  className="flex-1 rounded-none h-14 text-base uppercase tracking-wider font-semibold"
                  disabled={isOutOfStock || isAdding}
                  onClick={handleAddToCart}
                  data-testid="button-add-to-cart"
                >
                  {isAdding ? "Ajout en cours..." : isOutOfStock ? "Épuisé" : "Ajouter au panier"}
                </Button>
              </div>
            </div>

            {/* Reassurance */}
            <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-6 p-6 bg-accent/20">
              <div className="flex items-start gap-3">
                <Truck className="w-6 h-6 text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm mb-1">Livraison sur toute la Tunisie</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">Frais de livraison fixes de 7 DT. Gratuit à partir de 200 DT d'achats.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-6 h-6 text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm mb-1">Paiement Sécurisé</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">Paiement à la livraison ou en ligne par carte bancaire via Flouci.</p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Related Products */}
        {filteredRelated.length > 0 && (
          <div className="pt-16 border-t border-border/40">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-serif text-3xl font-bold">Vous aimerez aussi</h2>
              <Link href={`/products?categoryId=${product.categoryId}`} className="text-primary font-medium hover:underline underline-offset-4 hidden sm:block">
                Voir toute la catégorie
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredRelated.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
