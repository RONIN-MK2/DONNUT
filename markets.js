let chart1Data = [];
let chart3Data = [];
let usdData = [];
let eurData = [];
let cnyData = [];

const CHART1_POINTS = 30;
const CHART3_POINTS = 40;
const CURRENCY_POINTS = 25;

let chart1Initial = 3250;
let usdInitial = 92.5;
let eurInitial = 100.2;
let cnyInitial = 12.8;

function generateInitialData(initial, points, volatility, trend) {
    let data = [initial];
    for (let i = 1; i < points; i++) {
        let change = (Math.random() - 0.5) * volatility;
        change += trend;
        let next = data[i-1] + change;
        if (next < 0) next = data[i-1] * 0.98;
        data.push(parseFloat(next.toFixed(2)));
    }
    return data;
}

function updateDataWithNewPoint(data, volatility, trend, min = 0) {
    let last = data[data.length - 1];
    let change = (Math.random() - 0.5) * volatility + trend;
    let next = last + change;
    if (next < min) next = last * 0.995;
    data.push(parseFloat(next.toFixed(2)));
    if (data.length > data.maxLength) data.shift();
    return data;
}

chart1Data = generateInitialData(chart1Initial, CHART1_POINTS, 35, 2.5);
chart1Data.maxLength = CHART1_POINTS;

chart3Data = generateInitialData(100, CHART3_POINTS, 2.8, 1.2);
chart3Data.maxLength = CHART3_POINTS;

usdData = generateInitialData(usdInitial, CURRENCY_POINTS, 0.8, 0.1);
usdData.maxLength = CURRENCY_POINTS;
eurData = generateInitialData(eurInitial, CURRENCY_POINTS, 0.9, 0.08);
eurData.maxLength = CURRENCY_POINTS;
cnyData = generateInitialData(cnyInitial, CURRENCY_POINTS, 0.1, 0.02);
cnyData.maxLength = CURRENCY_POINTS;

const CBR_JSON_URL = 'https://www.cbr-xml-daily.com/daily_json.js';

let liveCurrencyCache = {
    usd: 92.5,
    eur: 100.2,
    cny: 12.8,
    updated: null
};

async function fetchLiveCurrencyRates() {
    try {
        const response = await fetch(CBR_JSON_URL);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();

        const usdRate = data.Valute?.USD?.Value;
        const eurRate = data.Valute?.EUR?.Value;
        const cnyRate = data.Valute?.CNY?.Value;

        if (usdRate && eurRate && cnyRate) {
            liveCurrencyCache = {
                usd: usdRate,
                eur: eurRate,
                cny: cnyRate,
                updated: new Date().toISOString()
            };

            if (usdData.length > 0) {
                usdData[usdData.length - 1] = usdRate;
            }
            if (eurData.length > 0) {
                eurData[eurData.length - 1] = eurRate;
            }
            if (cnyData.length > 0) {
                cnyData[cnyData.length - 1] = cnyRate;
            }
        }
    } catch (err) {
        console.warn('Не удалось обновить курсы из ЦБ РФ, используется демо-режим:', err.message);
    }
}

