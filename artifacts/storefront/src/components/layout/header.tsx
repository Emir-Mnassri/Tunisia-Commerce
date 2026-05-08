import { Link, useLocation } from "wouter";
import { ShoppingBag, Menu, Search, Home, ShoppingBag as ShopIcon, Tag, ShoppingCart } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useState } from "react";
import { Separator } from "@/components/ui/separator";

const navLinks = [
  { href: "/", label: "Accueil", icon: Home, testId: "link-nav-home" },
  { href: "/products", label: "Boutique", icon: ShopIcon, testId: "link-nav-products" },
  { href: "/products?categoryId=1", label: "Artisanat Tunisien", icon: Tag, testId: "link-nav-artisanat" },
  { href: "/products?categoryId=2", label: "Maison & Déco", icon: Tag, testId: "link-nav-maison" },
  { href: "/cart", label: "Panier", icon: ShoppingCart, testId: "link-nav-cart" },
];

export function Header() {
  const { itemCount } = useCart();
  const [open, setOpen] = useState(false);
  const [, navigate] = useLocation();

  function handleNavClick(href: string) {
    setOpen(false);
    setTimeout(() => navigate(href), 150);
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">

        {/* Left: hamburger + logo */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden -ml-2"
            onClick={() => setOpen(true)}
            aria-label="Ouvrir le menu"
            data-testid="button-mobile-menu"
          >
            <Menu className="w-5 h-5" />
          </Button>
          <Link href="/" className="font-serif text-2xl font-bold tracking-tight" data-testid="link-home">
            Maison <span className="text-primary">Marsa</span>
          </Link>
        </div>

        {/* Centre: desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/" className="text-sm font-medium hover:text-primary transition-colors" data-testid="link-nav-home">Accueil</Link>
          <Link href="/products" className="text-sm font-medium hover:text-primary transition-colors" data-testid="link-nav-products">Boutique</Link>
          <Link href="/products?categoryId=1" className="text-sm font-medium hover:text-primary transition-colors" data-testid="link-nav-artisanat">Artisanat</Link>
          <Link href="/products?categoryId=2" className="text-sm font-medium hover:text-primary transition-colors" data-testid="link-nav-maison">Maison</Link>
        </nav>

        {/* Right: search + cart */}
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
                  {itemCount > 9 ? "9+" : itemCount}
                </span>
              )}
            </Button>
          </Link>
        </div>
      </div>

      {/* Mobile Side Drawer */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="left"
          className="z-50 w-[300px] sm:w-[340px] p-0 flex flex-col bg-background border-r border-border"
          data-testid="mobile-drawer"
        >
          {/* Drawer header */}
          <SheetHeader className="px-6 py-5 border-b border-border shrink-0">
            <SheetTitle asChild>
              <span className="font-serif text-xl font-bold tracking-tight">
                Maison <span className="text-primary">Marsa</span>
              </span>
            </SheetTitle>
          </SheetHeader>

          {/* Nav links */}
          <nav className="flex flex-col flex-1 px-4 py-4 gap-1" aria-label="Navigation mobile">
            {navLinks.map(({ href, label, icon: Icon, testId }) => (
              <button
                key={href}
                onClick={() => handleNavClick(href)}
                className="flex items-center gap-4 px-3 w-full text-left min-h-[48px] rounded-md font-medium text-base hover:bg-accent hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                data-testid={testId}
              >
                <Icon className="w-4 h-4 shrink-0 text-muted-foreground" />
                {label}
                {href === "/cart" && itemCount > 0 && (
                  <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {itemCount > 9 ? "9+" : itemCount}
                  </span>
                )}
              </button>
            ))}

            <Separator className="my-3" />

            {/* Search shortcut */}
            <button
              onClick={() => handleNavClick("/products")}
              className="flex items-center gap-4 px-3 w-full text-left min-h-[48px] rounded-md font-medium text-base text-muted-foreground hover:bg-accent hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              data-testid="link-mobile-search"
            >
              <Search className="w-4 h-4 shrink-0" />
              Rechercher
            </button>
          </nav>

          {/* Footer inside drawer */}
          <div className="px-6 py-5 border-t border-border shrink-0">
            <p className="text-xs text-muted-foreground text-center">
              © 2025 Maison Marsa — Livraison en Tunisie
            </p>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
