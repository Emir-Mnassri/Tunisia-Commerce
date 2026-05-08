import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/lib/cart-context";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { AnimatePresence } from "framer-motion";

// Pages
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Products from "@/pages/products/index";
import ProductDetail from "@/pages/products/[id]";
import Cart from "@/pages/cart";
import Checkout from "@/pages/checkout";
import FlouciRedirect from "@/pages/flouci-redirect";
import Success from "@/pages/success";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <div className="flex flex-col min-h-[100dvh]">
              <Header />
              <main className="flex-1">
                <AnimatePresence mode="wait">
                  <Switch>
                    <Route path="/" component={Home} />
                    <Route path="/products" component={Products} />
                    <Route path="/products/:id" component={ProductDetail} />
                    <Route path="/cart" component={Cart} />
                    <Route path="/checkout" component={Checkout} />
                    <Route path="/flouci-redirect" component={FlouciRedirect} />
                    <Route path="/success" component={Success} />
                    <Route component={NotFound} />
                  </Switch>
                </AnimatePresence>
              </main>
              <Footer />
            </div>
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </CartProvider>
    </QueryClientProvider>
  );
}

export default App;
