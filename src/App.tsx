import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import Navbar from "@/components/Navbar";
import Index from "@/pages/Index";
import Options from "@/pages/Options";
import ProfitLoss from "@/pages/ProfitLoss";
import Reporting from "@/pages/Reporting";
import Settings from "@/pages/Settings";
import Tracking from "@/pages/Tracking";
import { WalletProvider } from "@/hooks/useWallet";
import "./App.css";

function App() {
  return (
    <WalletProvider>
    <Router>
      <div className="min-h-screen bg-gray-900 text-white">
        <Navbar />
        <main className="container mx-auto px-4">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/tracking" element={<Tracking />} />
            <Route path="/reporting" element={<Reporting />} />
            <Route path="/profit-loss" element={<ProfitLoss />} />
            <Route path="/options" element={<Options />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
        <Toaster />
      </div>
    </Router>
    </ WalletProvider >
  );
}

export default App;
