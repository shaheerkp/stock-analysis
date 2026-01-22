/**
 * Daily Stock Recommendations with Entry/Exit/SL
 * Provides specific trading opportunities for intraday trading
 */

const axios = require('axios');

// Popular liquid stocks for intraday trading
const INTRADAY_WATCHLIST = [
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META',
    'SPY', 'QQQ', 'NFLX', 'AMD', 'BABA', 'DIS', 'COIN',
    'PLTR', 'SOFI', 'RIVN', 'F', 'NIO', 'UBER'
];

async function getDetailedStockData(symbol) {
    try {
        // Fetch intraday and daily data
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=5d`;
        const response = await axios.get(url);
        const data = response.data.chart.result[0];
        
        const quote = data.indicators.quote[0];
        const closes = quote.close.filter(v => v !== null);
        const highs = quote.high.filter(v => v !== null);
        const lows = quote.low.filter(v => v !== null);
        const volumes = quote.volume.filter(v => v !== null);
        const opens = quote.open.filter(v => v !== null);
        
        return {
            symbol: symbol,
            current: closes[closes.length - 1],
            open: opens[opens.length - 1],
            high: highs[highs.length - 1],
            low: lows[lows.length - 1],
            volume: volumes[volumes.length - 1],
            prevClose: closes[closes.length - 2],
            closes: closes.slice(-5),
            highs: highs.slice(-5),
            lows: lows.slice(-5),
            volumes: volumes.slice(-5)
        };
    } catch (error) {
        return null;
    }
}

function calculateRSI(prices, period = 14) {
    if (prices.length < period + 1) return null;
    
    let gains = 0;
    let losses = 0;
    
    for (let i = 1; i <= period; i++) {
        const change = prices[i] - prices[i - 1];
        if (change > 0) gains += change;
        else losses -= change;
    }
    
    const avgGain = gains / period;
    const avgLoss = losses / period;
    
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
}

function calculateATR(highs, lows, closes) {
    const tr = [];
    for (let i = 1; i < closes.length; i++) {
        const hl = highs[i] - lows[i];
        const hc = Math.abs(highs[i] - closes[i - 1]);
        const lc = Math.abs(lows[i] - closes[i - 1]);
        tr.push(Math.max(hl, hc, lc));
    }
    return tr.reduce((a, b) => a + b, 0) / tr.length;
}

function analyzeMomentum(stockData) {
    const { current, prevClose, closes, volume, volumes } = stockData;
    
    // Price change
    const priceChange = ((current - prevClose) / prevClose) * 100;
    
    // Volume vs average
    const avgVolume = volumes.slice(0, -1).reduce((a, b) => a + b, 0) / (volumes.length - 1);
    const volumeRatio = volume / avgVolume;
    
    // RSI
    const rsi = calculateRSI(closes);
    
    // Trend (simple moving average comparison)
    const sma3 = closes.slice(-3).reduce((a, b) => a + b, 0) / 3;
    const trend = current > sma3 ? 'UP' : 'DOWN';
    
    return {
        priceChange,
        volumeRatio,
        rsi,
        trend,
        score: 0
    };
}

function generateTradingSetup(stockData, momentum) {
    const { symbol, current, high, low, highs, lows, closes } = stockData;
    const atr = calculateATR(highs, lows, closes);
    
    // Calculate support and resistance
    const recentHighs = Math.max(...highs);
    const recentLows = Math.min(...lows);
    
    // Determine trade direction and setup
    let setup = null;
    
    // BULLISH SETUP
    if (momentum.trend === 'UP' && momentum.rsi < 70 && momentum.volumeRatio > 1.2) {
        const entry = current;
        const stopLoss = entry - (atr * 1.5);
        const target1 = entry + (atr * 2);
        const target2 = entry + (atr * 3);
        
        const risk = entry - stopLoss;
        const reward = target1 - entry;
        const riskReward = reward / risk;
        
        if (riskReward >= 1.5) {
            setup = {
                type: 'BUY',
                entry: parseFloat(entry.toFixed(2)),
                stopLoss: parseFloat(stopLoss.toFixed(2)),
                target1: parseFloat(target1.toFixed(2)),
                target2: parseFloat(target2.toFixed(2)),
                riskReward: parseFloat(riskReward.toFixed(2)),
                confidence: momentum.rsi < 50 ? 'HIGH' : 'MEDIUM'
            };
        }
    }
    
    // BEARISH SETUP (for shorting or avoiding)
    else if (momentum.trend === 'DOWN' && momentum.rsi > 30 && momentum.volumeRatio > 1.2) {
        const entry = current;
        const stopLoss = entry + (atr * 1.5);
        const target1 = entry - (atr * 2);
        const target2 = entry - (atr * 3);
        
        const risk = stopLoss - entry;
        const reward = entry - target1;
        const riskReward = reward / risk;
        
        if (riskReward >= 1.5) {
            setup = {
                type: 'SHORT',
                entry: parseFloat(entry.toFixed(2)),
                stopLoss: parseFloat(stopLoss.toFixed(2)),
                target1: parseFloat(target1.toFixed(2)),
                target2: parseFloat(target2.toFixed(2)),
                riskReward: parseFloat(riskReward.toFixed(2)),
                confidence: momentum.rsi > 50 ? 'HIGH' : 'MEDIUM'
            };
        }
    }
    
    // RANGE BOUND (avoid)
    else {
        setup = {
            type: 'AVOID',
            reason: 'No clear setup - choppy or low volume'
        };
    }
    
    return setup;
}

async function analyzeAllStocks() {
    console.log('\n' + '='.repeat(70));
    console.log('📊 DAILY STOCK RECOMMENDATIONS - INTRADAY TRADING');
    console.log('='.repeat(70));
    const now = new Date();
    console.log(`Date: ${now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`);
    console.log(`Time: ${now.toLocaleTimeString()}`);
    console.log('='.repeat(70));
    
    // Check VIX first
    console.log('\n🔍 Checking market conditions...');
    let vix = null;
    try {
        const vixData = await getDetailedStockData('^VIX');
        if (vixData) {
            vix = vixData.current;
            console.log(`VIX: ${vix.toFixed(2)}`);
        }
    } catch (error) {
        console.log('Could not fetch VIX');
    }
    
    // Analyze all stocks
    console.log(`\n📈 Analyzing ${INTRADAY_WATCHLIST.length} stocks...\n`);
    
    const opportunities = [];
    let analyzed = 0;
    
    for (const symbol of INTRADAY_WATCHLIST) {
        try {
            const stockData = await getDetailedStockData(symbol);
            if (!stockData) continue;
            
            const momentum = analyzeMomentum(stockData);
            const setup = generateTradingSetup(stockData, momentum);
            
            if (setup && setup.type !== 'AVOID') {
                opportunities.push({
                    symbol,
                    price: stockData.current,
                    change: momentum.priceChange,
                    rsi: momentum.rsi,
                    volume: momentum.volumeRatio,
                    trend: momentum.trend,
                    setup
                });
            }
            
            analyzed++;
            
            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
            // Skip failed stocks
        }
    }
    
    console.log(`✅ Analyzed ${analyzed} stocks\n`);
    
    // Sort by best opportunities (HIGH confidence first, then R:R ratio)
    opportunities.sort((a, b) => {
        if (a.setup.confidence === 'HIGH' && b.setup.confidence !== 'HIGH') return -1;
        if (a.setup.confidence !== 'HIGH' && b.setup.confidence === 'HIGH') return 1;
        return b.setup.riskReward - a.setup.riskReward;
    });
    
    // Determine if it's a good trading day
    const buySetups = opportunities.filter(o => o.setup.type === 'BUY').length;
    const shortSetups = opportunities.filter(o => o.setup.type === 'SHORT').length;
    const totalSetups = buySetups + shortSetups;
    
    console.log('='.repeat(70));
    console.log('🎯 TRADING DECISION FOR TODAY:');
    console.log('='.repeat(70));
    
    const dayOfWeek = now.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    if (isWeekend) {
        console.log('❌ MARKETS ARE CLOSED (Weekend)');
        console.log('\nNo trading today. Plan for next week.\n');
        return;
    }
    
    if (vix && vix > 30) {
        console.log('⚠️  EXTREME VOLATILITY - NOT A GOOD DAY TO TRADE');
        console.log(`VIX at ${vix.toFixed(2)} indicates high risk conditions.`);
        console.log('Recommendation: STAY OUT or use very small positions\n');
    } else if (totalSetups === 0) {
        console.log('❌ NO CLEAR SETUPS TODAY - NOT A GOOD DAY TO TRADE');
        console.log('No high-quality trading opportunities found.');
        console.log('Recommendation: STAY IN CASH and wait for better setups\n');
    } else if (totalSetups < 3) {
        console.log('⚠️  LIMITED OPPORTUNITIES - TRADE WITH CAUTION');
        console.log(`Found only ${totalSetups} setup(s) with good risk/reward.`);
        console.log('Recommendation: BE SELECTIVE, only take the best setup\n');
    } else {
        console.log('✅ GOOD DAY TO TRADE - Multiple Quality Setups Found!');
        console.log(`Found ${totalSetups} trading opportunities:`);
        console.log(`  • ${buySetups} BUY setups`);
        console.log(`  • ${shortSetups} SHORT setups`);
        console.log('\nRecommendation: TRADE with proper risk management (1-2% per trade)\n');
    }
    
    if (opportunities.length > 0) {
        console.log('='.repeat(70));
        console.log('🚀 TOP TRADING OPPORTUNITIES (Best 5):');
        console.log('='.repeat(70));
        
        const topPicks = opportunities.slice(0, 5);
        
        topPicks.forEach((opp, index) => {
            const { symbol, price, change, rsi, volume, trend, setup } = opp;
            
            console.log(`\n${index + 1}. ${symbol} - ${setup.type} Setup [${setup.confidence} Confidence]`);
            console.log('   ' + '-'.repeat(66));
            console.log(`   Current Price: $${price.toFixed(2)} (${change >= 0 ? '+' : ''}${change.toFixed(2)}%)`);
            console.log(`   Trend: ${trend} | RSI: ${rsi?.toFixed(1) || 'N/A'} | Volume: ${volume.toFixed(2)}x avg`);
            console.log('');
            console.log(`   📍 ENTRY:      $${setup.entry.toFixed(2)}`);
            console.log(`   🛑 STOP LOSS:  $${setup.stopLoss.toFixed(2)} (Risk: $${Math.abs(setup.entry - setup.stopLoss).toFixed(2)})`);
            console.log(`   🎯 TARGET 1:   $${setup.target1.toFixed(2)} (Reward: $${Math.abs(setup.target1 - setup.entry).toFixed(2)})`);
            console.log(`   🎯 TARGET 2:   $${setup.target2.toFixed(2)} (Extended: $${Math.abs(setup.target2 - setup.entry).toFixed(2)})`);
            console.log(`   💰 RISK:REWARD = 1:${setup.riskReward}`);
            
            // Position sizing example
            const accountSize = 10000; // Example account
            const riskPercent = 0.02; // 2% risk
            const riskAmount = accountSize * riskPercent;
            const riskPerShare = Math.abs(setup.entry - setup.stopLoss);
            const shares = Math.floor(riskAmount / riskPerShare);
            
            console.log('');
            console.log(`   💡 Example Position (for $10k account, 2% risk):`);
            console.log(`      Shares: ${shares} | Investment: $${(shares * setup.entry).toFixed(2)} | Risk: $${riskAmount.toFixed(2)}`);
        });
        
        console.log('\n' + '='.repeat(70));
        console.log('⚠️  TRADING RULES TO FOLLOW:');
        console.log('='.repeat(70));
        console.log('1. Wait 15-30 min after market open (9:45-10:00 AM ET)');
        console.log('2. Risk only 1-2% of your account per trade');
        console.log('3. Set stop loss IMMEDIATELY after entry');
        console.log('4. Take partial profits at Target 1 (50% position)');
        console.log('5. Move stop to breakeven when Target 1 is hit');
        console.log('6. Trail stop for remaining position to Target 2');
        console.log('7. Exit ALL positions 30 min before market close (3:30 PM ET)');
        console.log('8. If 2 consecutive stop losses, STOP trading for the day');
        console.log('9. Check economic calendar before trading');
        console.log('10. Never risk more than you can afford to lose');
        
        console.log('\n' + '='.repeat(70));
        console.log('📅 IMPORTANT NOTES:');
        console.log('='.repeat(70));
        console.log('• This is for INTRADAY trading only - close all positions today');
        console.log('• Adjust position size based on your actual account size');
        console.log('• Market conditions can change rapidly - stay alert');
        console.log('• These are suggestions, not financial advice - DYOR');
        console.log('• Paper trade first if you are new to intraday trading');
        
    } else {
        console.log('\n📊 Market Analysis Summary:');
        console.log('No strong setups detected in current market conditions.');
        console.log('This could mean:');
        console.log('  • Stocks are range-bound (choppy)');
        console.log('  • Low volume / lack of momentum');
        console.log('  • Risk/Reward ratios are unfavorable');
        console.log('\n💡 Best Action: Wait for better opportunities tomorrow.');
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('Report generated successfully! ✅');
    console.log('='.repeat(70) + '\n');
}

// Run the analysis
analyzeAllStocks().catch(error => {
    console.error('❌ Error running analysis:', error.message);
});
