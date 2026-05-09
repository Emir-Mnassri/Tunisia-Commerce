import { Product } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/format";

export function ProductCard({ product }: { product: Product }) {
  const onSale = product.isOnSale && product.discountPrice != null && product.discountPrice < product.price;

  return (
    <Link href={`/products/${product.id}`} className="group h-full" data-testid={`card-product-${product.id}`}>
      <Card className="h-full flex flex-col overflow-hidden rounded-none border-border/50 bg-background/50 hover:bg-background transition-colors hover:border-primary/20 hover:shadow-lg duration-300">
        <CardHeader className="p-0 relative aspect-[4/5] bg-muted/30 overflow-hidden">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-700 ease-out"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-accent/50 text-muted-foreground font-serif">
              Maison Marsa
            </div>
          )}

          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {onSale && (
              <Badge className="bg-red-600 text-white font-bold rounded-none uppercase tracking-wider text-[10px] px-2 py-1">
                Promo
              </Badge>
            )}
            {product.featured && !onSale && (
              <Badge className="bg-primary text-primary-foreground font-medium rounded-none uppercase tracking-wider text-[10px] px-2 py-1">
                Exclusivité
              </Badge>
            )}
          </div>

          {product.stock <= 0 && (
            <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] flex items-center justify-center">
              <Badge variant="outline" className="bg-background/80 border-primary text-primary rounded-none uppercase tracking-wider text-xs px-3 py-1.5 font-bold">
                Épuisé
              </Badge>
            </div>
          )}
        </CardHeader>

        <CardContent className="p-5 flex-1 flex flex-col justify-between">
          <div className="space-y-1.5">
            <p className="text-xs uppercase tracking-widest text-muted-foreground" data-testid={`text-product-category-${product.id}`}>
              {product.categoryName || "Catégorie"}
            </p>
            <h3 className="font-serif text-lg leading-tight line-clamp-2" data-testid={`text-product-name-${product.id}`}>
              {product.name}
            </h3>
          </div>
        </CardContent>

        <CardFooter className="px-5 pb-5 pt-0">
          {onSale ? (
            <div className="flex items-baseline gap-2" data-testid={`text-product-price-${product.id}`}>
              <span className="font-bold text-red-600 text-lg">{formatPrice(product.discountPrice!)}</span>
              <span className="text-muted-foreground line-through text-sm">{formatPrice(product.price)}</span>
            </div>
          ) : (
            <p className="font-medium text-primary text-lg" data-testid={`text-product-price-${product.id}`}>
              {formatPrice(product.price)}
            </p>
          )}
        </CardFooter>
      </Card>
    </Link>
  );
}

export function ProductCardSkeleton() {
  return (
    <Card className="h-full flex flex-col overflow-hidden rounded-none border-border/50">
      <CardHeader className="p-0 relative aspect-[4/5] bg-muted/50 animate-pulse" />
      <CardContent className="p-5 space-y-4">
        <div className="h-3 bg-muted rounded w-1/3 animate-pulse" />
        <div className="space-y-2">
          <div className="h-5 bg-muted rounded w-full animate-pulse" />
          <div className="h-5 bg-muted rounded w-4/5 animate-pulse" />
        </div>
      </CardContent>
      <CardFooter className="px-5 pb-5 pt-0">
        <div className="h-6 bg-muted rounded w-1/3 animate-pulse" />
      </CardFooter>
    </Card>
  );
}
