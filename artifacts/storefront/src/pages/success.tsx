import { useSearch, Link } from "wouter";
import { useGetOrder, getGetOrderQueryKey } from "@workspace/api-client-react";
import { PageTransition } from "@/components/layout/page-transition";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ChevronRight, PackageOpen, Download } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { generateReceipt } from "@/lib/generate-receipt";

export default function Success() {
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);

  const orderIdParam = searchParams.get("orderId");
  const orderId = orderIdParam ? parseInt(orderIdParam, 10) : null;
  const paymentId = searchParams.get("payment_id");

  const { data: order, isLoading } = useGetOrder(orderId || 0, {
    query: {
      enabled: !!orderId,
      queryKey: getGetOrderQueryKey(orderId || 0),
    },
  });

  return (
    <PageTransition className="bg-background py-16 md:py-24">
      <div className="container mx-auto px-4 md:px-6 max-w-3xl text-center">

        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 text-green-600 rounded-full mb-8">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">Commande Confirmée !</h1>

        <p className="text-lg text-muted-foreground mb-12 max-w-xl mx-auto">
          Merci pour votre achat. Nous préparons votre commande avec le plus grand soin. Un email de confirmation vous a été envoyé.
        </p>

        {paymentId && (
          <div className="bg-accent/20 p-4 mb-8 inline-block mx-auto border border-border">
            <p className="text-sm">
              <span className="text-muted-foreground mr-2">Référence de paiement Flouci:</span>
              <span className="font-mono font-medium">{paymentId}</span>
            </p>
          </div>
        )}

        {isLoading ? (
          <div className="border border-border p-8 text-center animate-pulse bg-accent/10">
            <div className="h-6 bg-muted w-48 mx-auto mb-4 rounded"></div>
            <div className="h-4 bg-muted w-32 mx-auto rounded"></div>
          </div>
        ) : order ? (
          <>
            <div className="bg-background border border-border/60 text-left overflow-hidden mb-6">
              <div className="bg-accent/20 px-6 py-4 border-b border-border/60 flex flex-col sm:flex-row justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Numéro de commande</p>
                  <p className="font-mono font-bold text-lg">#{order.id.toString().padStart(6, "0")}</p>
                </div>
                <div className="sm:text-right">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Date</p>
                  <p className="font-medium">{new Date(order.createdAt).toLocaleDateString("fr-TN")}</p>
                </div>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-serif text-lg font-bold mb-4">Adresse de livraison</h3>
                  <address className="not-italic text-muted-foreground text-sm leading-relaxed">
                    <span className="text-foreground font-medium block mb-1">{order.customerName}</span>
                    {order.address}<br />
                    {order.city}, {order.governorate}<br />
                    Tunisie<br />
                    <span className="block mt-2">Tél: {order.phone}</span>
                  </address>
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold mb-4">Mode de paiement</h3>
                  <p className="text-sm font-medium text-foreground mb-2">
                    {order.paymentMethod === "cash_on_delivery"
                      ? "Paiement à la livraison"
                      : "Paiement en ligne (Flouci)"}
                  </p>
                  <div className="mt-4 pt-4 border-t border-border/40 space-y-2 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Sous-total</span>
                      <span>{formatPrice(order.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Livraison</span>
                      <span>{formatPrice(order.shippingFee)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-base text-foreground pt-2">
                      <span>Total</span>
                      <span className="text-primary">{formatPrice(order.total)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {order.items && order.items.length > 0 && (
                <div className="border-t border-border/60 bg-accent/5 p-6">
                  <h3 className="font-serif text-lg font-bold mb-4 flex items-center">
                    <PackageOpen className="w-5 h-5 mr-2 text-muted-foreground" />
                    Articles commandés
                  </h3>
                  <ul className="space-y-3">
                    {order.items.map((item, idx) => (
                      <li key={idx} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {item.quantity}x{" "}
                          <span className="text-foreground font-medium">{item.productName}</span>
                        </span>
                        <span>{formatPrice(item.totalPrice)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Download Receipt button */}
            <div className="mb-10">
              <Button
                variant="outline"
                size="lg"
                className="rounded-none h-12 px-8 text-sm font-medium border-border"
                onClick={() => generateReceipt({
                  id: order.id,
                  customerName: order.customerName,
                  email: order.email,
                  phone: order.phone,
                  address: order.address,
                  city: order.city,
                  governorate: order.governorate,
                  paymentMethod: order.paymentMethod,
                  status: order.status,
                  subtotal: order.subtotal,
                  shippingFee: order.shippingFee,
                  total: order.total,
                  createdAt: order.createdAt,
                  items: order.items,
                })}
              >
                <Download className="w-4 h-4 mr-2" />
                Télécharger le reçu (PDF)
              </Button>
            </div>
          </>
        ) : null}

        <div className="flex justify-center">
          <Link href="/products">
            <Button
              size="lg"
              className="rounded-none h-14 px-8 text-base font-medium group"
              data-testid="button-continue-shopping"
            >
              Continuer vos achats
              <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>

      </div>
    </PageTransition>
  );
}
