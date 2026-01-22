/**
 * Daily Stock Recommendations for INDIAN STOCK MARKET (NSE/BSE)
 * Provides specific trading opportunities for intraday trading
 */

const axios = require('axios');

// Popular liquid Indian stocks for intraday trading
// Format: SYMBOL.NS (NSE) or SYMBOL.BO (BSE)
const INDIAN_INTRADAY_WATCHLIST = [
    // Nifty 50 Blue Chips
    'RELIANCE.NS',    // Reliance Industries
    'TCS.NS',         // Tata Consultancy Services
    'INFY.NS',        // Infosys
    'HINDUNILVR.NS',  // Hindustan Unilever
    'ITC.NS',         // ITC Limited
    'BHARTIARTL.NS',  // Bharti Airtel
    
    // Bank Nifty Stocks (High Volume Banking Sector)
    'HDFCBANK.NS',    // HDFC Bank
    'ICICIBANK.NS',   // ICICI Bank
    'SBIN.NS',        // State Bank of India
    'KOTAKBANK.NS',   // Kotak Mahindra Bank
    'AXISBANK.NS',    // Axis Bank
    'INDUSINDBK.NS',  // IndusInd Bank
    'BANDHANBNK.NS',  // Bandhan Bank
    'BANKBARODA.NS',  // Bank of Baroda
    'PNB.NS',         // Punjab National Bank
    'FEDERALBNK.NS',  // Federal Bank
    'IDFCFIRSTB.NS',  // IDFC First Bank
    'AUBANK.NS',      // AU Small Finance Bank
    
    // High Volume Tech Stocks
    'WIPRO.NS',       // Wipro
    'TECHM.NS',       // Tech Mahindra
    'HCLTECH.NS',     // HCL Technologies
    
    // Popular Trading Stocks
    'TATAMOTORS.NS',  // Tata Motors
    'TATASTEEL.NS',   // Tata Steel
    'ADANIPORTS.NS',  // Adani Ports
    'BAJFINANCE.NS',  // Bajaj Finance
    'LT.NS',          // Larsen & Toubro
    'MARUTI.NS',      // Maruti Suzuki
    
    // Indices
    '^NSEI',          // Nifty 50
    '^BSESN',         // Sensex
    '^NSEBANK'        // Bank Nifty Index
];

