import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="bg-foreground text-background py-12 md:py-16 mt-auto">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="col-span-1 md:col-span-2">
            <h3 className="font-serif text-2xl font-bold mb-4">Maison Marsa</h3>
            <p className="text-muted-foreground max-w-sm">
              L'élégance de l'artisanat tunisien, revisitée pour la maison contemporaine. 
              Une sélection rigoureuse de pièces uniques.
            </p>
          </div>
          
          <div>
            <h4 className="font-serif text-lg font-semibold mb-4">Liens Utiles</h4>
            <ul className="space-y-3">
              <li><Link href="/products" className="text-muted-foreground hover:text-background transition-colors">Tous nos produits</Link></li>
              <li><Link href="/products?categoryId=1" className="text-muted-foreground hover:text-background transition-colors">Artisanat</Link></li>
              <li><Link href="/products?categoryId=2" className="text-muted-foreground hover:text-background transition-colors">Décoration</Link></li>
              <li><Link href="/cart" className="text-muted-foreground hover:text-background transition-colors">Panier</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-serif text-lg font-semibold mb-4">Contact</h4>
            <ul className="space-y-3 text-muted-foreground">
              <li>Avenue de l'Environnement</li>
              <li>La Marsa, 2070</li>
              <li>Tunisie</li>
              <li>contact@maisonmarsa.tn</li>
              <li>+216 71 123 456</li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Maison Marsa. Tous droits réservés.</p>
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <span>Paiement à la livraison</span>
            <span>•</span>
            <span>Paiement en ligne sécurisé (Flouci)</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
