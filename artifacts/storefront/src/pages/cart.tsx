import { Link } from "wouter";
import { useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/format";
import { PageTransition } from "@/components/layout/page-transition";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2, ArrowRight, ShoppingBag } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function Cart() {
  const { items, updateQuantity, removeItem, subtotal, itemCount } = useCart();

  const shippingFee = items.length > 0 ? 7 : 0; // Fixed 7 DT for now, could be free > 200 later
  const total = subtotal + shippingFee;

  if (items.length === 0) {
    return (
      <PageTransition className="flex-1 flex flex-col items-center justify-center py-32 px-4 bg-background">
        <div className="w-24 h-24 bg-accent/30 rounded-full flex items-center justify-center mb-8">
          <ShoppingBag className="w-10 h-10 text-muted-foreground" />
        </div>
        <h1 className="font-serif text-4xl font-bold mb-4 text-center">Votre panier est vide</h1>
        <p className="text-muted-foreground mb-10 text-center max-w-md">
          Découvrez notre collection d'artisanat et de décoration pour remplir votre panier de pièces uniques.
        </p>
        <Link href="/products">
          <Button size="lg" className="rounded-none h-14 px-8 text-base font-medium">
            Découvrir la collection
          </Button>
        </Link>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="bg-background pt-12 pb-24">
      <div className="container mx-auto px-4 md:px-6">
        <h1 className="font-serif text-4xl md:text-5xl font-bold mb-10">Votre Panier</h1>

        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
          {/* Cart Items */}
          <div className="w-full lg:w-2/3">
            <div className="hidden sm:grid sm:grid-cols-12 gap-4 pb-4 border-b border-border/40 text-sm uppercase tracking-wider font-medium text-muted-foreground">
              <div className="col-span-6">Produit</div>
              <div className="col-span-3 text-center">Quantité</div>
              <div className="col-span-3 text-right">Total</div>
            </div>

            <ul className="divide-y divide-border/40">
              {items.map((item) => (
                <li key={item.productId} className="py-8" data-testid={`cart-item-${item.productId}`}>
                  <div className="flex flex-col sm:grid sm:grid-cols-12 gap-6 sm:gap-4 items-start sm:items-center">
                    
                    {/* Product Info */}
                    <div className="col-span-6 flex items-center gap-6 w-full">
                      <div className="w-24 h-32 shrink-0 bg-muted/30 relative">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-accent/50 text-[10px] text-muted-foreground font-serif p-2 text-center">
                            Maison Marsa
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col justify-center flex-1">
                        <Link href={`/products/${item.productId}`} className="font-serif text-lg font-bold hover:text-primary transition-colors line-clamp-2 mb-2">
                          {item.productName}
                        </Link>
                        <p className="text-muted-foreground">{formatPrice(item.unitPrice)}</p>
                        
                        {/* Mobile controls (hidden on sm+) */}
                        <div className="flex items-center justify-between mt-4 sm:hidden w-full">
                          <div className="flex items-center border border-input h-10 bg-background">
                            <button 
                              type="button"
                              onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                              className="w-10 h-full flex items-center justify-center text-muted-foreground hover:bg-accent transition-colors"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-10 text-center font-medium text-sm">{item.quantity}</span>
                            <button 
                              type="button"
                              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                              className="w-10 h-full flex items-center justify-center text-muted-foreground hover:bg-accent transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <p className="font-medium">{formatPrice(item.totalPrice)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Desktop Controls (hidden on xs) */}
                    <div className="col-span-3 hidden sm:flex justify-center">
                      <div className="flex items-center border border-input h-12 bg-background">
                        <button 
                          type="button"
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="w-10 h-full flex items-center justify-center text-muted-foreground hover:bg-accent transition-colors"
                          data-testid={`btn-qty-dec-${item.productId}`}
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-12 text-center font-medium">{item.quantity}</span>
                        <button 
                          type="button"
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="w-10 h-full flex items-center justify-center text-muted-foreground hover:bg-accent transition-colors"
                          data-testid={`btn-qty-inc-${item.productId}`}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Total & Remove */}
                    <div className="col-span-3 hidden sm:flex items-center justify-end gap-6">
                      <p className="font-medium text-lg">{formatPrice(item.totalPrice)}</p>
                      <button 
                        onClick={() => removeItem(item.productId)}
                        className="text-muted-foreground hover:text-destructive transition-colors p-2"
                        title="Supprimer"
                        data-testid={`btn-remove-${item.productId}`}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                    
                    {/* Mobile Remove button */}
                    <button 
                      onClick={() => removeItem(item.productId)}
                      className="text-sm text-destructive font-medium sm:hidden flex items-center uppercase tracking-wider"
                    >
                      <Trash2 className="w-4 h-4 mr-2" /> Supprimer
                    </button>
                    
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Summary Sidebar */}
          <div className="w-full lg:w-1/3">
            <div className="bg-accent/10 p-8 border border-border/40 sticky top-24">
              <h2 className="font-serif text-2xl font-bold mb-6">Récapitulatif</h2>
              
              <div className="space-y-4 text-sm mb-6">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sous-total ({itemCount} articles)</span>
                  <span className="font-medium">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Frais de livraison</span>
                  <span className="font-medium">{formatPrice(shippingFee)}</span>
                </div>
              </div>
              
              <Separator className="my-6" />
              
              <div className="flex justify-between items-end mb-8">
                <span className="font-serif font-bold text-xl">Total TTC</span>
                <div className="text-right">
                  <span className="font-bold text-2xl text-primary block">{formatPrice(total)}</span>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">Taxes incluses</span>
                </div>
              </div>

              <Link href="/checkout">
                <Button size="lg" className="w-full rounded-none h-14 text-base uppercase tracking-wider font-semibold group" data-testid="btn-checkout">
                  Passer la commande
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              
              <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="w-4 h-4" />
                <span>Paiement 100% sécurisé</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </PageTransition>
  );
}

// Re-exporting a mock icon here since it's not in lucide by default and I don't want to add deps
function ShieldCheck(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinelinejoin="round" {...props}>
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2-1 4-2 7-2 2.76 0 5 1 7 2a1 1 0 0 1 1 1v7z"/>
      <path d="m9 12 2 2 4-4"/>
    </svg>
  );
}
