import prisma from './prisma';
import { AlertType, AlertStatus } from '@prisma/client';
import { getCurrentPrice } from './binance';
import { sendPriceAlertEmail } from './mail'; // Importado para envio de e-mails

export async function processAlerts() {
  console.log('[AlertProcessor] Starting to process alerts...');

  const activeAlerts = await prisma.alert.findMany({
    where: {
      status: AlertStatus.ACTIVE,
    },
    include: {
      user: true, // Inclui dados do usuário para obter o e-mail
    },
  });

  // --- DETAILED LOGGING FOR DEBUGGING ---
  console.log(`[AlertProcessor] Found ${activeAlerts.length} active alerts.`);
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
    
    const symbolsToMonitor = Array.from(new Set(priceAlerts.map(alert => (alert.config as any).symbol)));
    const prices: { [key: string]: number } = {};
    const failedSymbols: Set<string> = new Set();

    try {
      const pricePromises = symbolsToMonitor.map(async (symbol) => {
        try {
          const priceDecimal = await getCurrentPrice(symbol);
          prices[symbol] = parseFloat(priceDecimal.toString());
        } catch (error) {
          console.error(`[AlertProcessor] Error fetching price for ${symbol}:`, error);
          failedSymbols.add(symbol);
        }
      });
      await Promise.all(pricePromises);

    } catch (error) {
      console.error('[AlertProcessor] Failed to fetch prices from Binance:', error);
    }

    if (failedSymbols.size > 0) {
      console.log(`[AlertProcessor] Handling failed price fetches for symbols: ${Array.from(failedSymbols).join(', ')}`);
      await prisma.alert.updateMany({
        where: {
          type: AlertType.PRICE,
          status: AlertStatus.ACTIVE,
          OR: Array.from(failedSymbols).map(symbol => ({
            config: {
              path: ['symbol'],
              equals: symbol,
            },
          })),
        },
        data: {
          status: AlertStatus.ERROR,
          triggeredAt: new Date(),
        },
      });
    }

    for (const alert of priceAlerts) {
      const config = alert.config as any;
      const { symbol, targetPrice: rawTargetPrice, operator } = config;

      if (failedSymbols.has(symbol)) {
        continue;
      }
      
      if (rawTargetPrice === undefined || rawTargetPrice === null || rawTargetPrice === '') {
        console.error(`[AlertProcessor] Skipping alert for ${symbol} (ID: ${alert.id}) due to missing targetPrice.`);
        await prisma.alert.update({
          where: { id: alert.id },
          data: { status: AlertStatus.ERROR, triggeredAt: new Date() },
        });
        continue;
      }

      const currentPrice = prices[symbol];
      const targetPrice = parseFloat(rawTargetPrice);
      let shouldTrigger = false;

      if (Number.isNaN(targetPrice)) {
        console.error(`[AlertProcessor] Skipping alert for ${symbol} (ID: ${alert.id}) due to non-numeric targetPrice.`);
        await prisma.alert.update({
          where: { id: alert.id },
          data: { status: AlertStatus.ERROR, triggeredAt: new Date() },
        });
        continue;
      }

      if (operator === 'gt' && currentPrice > targetPrice) {
        shouldTrigger = true;
      } else if (operator === 'lt' && currentPrice < targetPrice) {
        shouldTrigger = true;
      }

      if (shouldTrigger) {
        console.log(`[AlertProcessor] Price alert triggered for ${symbol}: ${currentPrice} ${operator} ${targetPrice}`);
        
        // 1. Atualiza o status no banco de dados
        await prisma.alert.update({
          where: { id: alert.id },
          data: {
            status: AlertStatus.TRIGGERED,
            triggeredAt: new Date(),
          },
        });

        // 2. Envia o e-mail via Resend
        if (alert.user && alert.user.email) {
            await sendPriceAlertEmail({
                to: alert.user.email,
                userName: alert.user.name || alert.user.username || 'Investidor',
                symbol: symbol,
                price: currentPrice,
                targetPrice: targetPrice,
                operator: operator as 'gt' | 'lt',
            });
        } else {
            console.warn(`[AlertProcessor] Alert ${alert.id} triggered but user has no email.`);
        }
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
