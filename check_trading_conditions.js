/**
 * Intraday Trading Conditions Checker
 * Checks market conditions to determine if it's a good day to trade
 */

const axios = require('axios');

async function getStockData(symbol) {
    try {
        // Using Yahoo Finance API alternative
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=2d`;
        const response = await axios.get(url);
        const data = response.data.chart.result[0];
        
        const closes = data.indicators.quote[0].close;
        const volumes = data.indicators.quote[0].volume;
        
        return {
            current: closes[closes.length - 1],
            previous: closes[closes.length - 2],
            volume: volumes[volumes.length - 1]
        };
    } catch (error) {
        throw new Error(`Failed to fetch ${symbol}: ${error.message}`);
    }
}

async function checkMarketConditions() {
    console.log('='.repeat(60));
    console.log('INTRADAY TRADING CONDITIONS REPORT');
    const now = new Date();
    console.log(`Date: ${now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`);
    console.log('='.repeat(60));
    
    // 1. Check VIX (Volatility Index)
    console.log('\n📊 VOLATILITY CHECK (VIX):');
    try {
        const vixData = await getStockData('^VIX');
        const currentVix = vixData.current;
        const prevVix = vixData.previous;
        const vixChange = currentVix - prevVix;
        
        console.log(`   Current VIX: ${currentVix.toFixed(2)}`);
        console.log(`   Change: ${vixChange >= 0 ? '+' : ''}${vixChange.toFixed(2)}`);
        
        if (currentVix < 15) {
            console.log('   ✅ LOW volatility - Good for trend following');
        } else if (currentVix < 20) {
            console.log('   ⚠️  MODERATE volatility - Normal trading conditions');
        } else if (currentVix < 30) {
            console.log('   ⚠️  HIGH volatility - Use smaller positions');
        } else {
            console.log('   ❌ EXTREME volatility - Consider sitting out');
        }
    } catch (error) {
        console.log(`   ❌ Error fetching VIX: ${error.message}`);
    }
    
    // 2. Check Major Indices
    console.log('\n📈 MARKET INDICES:');
    const indices = {
        'S&P 500': '^GSPC',
        'NASDAQ': '^IXIC',
        'DOW': '^DJI'
    };
    
    for (const [name, symbol] of Object.entries(indices)) {
        try {
            const data = await getStockData(symbol);
            const changePct = ((data.current - data.previous) / data.previous) * 100;
            const arrow = changePct > 0 ? '🟢' : '🔴';
            
            console.log(`   ${name}: ${data.current.toFixed(2)} (${changePct >= 0 ? '+' : ''}${changePct.toFixed(2)}%) ${arrow}`);
        } catch (error) {
            console.log(`   ${name}: Error - ${error.message}`);
        }
    }
    
    // 3. Check SPY for reference
    console.log('\n🌅 MARKET CHECK (SPY):');
    try {
        const spyData = await getStockData('SPY');
        console.log(`   SPY Price: $${spyData.current.toFixed(2)}`);
        console.log(`   Volume: ${spyData.volume.toLocaleString()}`);
        console.log('   ✅ Market data available');
    } catch (error) {
        console.log(`   ⚠️  SPY check: ${error.message}`);
    }
    
    // 4. Check if it's a trading day
    console.log('\n📅 TRADING DAY CHECK:');
    const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
    const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });
    
    if (dayOfWeek === 0 || dayOfWeek === 6) {
        console.log(`   ❌ ${dayName} - Markets are CLOSED`);
    } else {
        console.log(`   ✅ ${dayName} - Markets are OPEN`);
        
        if (dayOfWeek === 1) {
            console.log('   ⚠️  Monday - Often choppy, wait for direction');
        } else if (dayOfWeek === 5) {
            console.log('   ⚠️  Friday - Possible early exits, position squaring');
        } else {
            console.log('   ✅ Mid-week - Generally good trading conditions');
        }
    }
    
    // 5. Economic Calendar Warning
    console.log('\n📰 ECONOMIC EVENTS:');
    console.log('   ⚠️  Check manually:');
    console.log('   • investing.com/economic-calendar');
    console.log('   • forexfactory.com');
    console.log('   • Your broker\'s economic calendar');
    console.log('   Watch for: FOMC, NFP, CPI, Earnings');
    
    // 6. Trading Recommendation
    console.log('\n' + '='.repeat(60));
    console.log('RECOMMENDATION:');
    console.log('='.repeat(60));
    
    try {
        const vixData = await getStockData('^VIX');
        const currentVix = vixData.current;
        
        if (currentVix < 20 && dayOfWeek > 0 && dayOfWeek < 6) {
            console.log('✅ CONDITIONS LOOK FAVORABLE for intraday trading');
            console.log('   • Use proper risk management (1-2% per trade)');
            console.log('   • Wait 15-30 min after market open');
            console.log('   • Check economic calendar before trading');
        } else if (currentVix < 30) {
            console.log('⚠️  TRADE WITH CAUTION');
            console.log('   • Reduce position sizes');
            console.log('   • Use wider stops');
            console.log('   • Be prepared for whipsaws');
        } else {
            console.log('❌ HIGH RISK CONDITIONS - Consider sitting out');
            console.log('   • Volatility is extreme');
            console.log('   • Wait for calmer markets');
        }
    } catch {
        console.log('⚠️  Review conditions above before trading');
    }
    
    console.log('\n' + '='.repeat(60));
}

// Run the checker
checkMarketConditions().catch(error => {
    console.error('Error running market conditions check:', error.message);
});