function drawLineChart(ctx, data, width, height, color, fillGradient = true, tension = 0.3) {
    const padding = { top: 20, right: 20, bottom: 30, left: 50 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const maxVal = Math.max(...data) * 1.1;
    const minVal = Math.min(...data) * 0.9;
    const range = maxVal - minVal;

    const points = data.map((value, index) => ({
        x: padding.left + (index / (data.length - 1)) * chartWidth,
        y: padding.top + chartHeight - ((value - minVal) / range) * chartHeight
    }));

    ctx.clearRect(0, 0, width, height);

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    if (tension > 0) {
        for (let i = 0; i < points.length - 1; i++) {
            const p0 = points[i];
            const p1 = points[i + 1];
            const cp1 = { x: p0.x + (p1.x - p0.x) * tension, y: p0.y };
            const cp2 = { x: p1.x - (p1.x - p0.x) * tension, y: p1.y };
            ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, p1.x, p1.y);
        }
    } else {
        points.forEach(p => ctx.lineTo(p.x, p.y));
    }

    if (fillGradient) {
        const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
        gradient.addColorStop(0, color + '40');
        gradient.addColorStop(1, color + '00');
        ctx.lineTo(points[points.length-1].x, height - padding.bottom);
        ctx.lineTo(points[0].x, height - padding.bottom);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();
    }

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    if (tension > 0) {
        for (let i = 0; i < points.length - 1; i++) {
            const p0 = points[i];
            const p1 = points[i + 1];
            const cp1 = { x: p0.x + (p1.x - p0.x) * tension, y: p0.y };
            const cp2 = { x: p1.x - (p1.x - p0.x) * tension, y: p1.y };
            ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, p1.x, p1.y);
        }
    } else {
        points.forEach(p => ctx.lineTo(p.x, p.y));
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.fillStyle = color;
    points.forEach((p, idx) => {
        if (idx % 3 === 0 || idx === points.length-1) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 3, 0, 2 * Math.PI);
            ctx.shadowColor = color;
            ctx.shadowBlur = 8;
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    });
}

function drawBarChart(ctx, data, labels, width, height, colors) {
    const padding = { top: 20, right: 20, bottom: 40, left: 50 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    const barWidth = (chartWidth / data.length) * 0.7;
    const spacing = (chartWidth / data.length) * 0.3;

    ctx.clearRect(0, 0, width, height);

    const maxVal = Math.max(...data) * 1.2;

    data.forEach((value, i) => {
        const barHeight = (value / maxVal) * chartHeight;
        const x = padding.left + i * (barWidth + spacing);
        const y = height - padding.bottom - barHeight;

        const gradient = ctx.createLinearGradient(x, y, x + barWidth, y + barHeight);
        gradient.addColorStop(0, colors[i % colors.length]);
        gradient.addColorStop(1, colors[i % colors.length] + '80');
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barWidth, barHeight);

        ctx.fillStyle = '#e6e9f0';
        ctx.font = '11px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(labels[i], x + barWidth/2, height - padding.bottom + 20);
    });
}