async function getDetailedStockData(symbol) {
    try {
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
    
    const priceChange = ((current - prevClose) / prevClose) * 100;
    const avgVolume = volumes.slice(0, -1).reduce((a, b) => a + b, 0) / (volumes.length - 1);
    const volumeRatio = volume / avgVolume;
    const rsi = calculateRSI(closes);
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
    
    // BEARISH SETUP
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
    
    else {
        setup = {
            type: 'AVOID',
            reason: 'No clear setup - choppy or low volume'
        };
    }
    
    return setup;
}

function getStockName(symbol) {
    const names = {
        'RELIANCE.NS': 'Reliance Industries',
        'TCS.NS': 'TCS',
        'INFY.NS': 'Infosys',
        'HINDUNILVR.NS': 'HUL',
        'ITC.NS': 'ITC',
        'BHARTIARTL.NS': 'Bharti Airtel',
        // Bank Nifty Stocks
        'HDFCBANK.NS': 'HDFC Bank',
        'ICICIBANK.NS': 'ICICI Bank',
        'SBIN.NS': 'SBI',
        'KOTAKBANK.NS': 'Kotak Bank',
        'AXISBANK.NS': 'Axis Bank',
        'INDUSINDBK.NS': 'IndusInd Bank',
        'BANDHANBNK.NS': 'Bandhan Bank',
        'BANKBARODA.NS': 'Bank of Baroda',
        'PNB.NS': 'PNB',
        'FEDERALBNK.NS': 'Federal Bank',
        'IDFCFIRSTB.NS': 'IDFC First Bank',
        'AUBANK.NS': 'AU Small Finance',
        // Tech Stocks
        'WIPRO.NS': 'Wipro',
        'TECHM.NS': 'Tech Mahindra',
        'HCLTECH.NS': 'HCL Tech',
        // Other Stocks
        'TATAMOTORS.NS': 'Tata Motors',
        'TATASTEEL.NS': 'Tata Steel',
        'ADANIPORTS.NS': 'Adani Ports',
        'BAJFINANCE.NS': 'Bajaj Finance',
        'LT.NS': 'L&T',
        'MARUTI.NS': 'Maruti Suzuki',
        // Indices
        '^NSEI': 'Nifty 50',
        '^BSESN': 'Sensex',
        '^NSEBANK': 'Bank Nifty'
    };
    return names[symbol] || symbol.replace('.NS', '').replace('.BO', '');
}

async function analyzeAllStocks() {
    console.log('\n' + '='.repeat(70));
    console.log('📊 INDIAN STOCK MARKET - INTRADAY TRADING RECOMMENDATIONS');
    console.log('='.repeat(70));
    const now = new Date();
    const istTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    console.log(`Date: ${istTime.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`);
    console.log(`Time: ${istTime.toLocaleTimeString('en-IN')} IST`);
    console.log('='.repeat(70));
    
    // Check India VIX
    console.log('\n🔍 Checking market conditions...');
    let indiaVix = null;
    try {
        const vixData = await getDetailedStockData('^INDIAVIX');
        if (vixData) {
            indiaVix = vixData.current;
            console.log(`India VIX: ${indiaVix.toFixed(2)}`);
        }
    } catch (error) {
        console.log('Could not fetch India VIX');
    }
    
    // Check Nifty 50
    try {
        const niftyData = await getDetailedStockData('^NSEI');
        if (niftyData) {
            const niftyChange = ((niftyData.current - niftyData.prevClose) / niftyData.prevClose) * 100;
            console.log(`Nifty 50: ${niftyData.current.toFixed(2)} (${niftyChange >= 0 ? '+' : ''}${niftyChange.toFixed(2)}%)`);
        }
    } catch (error) {
        console.log('Could not fetch Nifty data');
    }
    
    // Check Bank Nifty
    try {
        const bankNiftyData = await getDetailedStockData('^NSEBANK');
        if (bankNiftyData) {
            const bankNiftyChange = ((bankNiftyData.current - bankNiftyData.prevClose) / bankNiftyData.prevClose) * 100;
            console.log(`Bank Nifty: ${bankNiftyData.current.toFixed(2)} (${bankNiftyChange >= 0 ? '+' : ''}${bankNiftyChange.toFixed(2)}%)`);
        }
    } catch (error) {
        console.log('Could not fetch Bank Nifty data');
    }
    
    console.log(`\n📈 Analyzing ${INDIAN_INTRADAY_WATCHLIST.length} Indian stocks...\n`);
    
    const opportunities = [];
    let analyzed = 0;
    
    for (const symbol of INDIAN_INTRADAY_WATCHLIST) {
        try {
            const stockData = await getDetailedStockData(symbol);
            if (!stockData) continue;
            
            const momentum = analyzeMomentum(stockData);
            const setup = generateTradingSetup(stockData, momentum);
            
            if (setup && setup.type !== 'AVOID') {
                opportunities.push({
                    symbol,
                    name: getStockName(symbol),
                    price: stockData.current,
                    change: momentum.priceChange,
                    rsi: momentum.rsi,
                    volume: momentum.volumeRatio,
                    trend: momentum.trend,
                    setup
                });
            }
            
            analyzed++;
            await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
            // Skip failed stocks
        }
    }
    
    console.log(`✅ Analyzed ${analyzed} stocks\n`);
    
    opportunities.sort((a, b) => {
        if (a.setup.confidence === 'HIGH' && b.setup.confidence !== 'HIGH') return -1;
        if (a.setup.confidence !== 'HIGH' && b.setup.confidence === 'HIGH') return 1;
        return b.setup.riskReward - a.setup.riskReward;
    });
    
    const buySetups = opportunities.filter(o => o.setup.type === 'BUY').length;
    const shortSetups = opportunities.filter(o => o.setup.type === 'SHORT').length;
    const totalSetups = buySetups + shortSetups;
    
    console.log('='.repeat(70));
    console.log('🎯 TRADING DECISION FOR TODAY:');
    console.log('='.repeat(70));
    
    const dayOfWeek = istTime.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    if (isWeekend) {
        console.log('❌ MARKETS ARE CLOSED (Weekend)');
        console.log('\nNo trading today. Plan for next week.\n');
        return;
    }
    
    if (indiaVix && indiaVix > 25) {
        console.log('⚠️  HIGH VOLATILITY - TRADE WITH CAUTION');
        console.log(`India VIX at ${indiaVix.toFixed(2)} indicates elevated risk.`);
        console.log('Recommendation: Reduce position sizes or stay out\n');
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
            const { symbol, name, price, change, rsi, volume, trend, setup } = opp;
            
            console.log(`\n${index + 1}. ${name} (${symbol.replace('.NS', '').replace('.BO', '')}) - ${setup.type} Setup [${setup.confidence} Confidence]`);
            console.log('   ' + '-'.repeat(66));
            console.log(`   Current Price: ₹${price.toFixed(2)} (${change >= 0 ? '+' : ''}${change.toFixed(2)}%)`);
            console.log(`   Trend: ${trend} | RSI: ${rsi?.toFixed(1) || 'N/A'} | Volume: ${volume.toFixed(2)}x avg`);
            console.log('');
            console.log(`   📍 ENTRY:      ₹${setup.entry.toFixed(2)}`);
            console.log(`   🛑 STOP LOSS:  ₹${setup.stopLoss.toFixed(2)} (Risk: ₹${Math.abs(setup.entry - setup.stopLoss).toFixed(2)})`);
            console.log(`   🎯 TARGET 1:   ₹${setup.target1.toFixed(2)} (Reward: ₹${Math.abs(setup.target1 - setup.entry).toFixed(2)})`);
            console.log(`   🎯 TARGET 2:   ₹${setup.target2.toFixed(2)} (Extended: ₹${Math.abs(setup.target2 - setup.entry).toFixed(2)})`);
            console.log(`   💰 RISK:REWARD = 1:${setup.riskReward}`);
            
            // Position sizing for Indian market (₹1,00,000 = 1 Lakh account)
            const accountSize = 100000; // ₹1 Lakh
            const riskPercent = 0.02; // 2% risk
            const riskAmount = accountSize * riskPercent;
            const riskPerShare = Math.abs(setup.entry - setup.stopLoss);
            const shares = Math.floor(riskAmount / riskPerShare);
            
            console.log('');
            console.log(`   💡 Example Position (for ₹1 Lakh account, 2% risk):`);
            console.log(`      Shares: ${shares} | Investment: ₹${(shares * setup.entry).toFixed(2)} | Risk: ₹${riskAmount.toFixed(2)}`);
        });
        
        console.log('\n' + '='.repeat(70));
        console.log('⚠️  INDIAN MARKET TRADING RULES:');
        console.log('='.repeat(70));
        console.log('1. Wait 15-30 min after market open (9:30-10:00 AM IST)');
        console.log('2. Risk only 1-2% of your capital per trade');
        console.log('3. Set stop loss IMMEDIATELY after entry');
        console.log('4. Take partial profits at Target 1 (50% position)');
        console.log('5. Move stop to breakeven when Target 1 is hit');
        console.log('6. Trail stop for remaining position to Target 2');
        console.log('7. Exit ALL positions by 3:15 PM IST (before market close)');
        console.log('8. If 2 consecutive stop losses, STOP trading for the day');
        console.log('9. Check for major news/events before trading');
        console.log('10. Be aware of GST/STT/brokerage charges in your P&L');
        
        console.log('\n' + '='.repeat(70));
        console.log('📅 IMPORTANT FOR INDIAN TRADERS:');
        console.log('='.repeat(70));
        console.log('• Market Hours: 9:15 AM - 3:30 PM IST');
        console.log('• This is for INTRADAY trading - square off all positions today');
        console.log('• Use MIS (Intraday) order type for better margin');
        console.log('• Check for circuit filters and stock-specific news');
        console.log('• Consider STT, brokerage, and GST in your calculations');
        console.log('• Paper trade first if new to intraday trading');
        
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
