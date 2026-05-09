import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { useListProducts, useListCategories, getListProductsQueryKey } from "@workspace/api-client-react";
import { ProductCard, ProductCardSkeleton } from "@/components/product-card";
import { PageTransition } from "@/components/layout/page-transition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";

export default function Products() {
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  
  const [search, setSearchQuery] = useState(searchParams.get("search") || "");
  const [categoryId, setCategoryId] = useState<string>(searchParams.get("categoryId") || "all");
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  
  const [, setLocation] = useLocation();

  const { data: categories } = useListCategories();
  
  const listParams = {
    page,
    limit: 12,
    search: search || undefined,
    categoryId: categoryId !== "all" ? Number(categoryId) : undefined,
  };
  const { data: productsData, isLoading, isPlaceholderData } = useListProducts(listParams, {
    query: { placeholderData: (prev) => prev, queryKey: getListProductsQueryKey(listParams) },
  });
  const isPreviousData = isPlaceholderData;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    updateUrl(1, categoryId, search);
  };

  const handleCategoryChange = (val: string) => {
    setCategoryId(val);
    setPage(1);
    updateUrl(1, val, search);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    updateUrl(newPage, categoryId, search);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const updateUrl = (p: number, cat: string, q: string) => {
    const params = new URLSearchParams();
    if (p > 1) params.set("page", p.toString());
    if (cat !== "all") params.set("categoryId", cat);
    if (q) params.set("search", q);
    
    const qs = params.toString();
    setLocation(qs ? `/products?${qs}` : "/products");
  };

  const clearFilters = () => {
    setSearchQuery("");
    setCategoryId("all");
    setPage(1);
    setLocation("/products");
  };

  const hasFilters = search !== "" || categoryId !== "all";

  return (
    <PageTransition className="bg-background pt-8 pb-24">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mb-12">
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">La Boutique</h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            Explorez notre collection complète d'objets d'art, de décoration et de mobilier, soigneusement sélectionnés à travers toute la Tunisie.
          </p>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col lg:flex-row gap-6 mb-10 items-end lg:items-center bg-accent/20 p-6">
          <div className="w-full lg:w-1/3">
            <label className="text-sm font-medium mb-2 block uppercase tracking-wider text-muted-foreground">Catégorie</label>
            <Select value={categoryId} onValueChange={handleCategoryChange}>
              <SelectTrigger className="w-full h-12 rounded-none bg-background border-border" data-testid="select-category">
                <SelectValue placeholder="Toutes les catégories" />
              </SelectTrigger>
              <SelectContent className="rounded-none">
                <SelectItem value="all" data-testid="option-cat-all">Toutes les catégories</SelectItem>
                {categories?.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id.toString()} data-testid={`option-cat-${cat.id}`}>
                    {cat.name} ({cat.productCount})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full lg:w-1/3 lg:mr-auto">
            <form onSubmit={handleSearch} className="relative">
              <label className="text-sm font-medium mb-2 block uppercase tracking-wider text-muted-foreground">Recherche</label>
              <div className="relative">
                <Input 
                  type="text" 
                  placeholder="Chercher un produit..." 
                  className="w-full h-12 rounded-none bg-background border-border pr-12 pl-4"
                  value={search}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="input-search"
                />
                <Button 
                  type="submit" 
                  variant="ghost" 
                  size="icon" 
                  className="absolute right-0 top-0 h-12 w-12 rounded-none hover:bg-transparent"
                  data-testid="button-submit-search"
                >
                  <Search className="w-5 h-5 text-muted-foreground" />
                </Button>
              </div>
            </form>
          </div>

          {hasFilters && (
            <Button 
              variant="outline" 
              onClick={clearFilters}
              className="w-full lg:w-auto h-12 rounded-none border-border"
              data-testid="button-clear-filters"
            >
              <X className="w-4 h-4 mr-2" />
              Effacer les filtres
            </Button>
          )}
        </div>

        {/* Results Info */}
        <div className="mb-6 flex items-center justify-between text-sm text-muted-foreground">
          {productsData && (
            <p data-testid="text-results-count">
              Affichage de {productsData.products.length} sur {productsData.total} produits
            </p>
          )}
          {isLoading && !isPreviousData && <p className="animate-pulse">Chargement...</p>}
        </div>

        {/* Product Grid */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8 transition-opacity duration-300 ${isPreviousData ? 'opacity-60' : 'opacity-100'}`}>
          {isLoading && !isPreviousData ? (
            Array(8).fill(0).map((_, i) => <ProductCardSkeleton key={i} />)
          ) : productsData?.products && productsData.products.length > 0 ? (
            productsData.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))
          ) : (
            <div className="col-span-full py-24 text-center bg-accent/10 border border-dashed border-border flex flex-col items-center justify-center">
              <Search className="w-12 h-12 text-muted-foreground/50 mb-4" />
              <h3 className="font-serif text-xl font-bold mb-2">Aucun produit trouvé</h3>
              <p className="text-muted-foreground max-w-md mx-auto mb-6">
                Nous n'avons trouvé aucun produit correspondant à vos critères de recherche.
              </p>
              <Button onClick={clearFilters} className="rounded-none">Voir tous nos produits</Button>
            </div>
          )}
        </div>

        {/* Pagination */}
        {productsData && productsData.totalPages > 1 && (
          <div className="mt-16 flex justify-center">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <Button 
                    variant="ghost" 
                    className="rounded-none" 
                    disabled={page === 1}
                    onClick={() => handlePageChange(page - 1)}
                    data-testid="button-prev-page"
                  >
                    Précédent
                  </Button>
                </PaginationItem>
                
                {Array.from({ length: productsData.totalPages }, (_, i) => i + 1).map((p) => {
                  // Simple pagination logic for showing a reasonable number of pages
                  if (
                    p === 1 || 
                    p === productsData.totalPages || 
                    (p >= page - 1 && p <= page + 1)
                  ) {
                    return (
                      <PaginationItem key={p}>
                        <Button
                          variant={page === p ? "default" : "ghost"}
                          className={`w-10 h-10 rounded-none ${page === p ? 'bg-primary hover:bg-primary' : ''}`}
                          onClick={() => handlePageChange(p)}
                          data-testid={`button-page-${p}`}
                        >
                          {p}
                        </Button>
                      </PaginationItem>
                    );
                  } else if (
                    (p === page - 2 && page > 3) || 
                    (p === page + 2 && page < productsData.totalPages - 2)
                  ) {
                    return <PaginationItem key={p}><span className="px-4 text-muted-foreground">...</span></PaginationItem>;
                  }
                  return null;
                })}

                <PaginationItem>
                  <Button 
                    variant="ghost" 
                    className="rounded-none" 
                    disabled={page === productsData.totalPages}
                    onClick={() => handlePageChange(page + 1)}
                    data-testid="button-next-page"
                  >
                    Suivant
                  </Button>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
