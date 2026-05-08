import { useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { motion } from "framer-motion";

export default function FlouciRedirect() {
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const redirectUrl = searchParams.get("redirectUrl");
  const [, setLocation] = useLocation();

  useEffect(() => {
    // If no redirect URL was provided, just fail back
    if (!redirectUrl) {
      setLocation("/checkout");
      return;
    }

    // Simulate the gateway processing time, then go to success
    // In a real app, we would do `window.location.href = redirectUrl`
    // to actually leave our SPA and go to Flouci.
    // For this mockup, we just wait 2s and redirect to our success page 
    // with a mock payment ID.
    const timer = setTimeout(() => {
      // Parse out the origin from the success URL if we needed to, 
      // but we know it's our own /success page.
      const mockPaymentId = "FL_" + Math.random().toString(36).substring(2, 9).toUpperCase();
      
      // In reality, Flouci redirects back to our successUrl with payment_id in query params
      setLocation(`/success?payment_id=${mockPaymentId}&simulated=true`);
    }, 2500);

    return () => clearTimeout(timer);
  }, [redirectUrl, setLocation]);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#F9F9F9] fixed inset-0 z-50">
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-black p-8 rounded-2xl shadow-2xl flex flex-col items-center max-w-sm w-full mx-4"
      >
        <div className="font-bold text-4xl text-[#00E5FF] tracking-tighter italic mb-8">
          Flouci
        </div>

        <div className="w-12 h-12 border-4 border-[#00E5FF]/20 border-t-[#00E5FF] rounded-full animate-spin mb-6"></div>

        <h2 className="text-white font-medium text-lg text-center mb-2">
          Redirection en cours...
        </h2>
        <p className="text-white/60 text-sm text-center">
          Veuillez patienter pendant que nous sécurisons votre connexion.
        </p>

        <div className="mt-8 pt-6 border-t border-white/10 w-full flex items-center justify-center gap-2">
          <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span className="text-white/40 text-xs">Paiement 100% sécurisé</span>
        </div>
      </motion.div>

    </div>
  );
}
