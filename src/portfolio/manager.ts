import { getPrices } from '../brokers/alpaca';
import Alpaca from '@alpacahq/alpaca-trade-api';
import { logger } from '../utils/logger';

const alpaca = new Alpaca({
    keyId: process.env.ALPACA_API_KEY!,
    secretKey: process.env.ALPACA_SECRET_KEY!,
    paper: process.env.ALPACA_USE_PAPER === 'true'
});

const TAKE_PROFIT = 0.8; // 8%
const STOP_LOSS = 0.02;  // 2%

export interface ExitCandidate {
    symbol: string;
    currentPrice: number;
    entryPrice: number;
    gain: number;
}

export async function getHeldPositions(): Promise<string[]> {
    const positions = await alpaca.getPositions();
    return positions.map((p: any) => p.symbol);
}
export async function getExitCandidates(): Promise<ExitCandidate[]> {
    const positions = await alpaca.getPositions();
    const symbols = positions.map((p: any) => p.symbol);
    const prices = await getPrices(symbols);

    logger.info(`getExitCandidates positions: ${JSON.stringify(positions)}`);

    const exitChecks = positions.map((pos: any) => {
        const symbol = pos.symbol;
        const entryPrice = parseFloat(pos.avg_entry_price);
        const priceEntry = prices.find((p) => p.symbol === symbol);

        if (!priceEntry) {
            logger.warn(`Price missing for symbol ${symbol}`);
            return null;
        }

        const currentPrice = priceEntry.price;
        const gain = (currentPrice - entryPrice) / entryPrice;
        logger.info(`exitChecks ${symbol} entryPrice:${entryPrice} currentPrice:${currentPrice} gain:${gain}`);

        if (gain >= TAKE_PROFIT || gain <= -STOP_LOSS) {
            return { symbol, currentPrice, entryPrice, gain };
        }

        return null;
    });

    return exitChecks.filter(Boolean) as ExitCandidate[];
}

export async function getAvailableCash(): Promise<number> {
    const account = await alpaca.getAccount();
    return parseFloat(account.cash);
}