function redrawAllCharts() {
    const canvas1 = document.getElementById('chart1');
    if (canvas1) {
        const ctx = canvas1.getContext('2d');
        const w = canvas1.width = canvas1.offsetWidth || 600;
        const h = canvas1.height = 250;
        drawLineChart(ctx, chart1Data, w, h, '#d4af37', true, 0.3);
        const last = chart1Data[chart1Data.length-1];
        const prev = chart1Data[chart1Data.length-2];
        const change = ((last - prev) / prev * 100).toFixed(2);
        const badge = document.getElementById('chart1-badge');
        if (badge) {
            badge.textContent = (change >= 0 ? '+' : '') + change + '%';
            badge.className = 'badge-change ' + (change >= 0 ? 'positive' : 'negative');
        }
        document.getElementById('ticker-index').textContent = last.toFixed(2);
        const tickerChange = document.getElementById('ticker-index-change');
        tickerChange.textContent = (change >= 0 ? '+' : '') + change + '%';
        tickerChange.className = change >= 0 ? 'positive' : 'negative';
    }

    const canvas2 = document.getElementById('chart2');
    if (canvas2) {
        const ctx = canvas2.getContext('2d');
        const w = canvas2.width = canvas2.offsetWidth || 600;
        const h = canvas2.height = 250;
        const sectorData = [34, 28, 22, 16];
        const sectorLabels = ['Тех', 'Недв', 'Энерг', 'Прочее'];
        const sectorColors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
        drawBarChart(ctx, sectorData, sectorLabels, w, h, sectorColors);
    }

    const canvas3 = document.getElementById('chart3');
    if (canvas3) {
        const ctx = canvas3.getContext('2d');
        const w = canvas3.width = canvas3.offsetWidth || 900;
        const h = canvas3.height = 250;
        drawLineChart(ctx, chart3Data, w, h, '#4ade80', true, 0.3);
        const last = chart3Data[chart3Data.length-1];
        const first = chart3Data[0];
        const totalChange = ((last - first) / first * 100).toFixed(1);
        const badge = document.getElementById('chart3-badge');
        if (badge) {
            badge.textContent = (totalChange >= 0 ? '+' : '') + totalChange + '%';
            badge.className = 'badge-change ' + (totalChange >= 0 ? 'positive' : 'negative');
        }
    }

    const canvas4 = document.getElementById('chart4');
    if (canvas4) {
        const ctx = canvas4.getContext('2d');
        const w = canvas4.width = canvas4.offsetWidth || 600;
        const h = canvas4.height = 250;
        drawLineChart(ctx, usdData, w, h, '#f87171', false, 0.2);
        drawLineChart(ctx, eurData, w, h, '#60a5fa', false, 0.2);
        drawLineChart(ctx, cnyData, w, h, '#fbbf24', false, 0.2);

        const usdLast = usdData[usdData.length-1];
        const eurLast = eurData[eurData.length-1];
        const cnyLast = cnyData[cnyData.length-1];
        document.getElementById('ticker-usd').textContent = usdLast.toFixed(2);
        document.getElementById('ticker-eur').textContent = eurLast.toFixed(2);
        document.getElementById('ticker-cny').textContent = cnyLast.toFixed(2);

        const usdChange = ((usdLast - usdData[usdData.length-2]) / usdData[usdData.length-2] * 100).toFixed(2);
        const eurChange = ((eurLast - eurData[eurData.length-2]) / eurData[eurData.length-2] * 100).toFixed(2);
        const cnyChange = ((cnyLast - cnyData[cnyData.length-2]) / cnyData[cnyData.length-2] * 100).toFixed(2);

        const usdEl = document.getElementById('ticker-usd-change');
        usdEl.textContent = (usdChange >= 0 ? '+' : '') + usdChange + '%';
        usdEl.className = usdChange >= 0 ? 'positive' : 'negative';
        const eurEl = document.getElementById('ticker-eur-change');
        eurEl.textContent = (eurChange >= 0 ? '+' : '') + eurChange + '%';
        eurEl.className = eurChange >= 0 ? 'positive' : 'negative';
        const cnyEl = document.getElementById('ticker-cny-change');
        cnyEl.textContent = (cnyChange >= 0 ? '+' : '') + cnyChange + '%';
        cnyEl.className = cnyChange >= 0 ? 'positive' : 'negative';
    }

    const oilPrice = 82.34 + (Math.random() - 0.5) * 1.5;
    document.getElementById('ticker-oil').textContent = oilPrice.toFixed(2);
    const oilChange = ((Math.random() - 0.3) * 1.2).toFixed(2);
    const oilEl = document.getElementById('ticker-oil-change');
    oilEl.textContent = (oilChange >= 0 ? '+' : '') + oilChange + '%';
    oilEl.className = oilChange >= 0 ? 'positive' : 'negative';
}

function updateMarketData() {
    chart1Data = updateDataWithNewPoint(chart1Data, 30, 2.0);
    chart3Data = updateDataWithNewPoint(chart3Data, 2.5, 1.0);
    usdData = updateDataWithNewPoint(usdData, 0.7, 0.05);
    eurData = updateDataWithNewPoint(eurData, 0.8, 0.03);
    cnyData = updateDataWithNewPoint(cnyData, 0.12, 0.01);

    redrawAllCharts();
}

window.addEventListener('load', async () => {
    await fetchLiveCurrencyRates();
    redrawAllCharts();
    setInterval(fetchLiveCurrencyRates, 3600000);
    setInterval(updateMarketData, 3000);
});

const revealElements = document.querySelectorAll('[data-reveal]');
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
        }
    });
}, { threshold: 0.1 });
revealElements.forEach(el => observer.observe(el));

document.querySelectorAll('.chart-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = (y - centerY) / 30;
        const rotateY = (centerX - x) / 30;
        card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
    });
    card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(800px) rotateX(0) rotateY(0) translateY(0)';
    });
});