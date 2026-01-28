import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useWeb3Auth, useWeb3AuthConnect } from "@/lib/web3auth-react-bridge";
import { USE_MOCK_API } from "@/lib/mock-api";
import {
  Wallet,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  Shield,
  Link as LinkIcon,
  LogOut,
  QrCode,
  Eye,
  EyeOff,
} from "lucide-react";
import { ethers } from "ethers";

export default function WalletManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Get Web3Auth hooks - must be called unconditionally
  // In mock mode without Web3AuthProvider, these will throw and be caught by ErrorBoundary
  // For now, we handle gracefully by using optional chaining
  const web3AuthResult = useWeb3Auth();
  const web3Auth = web3AuthResult?.web3Auth || null;
  const isConnected = USE_MOCK_API ? false : (web3AuthResult?.isConnected || false);
  
  const connectResult = useWeb3AuthConnect();
  const connect = connectResult?.connect;
  
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<string | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showAddress, setShowAddress] = useState(false);

  // Get wallet address from localStorage or Web3Auth
  useEffect(() => {
    // In mock mode, use a mock address if none exists
    if (USE_MOCK_API) {
      const addressFromStorage = typeof window !== 'undefined' 
        ? localStorage.getItem('wallet_address') 
        : null;
      
      if (addressFromStorage) {
        setWalletAddress(addressFromStorage);
      } else {
        // Set a mock wallet address for testing
        const mockAddress = '0x1234567890123456789012345678901234567890';
        setWalletAddress(mockAddress);
        if (typeof window !== 'undefined') {
          localStorage.setItem('wallet_address', mockAddress);
        }
      }
      return;
    }
    
    // Real Web3Auth mode
    const addressFromStorage = typeof window !== 'undefined' 
      ? localStorage.getItem('wallet_address') 
      : null;
    
    if (addressFromStorage) {
      setWalletAddress(addressFromStorage);
    } else if (isConnected && web3Auth?.provider) {
      // Try to get address from Web3Auth provider
      const getAddressFromProvider = async () => {
        try {
          const provider = new ethers.BrowserProvider(web3Auth.provider);
          const signer = await provider.getSigner();
          const address = await signer.getAddress();
          setWalletAddress(address);
          if (typeof window !== 'undefined') {
            localStorage.setItem('wallet_address', address);
          }
        } catch (error) {
          console.error('Error getting wallet address:', error);
        }
      };
      getAddressFromProvider();
    }
  }, [isConnected, web3Auth]);

  // Fetch wallet balance
  const fetchBalance = useCallback(async () => {
    if (!walletAddress || !web3Auth?.provider) {
      return;
    }

    setIsLoadingBalance(true);
    try {
      const provider = new ethers.BrowserProvider(web3Auth.provider);
      const balance = await provider.getBalance(walletAddress);
      const formattedBalance = ethers.formatEther(balance);
      setWalletBalance(parseFloat(formattedBalance).toFixed(4));
    } catch (error) {
      console.error('Error fetching balance:', error);
      toast({
        title: "Error",
        description: "Could not fetch wallet balance. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingBalance(false);
    }
  }, [walletAddress, web3Auth, toast]);

  useEffect(() => {
    if (walletAddress && isConnected && web3Auth?.provider) {
      fetchBalance();
    }
  }, [walletAddress, isConnected, web3Auth, fetchBalance]);

  const handleCopyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Wallet address copied to clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleConnectWallet = async () => {
    if (!connect) {
      toast({
        title: "Web3Auth Not Available",
        description: "Web3Auth is not initialized. Please check your configuration.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await connect();
      toast({
        title: "Connecting...",
        description: "Please complete the wallet connection.",
      });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Could not connect wallet. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDisconnect = async () => {
    try {
      if (web3Auth) {
        await web3Auth.logout();
      }
      if (typeof window !== 'undefined') {
        localStorage.removeItem('wallet_address');
      }
      setWalletAddress(null);
      setWalletBalance(null);
      toast({
        title: "Disconnected",
        description: "Wallet has been disconnected.",
      });
    } catch (error) {
      console.error('Error disconnecting:', error);
      toast({
        title: "Error",
        description: "Could not disconnect wallet.",
        variant: "destructive",
      });
    }
  };

  const truncateAddress = (address: string | null) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getExplorerUrl = (address: string) => {
    // Default to Polygon explorer, can be made configurable
    return `https://polygonscan.com/address/${address}`;
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold" data-testid="text-page-title">Wallet Management</h1>
          <p className="text-muted-foreground">
            Manage your connected wallet and view your balance
          </p>
        </div>

        {/* Wallet Connection Status */}
        {(!walletAddress) ? (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Wallet Connected</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Connect your wallet to manage assets, sign transactions, and interact with the blockchain.
              </p>
              <Button onClick={handleConnectWallet} size="lg" data-testid="button-connect-wallet">
                <LinkIcon className="w-4 h-4 mr-2" />
                Connect Wallet
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Wallet Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="w-5 h-5" />
                  Wallet Overview
                </CardTitle>
                <CardDescription>
                  Your connected wallet address and balance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Wallet Address */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Wallet Address
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 font-mono text-sm p-3 rounded-md bg-muted border flex items-center justify-between">
                      <span>{showAddress ? walletAddress : truncateAddress(walletAddress)}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAddress(!showAddress)}
                        className="ml-2"
                        data-testid="button-toggle-address"
                      >
                        {showAddress ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleCopyAddress}
                      data-testid="button-copy-address"
                    >
                      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => window.open(getExplorerUrl(walletAddress!), '_blank')}
                      data-testid="button-view-explorer"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Wallet Balance */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Balance
                    </label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={fetchBalance}
                      disabled={isLoadingBalance}
                      data-testid="button-refresh-balance"
                    >
                      <RefreshCw className={`w-4 h-4 ${isLoadingBalance ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                  <div className="p-4 rounded-md bg-muted border">
                    {isLoadingBalance ? (
                      <div className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span className="text-sm text-muted-foreground">Loading...</span>
                      </div>
                    ) : walletBalance !== null ? (
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold">{walletBalance}</span>
                        <span className="text-sm text-muted-foreground">MATIC</span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Unable to load balance</span>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Wallet Actions */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={handleDisconnect}
                    data-testid="button-disconnect"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Disconnect Wallet
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => window.open(getExplorerUrl(walletAddress!), '_blank')}
                    data-testid="button-view-on-explorer"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View on Explorer
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Security Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Shield className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium mb-1">Your wallet is secure</p>
                    <p className="text-sm text-muted-foreground">
                      Your private keys are stored securely and never shared with Empressa. 
                      Only you have access to your wallet.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0 mt-0.5">
                    <QrCode className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="font-medium mb-1">Backup your wallet</p>
                    <p className="text-sm text-muted-foreground">
                      Make sure you have backed up your wallet recovery phrase in a secure location. 
                      If you lose access, we cannot recover your wallet.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Transaction History Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>
                  Your recent on-chain transactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <p className="mb-2">Transaction history coming soon</p>
                  <p className="text-sm">
                    View all your transactions on{" "}
                    <a
                      href={getExplorerUrl(walletAddress!)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      PolygonScan
                    </a>
                  </p>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
