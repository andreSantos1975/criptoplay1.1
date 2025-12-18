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

  // --- DETAILED LOGGING FOR DEBUGGING ---
  console.log(`[AlertProcessor] Found ${activeAlerts.length} active alerts.`);
  console.log('[AlertProcessor] Active alerts data:', JSON.stringify(activeAlerts, null, 2));
  // --- END DETAILED LOGGING ---

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

    // Track symbols that failed to fetch price
    const failedSymbols: Set<string> = new Set();

    try {
      // Fetch current prices for all symbols in parallel using getCurrentPrice
      const pricePromises = symbolsToMonitor.map(async (symbol) => {
        try {
          const priceDecimal = await getCurrentPrice(symbol);
          prices[symbol] = parseFloat(priceDecimal.toString());
        } catch (error) {
          console.error(`[AlertProcessor] Error fetching price for ${symbol}:`, error);
          failedSymbols.add(symbol); // Mark symbol as failed
        }
      });
      await Promise.all(pricePromises);

    } catch (error) {
      console.error('[AlertProcessor] Failed to fetch prices from Binance:', error);
      // Decide whether to proceed without prices or stop
    }

    // Process failed symbols: update associated active alerts to ERROR status
    if (failedSymbols.size > 0) {
      console.log(`[AlertProcessor] Handling failed price fetches for symbols: ${Array.from(failedSymbols).join(', ')}`);
      await prisma.alert.updateMany({
        where: {
          type: AlertType.PRICE,
          status: AlertStatus.ACTIVE,
          // Find alerts where the symbol in config matches a failed symbol
          OR: Array.from(failedSymbols).map(symbol => ({
            config: {
              path: ['symbol'],
              equals: symbol,
            },
          })),
        },
        data: {
          status: AlertStatus.ERROR,
          triggeredAt: new Date(), // Use triggeredAt to mark when error occurred
        },
      });
    }

    for (const alert of priceAlerts) {
      const config = alert.config as any;
      const { symbol, targetPrice: rawTargetPrice, operator } = config;

      // Skip processing for alerts whose symbol failed to fetch price (handled by failedSymbols logic)
      if (failedSymbols.has(symbol)) {
        console.warn(`[AlertProcessor] Skipping price alert for ${symbol} (ID: ${alert.id}) as its price fetch failed.`);
        continue;
      }
      
      // Explicitly check for missing or invalid targetPrice in config
      if (rawTargetPrice === undefined || rawTargetPrice === null || rawTargetPrice === '') {
        console.error(`[AlertProcessor] Skipping alert for ${symbol} (ID: ${alert.id}) due to missing or empty targetPrice in config.`);
        // Update this specific alert to ERROR status
        await prisma.alert.update({
          where: { id: alert.id },
          data: {
            status: AlertStatus.ERROR,
            triggeredAt: new Date(), // Mark when error occurred
          },
        });
        continue; // Skip to next alert
      }

      const currentPrice = prices[symbol];
      const targetPrice = parseFloat(rawTargetPrice); // Ensure targetPrice is a number
      let shouldTrigger = false;

      // --- DETAILED LOGGING FOR DEBUGGING ---
      console.log(`[AlertProcessor] Checking Alert ID: ${alert.id} | Condition: ${currentPrice} ${operator} ${targetPrice} ?`);
      // --- END DETAILED LOGGING ---

      // Check if targetPrice is NaN after parsing (e.g., if rawTargetPrice was non-numeric string)
      if (Number.isNaN(targetPrice)) {
        console.error(`[AlertProcessor] Skipping alert for ${symbol} (ID: ${alert.id}) due to non-numeric targetPrice: ${rawTargetPrice}`);
        await prisma.alert.update({
          where: { id: alert.id },
          data: {
            status: AlertStatus.ERROR,
            triggeredAt: new Date(), // Mark when error occurred
          },
        });
        continue; // Skip to next alert
      }

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
