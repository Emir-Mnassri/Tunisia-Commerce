import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/format";
import { useCreateOrder, useInitiateFlouci } from "@workspace/api-client-react";
import { PageTransition } from "@/components/layout/page-transition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

const TUNISIAN_GOVERNORATES = [
  "Tunis", "Ariana", "Ben Arous", "Manouba", "Nabeul", "Zaghouan", "Bizerte", 
  "Béja", "Jendouba", "Le Kef", "Siliana", "Sousse", "Monastir", "Mahdia", 
  "Sfax", "Kairouan", "Kasserine", "Sidi Bouzid", "Gabès", "Médenine", 
  "Tataouine", "Gafsa", "Tozeur", "Kébili"
] as const;

const checkoutSchema = z.object({
  customerName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Adresse email invalide"),
  phone: z.string().min(8, "Le numéro doit contenir au moins 8 chiffres").regex(/^[0-9+ ]+$/, "Format de numéro invalide"),
  address: z.string().min(5, "L'adresse est requise"),
  governorate: z.enum(TUNISIAN_GOVERNORATES, { required_error: "Veuillez sélectionner un gouvernorat" }),
  city: z.string().min(2, "La ville est requise"),
  paymentMethod: z.enum(["cash_on_delivery", "flouci"], { required_error: "Veuillez choisir un mode de paiement" }),
  notes: z.string().optional(),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

export default function Checkout() {
  const [, setLocation] = useLocation();
  const { items, subtotal, clearCart } = useCart();
  const { toast } = useToast();
  
  const createOrder = useCreateOrder();
  const initiateFlouci = useInitiateFlouci();

  const [isProcessing, setIsProcessing] = useState(false);

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0 && !isProcessing) {
      setLocation("/cart");
    }
  }, [items.length, setLocation, isProcessing]);

  const shippingFee = 7;
  const total = subtotal + shippingFee;

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customerName: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      notes: "",
      paymentMethod: "cash_on_delivery",
    },
  });

  const onSubmit = async (data: CheckoutFormValues) => {
    setIsProcessing(true);
    
    try {
      // 1. Create order
      const order = await createOrder.mutateAsync({
        data: {
          ...data,
          items: items.map(item => ({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice
          }))
        }
      });

      // Clear the local cart since order is safely created
      clearCart();

      // 2. Handle payment flow
      if (data.paymentMethod === "cash_on_delivery") {
        setLocation(`/success?orderId=${order.id}`);
      } else if (data.paymentMethod === "flouci") {
        // Initiate Flouci
        const flouciResult = await initiateFlouci.mutateAsync({
          data: {
            orderId: order.id,
            amount: total,
            successUrl: window.location.origin + "/success",
            failUrl: window.location.origin + "/checkout"
          }
        });
        
        // Go to fake gateway
        setLocation(`/flouci-redirect?redirectUrl=${encodeURIComponent(flouciResult.redirectUrl)}`);
      }
    } catch (error) {
      setIsProcessing(false);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur est survenue lors de la création de votre commande. Veuillez réessayer.",
      });
      console.error(error);
    }
  };

  if (items.length === 0 && !isProcessing) {
    return null; // Will redirect via useEffect
  }

  return (
    <PageTransition className="bg-background pt-12 pb-24">
      <div className="container mx-auto px-4 md:px-6 max-w-6xl">
        <h1 className="font-serif text-4xl font-bold mb-10">Finaliser la commande</h1>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col lg:flex-row gap-12 lg:gap-16">
            
            {/* Form Fields */}
            <div className="w-full lg:w-3/5 space-y-10">
              
              {/* Informations de contact */}
              <section>
                <h2 className="font-serif text-2xl font-semibold mb-6 flex items-center border-b border-border/40 pb-4">
                  <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm mr-3 font-sans">1</span>
                  Contact
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="customerName"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel className="uppercase text-xs tracking-wider text-muted-foreground">Nom complet *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ali Ben Salah" className="rounded-none h-12" {...field} data-testid="input-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="uppercase text-xs tracking-wider text-muted-foreground">Email *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="ali@example.com" className="rounded-none h-12" {...field} data-testid="input-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="uppercase text-xs tracking-wider text-muted-foreground">Téléphone *</FormLabel>
                        <FormControl>
                          <Input type="tel" placeholder="+216 22 123 456" className="rounded-none h-12" {...field} data-testid="input-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </section>

              {/* Adresse de livraison */}
              <section>
                <h2 className="font-serif text-2xl font-semibold mb-6 flex items-center border-b border-border/40 pb-4">
                  <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm mr-3 font-sans">2</span>
                  Livraison
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel className="uppercase text-xs tracking-wider text-muted-foreground">Adresse complète *</FormLabel>
                        <FormControl>
                          <Input placeholder="123 Rue de l'Indépendance, Appt 4" className="rounded-none h-12" {...field} data-testid="input-address" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="governorate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="uppercase text-xs tracking-wider text-muted-foreground">Gouvernorat *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="rounded-none h-12" data-testid="select-gov">
                              <SelectValue placeholder="Sélectionner..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-none max-h-60">
                            {TUNISIAN_GOVERNORATES.map(gov => (
                              <SelectItem key={gov} value={gov} data-testid={`option-gov-${gov}`}>{gov}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="uppercase text-xs tracking-wider text-muted-foreground">Ville *</FormLabel>
                        <FormControl>
                          <Input placeholder="La Marsa" className="rounded-none h-12" {...field} data-testid="input-city" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel className="uppercase text-xs tracking-wider text-muted-foreground">Notes pour la livraison (Optionnel)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Code d'accès, instructions spéciales..." 
                            className="rounded-none resize-none" 
                            {...field} 
                            data-testid="input-notes"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </section>

              {/* Paiement */}
              <section>
                <h2 className="font-serif text-2xl font-semibold mb-6 flex items-center border-b border-border/40 pb-4">
                  <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm mr-3 font-sans">3</span>
                  Paiement
                </h2>
                
                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem className="space-y-4">
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col gap-4"
                        >
                          <div className={`flex items-center space-x-3 border p-4 cursor-pointer transition-colors ${field.value === 'cash_on_delivery' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                            <RadioGroupItem value="cash_on_delivery" id="cash" data-testid="radio-cash" />
                            <div className="flex-1">
                              <label htmlFor="cash" className="font-serif font-bold text-lg cursor-pointer">Paiement à la livraison</label>
                              <p className="text-sm text-muted-foreground">Payer en espèces au moment de la réception de votre commande.</p>
                            </div>
                          </div>
                          
                          <div className={`flex items-center space-x-3 border p-4 cursor-pointer transition-colors ${field.value === 'flouci' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                            <RadioGroupItem value="flouci" id="flouci" data-testid="radio-flouci" />
                            <div className="flex-1 flex justify-between items-center">
                              <div>
                                <label htmlFor="flouci" className="font-serif font-bold text-lg cursor-pointer">Paiement en ligne sécurisé</label>
                                <p className="text-sm text-muted-foreground">Payer par carte bancaire via la passerelle Flouci.</p>
                              </div>
                              <div className="hidden sm:block font-bold text-xl text-[#00E5FF] tracking-tighter bg-black px-3 py-1 rounded italic">
                                Flouci
                              </div>
                            </div>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </section>

            </div>

            {/* Recap & Submit */}
            <div className="w-full lg:w-2/5">
              <div className="bg-accent/10 p-8 border border-border/40 sticky top-24">
                <h2 className="font-serif text-2xl font-bold mb-6">Votre commande</h2>
                
                <div className="space-y-4 mb-6 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                  {items.map(item => (
                    <div key={item.productId} className="flex justify-between items-start gap-4">
                      <div className="flex gap-3">
                        <div className="w-12 h-16 bg-muted/30 shrink-0">
                          {item.imageUrl && <img src={item.imageUrl} className="w-full h-full object-cover" alt="" />}
                        </div>
                        <div>
                          <p className="font-medium text-sm line-clamp-2">{item.productName}</p>
                          <p className="text-xs text-muted-foreground mt-1">Qté: {item.quantity}</p>
                        </div>
                      </div>
                      <span className="font-medium text-sm shrink-0">{formatPrice(item.totalPrice)}</span>
                    </div>
                  ))}
                </div>

                <Separator className="my-6" />

                <div className="space-y-3 text-sm mb-6">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sous-total</span>
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
                  <span className="font-bold text-2xl text-primary">{formatPrice(total)}</span>
                </div>

                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full rounded-none h-14 text-base uppercase tracking-wider font-semibold relative overflow-hidden" 
                  disabled={isProcessing}
                  data-testid="button-submit-order"
                >
                  {isProcessing ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                      Traitement en cours...
                    </div>
                  ) : form.watch("paymentMethod") === "flouci" ? (
                    "Procéder au paiement"
                  ) : (
                    "Confirmer la commande"
                  )}
                </Button>
                
                <p className="text-xs text-center text-muted-foreground mt-4">
                  En confirmant votre commande, vous acceptez nos conditions générales de vente.
                </p>
              </div>
            </div>

          </form>
        </Form>
      </div>
    </PageTransition>
  );
}
