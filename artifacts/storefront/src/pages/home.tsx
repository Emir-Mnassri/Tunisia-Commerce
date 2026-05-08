import { Link } from "wouter";
import { useGetFeaturedProducts, useListCategories, useListProducts } from "@workspace/api-client-react";
import { ProductCard, ProductCardSkeleton } from "@/components/product-card";
import { PageTransition } from "@/components/layout/page-transition";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowRightCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const { data: featuredProducts, isLoading: loadingFeatured } = useGetFeaturedProducts();
  const { data: categories } = useListCategories();
  const { data: latestProductsData, isLoading: loadingLatest } = useListProducts({ limit: 4, page: 1 });

  return (
    <PageTransition>
      {/* Hero Section */}
      <section className="relative h-[85vh] min-h-[600px] w-full flex items-center overflow-hidden bg-accent/20">
        {/* Placeholder background, in a real app would use generate_image or stock_image */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/60 to-transparent z-10" />
          <img 
            src="https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?q=80&w=2964&auto=format&fit=crop" 
            alt="Interior design" 
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="container mx-auto px-4 md:px-6 relative z-20">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-2xl"
          >
            <span className="inline-block uppercase tracking-widest text-primary font-semibold text-sm mb-4">Nouvelle Collection</span>
            <h1 className="font-serif text-5xl md:text-7xl font-bold leading-[1.1] text-foreground mb-6">
              L'essence de l'artisanat tunisien.
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-lg leading-relaxed">
              Une sélection rigoureuse de pièces uniques pour élever votre intérieur avec authenticité et élégance.
            </p>
            <Link href="/products">
              <Button size="lg" className="rounded-none h-14 px-8 text-base font-medium group" data-testid="button-hero-shop">
                Découvrir la collection
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Categories Navigation */}
      <section className="py-12 border-b border-border/40 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex overflow-x-auto pb-4 hide-scrollbar gap-8 md:justify-center">
            <Link href="/products" className="flex-shrink-0 text-foreground hover:text-primary transition-colors font-medium whitespace-nowrap" data-testid="link-cat-all">
              Tout voir
            </Link>
            {categories?.map((cat) => (
              <Link 
                key={cat.id} 
                href={`/products?categoryId=${cat.id}`} 
                className="flex-shrink-0 text-muted-foreground hover:text-primary transition-colors font-medium whitespace-nowrap"
                data-testid={`link-cat-${cat.id}`}
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 md:py-32 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">Notre Sélection</h2>
              <p className="text-muted-foreground max-w-2xl">Pièces maîtresses et coups de cœur de la saison, choisies pour leur caractère exceptionnel.</p>
            </div>
            <Link href="/products?featured=true" className="group flex items-center text-primary font-medium hover:underline underline-offset-4" data-testid="link-view-all-featured">
              Voir la sélection
              <ArrowRightCircle className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {loadingFeatured ? (
              Array(4).fill(0).map((_, i) => <ProductCardSkeleton key={i} />)
            ) : featuredProducts && featuredProducts.length > 0 ? (
              featuredProducts.slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
            ) : (
              <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed">
                Aucun produit mis en avant pour le moment.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Story / About split */}
      <section className="py-0 bg-accent/30 overflow-hidden">
        <div className="flex flex-col md:flex-row">
          <div className="md:w-1/2 bg-primary text-primary-foreground p-12 md:p-24 flex flex-col justify-center">
            <h2 className="font-serif text-4xl md:text-5xl font-bold mb-6">Un héritage revisité.</h2>
            <p className="text-primary-foreground/80 text-lg leading-relaxed mb-8">
              Chaque objet que nous proposons raconte une histoire. Celle de mains expertes, de matériaux nobles et d'une passion transmise de génération en génération. De Sejnane à Nabeul, nous parcourons la Tunisie pour dénicher l'exceptionnel.
            </p>
            <Link href="/products">
              <Button variant="outline" className="rounded-none border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary" data-testid="button-about-shop">
                Explorer l'artisanat
              </Button>
            </Link>
          </div>
          <div className="md:w-1/2 h-[50vh] md:h-auto min-h-[400px] relative">
            <img 
              src="https://images.unsplash.com/photo-1615873968403-89e068629265?q=80&w=2832&auto=format&fit=crop" 
              alt="Artisanat details" 
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Latest Arrivals */}
      <section className="py-20 md:py-32 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">Dernières Arrivées</h2>
            <p className="text-muted-foreground">Les nouveautés qui viennent d'enrichir notre catalogue.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {loadingLatest ? (
              Array(4).fill(0).map((_, i) => <ProductCardSkeleton key={i} />)
            ) : latestProductsData?.products && latestProductsData.products.length > 0 ? (
              latestProductsData.products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
            ) : (
              <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed">
                Aucun produit récent.
              </div>
            )}
          </div>
          
          <div className="mt-16 text-center">
            <Link href="/products">
              <Button variant="outline" size="lg" className="rounded-none px-8" data-testid="button-all-latest">
                Parcourir tout le catalogue
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </PageTransition>
  );
}
