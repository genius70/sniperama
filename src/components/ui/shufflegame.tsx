import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, Transaction } from '@solana/web3.js';
import styled, { css } from 'styled-components';

interface ShuffleGameProps {
  width?: number;
  theme?: 'dark' | 'light';
}

interface TokenData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
}

interface RewardTier {
  min: number;
  max: number;
  probability: number;
}

const SHUFFLE_DURATION = 3000;
const REWARD_TIERS: RewardTier[] = [
  { min: 1, max: 5, probability: 0.5 },    // 50% chance
  { min: 6, max: 20, probability: 0.3 },   // 30% chance
  { min: 21, max: 100, probability: 0.15 },// 15% chance
  { min: 101, max: 1000, probability: 0.05 } // 5% chance
];

const ShuffleGame: React.FC<ShuffleGameProps> = ({ width = 400, theme = 'dark' }) => {
  const { publicKey, sendTransaction } = useWallet();
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<{ token: TokenData; reward: number } | null>(null);
  const [error, setError] = useState<string>('');

  // Fetch Solana memecoins from CoinGecko
  useEffect(() => {
    const fetchTokens = async () => {
      try {
        const response = await fetch(
          `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&category=solana-ecosystem&per_page=100`
        );
        const data = await response.json();
        setTokens(data.filter((t: TokenData) => t.current_price > 0));
      } catch (err) {
        setError('Failed to load tokens');
      } finally {
        setLoading(false);
      }
    };

    fetchTokens();
  }, []);

  const calculateReward = useCallback(() => {
    const random = Math.random();
    let cumulative = 0;

    for (const tier of REWARD_TIERS) {
      cumulative += tier.probability;
      if (random <= cumulative) {
        return Math.floor(Math.random() * (tier.max - tier.min + 1)) + tier.min;
      }
    }
    return REWARD_TIERS[0].min;
  }, []);

  const handleSpin = async () => {
    if (!publicKey) {
      setError('Please connect your wallet');
      return;
    }

    try {
      setIsSpinning(true);
      setError('');

      // Deduct spin fee (0.1 SOL example)
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey('FEE_RECEIVER_WALLET'),
          lamports: 0.1 * LAMPORTS_PER_SOL
        })
      );

      await sendTransaction(transaction, new Connection(CLUSTER));

      // Shuffle animation
      const startTime = Date.now();
      const shuffleInterval = setInterval(() => {
        if (Date.now() - startTime > SHUFFLE_DURATION) {
          clearInterval(shuffleInterval);
          const reward = calculateReward();
          const randomToken = tokens[Math.floor(Math.random() * tokens.length)];
          setResult({ token: randomToken, reward });
          setIsSpinning(false);
        }
      }, 100);

    } catch (err) {
      setError('Transaction failed');
      setIsSpinning(false);
    }
  };

  if (loading) return <Container>Loading tokens...</Container>;
  if (error) return <Container>{error}</Container>;

  return (
    <Container width={width} theme={theme}>
      <SlotMachine>
        <Reel $isSpinning={isSpinning}>
          {tokens.map((token) => (
            <TokenItem key={token.id}>
              <TokenImage src={token.image} alt={token.name} />
              <TokenSymbol>{token.symbol.toUpperCase()}</TokenSymbol>
            </TokenItem>
          ))}
        </Reel>
        
        <ResultOverlay>
          {result && (
            <ResultDisplay>
              <h3>You won!</h3>
              <RewardAmount>${result.reward}</RewardAmount>
              <TokenInfo>
                <TokenImage src={result.token.image} />
                <span>{result.token.name}</span>
              </TokenInfo>
            </ResultDisplay>
          )}
        </ResultOverlay>
      </SlotMachine>

      <SpinButton 
        onClick={handleSpin}
        disabled={isSpinning || !publicKey}
      >
        {isSpinning ? 'Spinning...' : 'SPIN (0.1 SOL)'}
      </SpinButton>
    </Container>
  );
};

// Styled components
const Container = styled.div<{ width: number; theme: string }>`
  width: ${({ width }) => width}px;
  background: ${({ theme }) => (theme === 'dark' ? '#2a2a2a' : '#fff')};
  color: ${({ theme }) => (theme === 'dark' ? '#fff' : '#000')};
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const SlotMachine = styled.div`
  position: relative;
  height: 200px;
  overflow: hidden;
  border: 2px solid #00ff88;
  border-radius: 8px;
  margin-bottom: 20px;
`;

const Reel = styled.div<{ $isSpinning: boolean }>`
  transition: ${({ $isSpinning }) => 
    $isSpinning ? 'none' : 'transform 0.5s ease-out'};
  transform: ${({ $isSpinning }) => 
    $isSpinning ? `translateY(-${Math.random() * 1000}%)` : 'translateY(0)'};
`;

const TokenItem = styled.div`
  display: flex;
  align-items: center;
  padding: 10px;
  height: 60px;
`;

const TokenImage = styled.img`
  width: 30px;
  height: 30px;
  margin-right: 10px;
`;

const TokenSymbol = styled.span`
  font-weight: bold;
`;

const ResultOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ResultDisplay = styled.div`
  text-align: center;
  color: #00ff88;
`;

const RewardAmount = styled.div`
  font-size: 2em;
  font-weight: bold;
  margin: 10px 0;
`;

const TokenInfo = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const SpinButton = styled.button`
  width: 100%;
  padding: 15px;
  background: #7000ff;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1.1em;
  transition: opacity 0.3s;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

export default ShuffleGame;