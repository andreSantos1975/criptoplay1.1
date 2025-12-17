import prisma from './prisma';
import { AlertType, AlertStatus } from '@prisma/client';
import { getCurrentPrice } from './binance'; // Updated to import getCurrentPrice

export async function processAlerts() {
  console.log('[AlertProcessor] Starting to process alerts...');

  const activeAlerts = await prisma.alert.findMany({
    where: {
      status: AlertStatus.ACTIVE,
    },
    include: {
      user: true, // To potentially get user-specific settings or notification preferences
    },
  });

  if (activeAlerts.length === 0) {
    console.log('[AlertProcessor] No active alerts to process.');
    return;
  }

  const priceAlerts = activeAlerts.filter(alert => alert.type === AlertType.PRICE);
  const budgetAlerts = activeAlerts.filter(alert => alert.type === AlertType.BUDGET);
  const billAlerts = activeAlerts.filter(alert => alert.type === AlertType.BILL);

  // --- Process Price Alerts ---
  if (priceAlerts.length > 0) {
    console.log(`[AlertProcessor] Processing ${priceAlerts.length} price alerts.`);
    
    const symbolsToMonitor = [...new Set(priceAlerts.map(alert => (alert.config as any).symbol))];
    const prices: { [key: string]: number } = {};

    try {
      // Fetch current prices for all symbols in parallel using getCurrentPrice
      const pricePromises = symbolsToMonitor.map(async (symbol) => {
        try {
          const priceDecimal = await getCurrentPrice(symbol);
          prices[symbol] = parseFloat(priceDecimal.toString());
        } catch (error) {
          console.error(`[AlertProcessor] Error fetching price for ${symbol}:`, error);
        }
      });
      await Promise.all(pricePromises);

    } catch (error) {
      console.error('[AlertProcessor] Failed to fetch prices from Binance:', error);
      // Decide whether to proceed without prices or stop
    }


    for (const alert of priceAlerts) {
      const config = alert.config as any;
      const { symbol, targetPrice, operator } = config; // operator could be 'gt' (greater than), 'lt' (less than)

      if (!prices[symbol]) {
        console.warn(`[AlertProcessor] Skipping price alert for ${symbol} due to missing price data.`);
        continue;
      }

      const currentPrice = prices[symbol];
      let shouldTrigger = false;

      // Basic price comparison logic
      if (operator === 'gt' && currentPrice > targetPrice) {
        shouldTrigger = true;
      } else if (operator === 'lt' && currentPrice < targetPrice) {
        shouldTrigger = true;
      }
      // Add more operators as needed (e.g., 'eq', 'gte', 'lte')

      if (shouldTrigger) {
        console.log(`[AlertProcessor] Price alert triggered for ${symbol}: ${currentPrice} ${operator} ${targetPrice}`);
        await prisma.alert.update({
          where: { id: alert.id },
          data: {
            status: AlertStatus.TRIGGERED,
            triggeredAt: new Date(),
          },
        });
        // TODO: Send notification (email, push, etc.)
      }
    }
  }

  // --- Process Budget Alerts (Placeholder) ---
  if (budgetAlerts.length > 0) {
    console.log(`[AlertProcessor] Processing ${budgetAlerts.length} budget alerts.`);
    // TODO: Implement budget alert logic
    // - Fetch user's current spending
    // - Compare with budget category limits
    // - Trigger if threshold reached
  }

  // --- Process Bill Alerts (Placeholder) ---
  if (billAlerts.length > 0) {
    console.log(`[AlertProcessor] Processing ${billAlerts.length} bill alerts.`);
    // TODO: Implement bill alert logic
    // - Check due dates for upcoming bills
    // - Trigger if bill is due soon
  }

  console.log('[AlertProcessor] Finished processing alerts.');
}
