import { ReactNode } from "react";
import { Link } from "wouter";
import { ShoppingBag, Menu, Search, X } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function Header() {
  const { itemCount } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden -ml-2"
            onClick={() => setMobileMenuOpen(true)}
            data-testid="button-mobile-menu"
          >
            <Menu className="w-5 h-5" />
          </Button>
          <Link href="/" className="font-serif text-2xl font-bold tracking-tight" data-testid="link-home">
            Maison <span className="text-primary">Marsa</span>
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          <Link href="/" className="text-sm font-medium hover:text-primary transition-colors" data-testid="link-nav-home">Accueil</Link>
          <Link href="/products" className="text-sm font-medium hover:text-primary transition-colors" data-testid="link-nav-products">Boutique</Link>
          <Link href="/products?categoryId=1" className="text-sm font-medium hover:text-primary transition-colors" data-testid="link-nav-artisanat">Artisanat</Link>
          <Link href="/products?categoryId=2" className="text-sm font-medium hover:text-primary transition-colors" data-testid="link-nav-maison">Maison</Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/products" className="hidden md:flex" data-testid="link-search">
            <Button variant="ghost" size="icon" className="hover:bg-accent hover:text-primary">
              <Search className="w-5 h-5" />
            </Button>
          </Link>
          <Link href="/cart" data-testid="link-cart">
            <Button variant="ghost" size="icon" className="relative hover:bg-accent hover:text-primary">
              <ShoppingBag className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {itemCount}
                </span>
              )}
            </Button>
          </Link>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-background md:hidden flex flex-col">
          <div className="flex items-center justify-between p-4 border-b">
            <span className="font-serif text-xl font-bold">Maison Marsa</span>
            <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
              <X className="w-5 h-5" />
            </Button>
          </div>
          <div className="flex flex-col p-6 gap-6">
            <Link href="/" onClick={() => setMobileMenuOpen(false)} className="text-lg font-serif">Accueil</Link>
            <Link href="/products" onClick={() => setMobileMenuOpen(false)} className="text-lg font-serif">Boutique</Link>
            <Link href="/products?categoryId=1" onClick={() => setMobileMenuOpen(false)} className="text-lg font-serif">Artisanat Tunisien</Link>
            <Link href="/products?categoryId=2" onClick={() => setMobileMenuOpen(false)} className="text-lg font-serif">Maison & Déco</Link>
          </div>
        </div>
      )}
    </header>
  );
}
