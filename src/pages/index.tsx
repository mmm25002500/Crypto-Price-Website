import Head from "next/head";
import { useEffect, useState } from "react";

const Home = () => {
  const [price, setPrice] = useState<number | null>(null);
  const [previousPrice, setPreviousPrice] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [symbols, setSymbols] = useState<string[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState<string>("BTCUSDT");

  useEffect(() => {
    // Fetch available symbols from Binance API
    const fetchSymbols = async () => {
      try {
        const response = await fetch("https://api.binance.com/api/v3/exchangeInfo");
        const data = await response.json();
        const filteredSymbols = data.symbols
          .filter((symbol: any) => symbol.status === "TRADING" && symbol.quoteAsset === "USDT")
          .map((symbol: any) => symbol.symbol);
        setSymbols(filteredSymbols);
      } catch (e) {
        setError("無法獲取幣種列表，請稍後再試。");
      }
    };

    fetchSymbols();
  }, []);

  useEffect(() => {
    if (!selectedSymbol) return;

    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${selectedSymbol.toLowerCase()}@trade`);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const currentPrice = parseFloat(data.p); // 'p' 是價格的屬性
        setPreviousPrice(price); // 將當前價格存為上一價格
        setPrice(currentPrice); // 更新最新價格
      } catch (e) {
        setError("數據解析失敗");
      }
    };

    ws.onerror = () => {
      setError("WebSocket 連線錯誤，請稍後再試。");
    };

    return () => {
      ws.close();
    };
  }, [selectedSymbol, price]);

  // 判斷價格漲跌顏色與箭頭
  const getPriceClass = () => {
    if (price !== null && previousPrice !== null) {
      return price > previousPrice ? "text-green-500" : "text-red-500";
    }
    return "";
  };

  const getArrow = () => {
    if (price !== null && previousPrice !== null) {
      return price > previousPrice ? "↑" : "↓";
    }
    return "";
  };

  return (
    <>
      <Head>
        <title>加密貨幣價格</title>
      </Head>
      <div className="min-h-screen bg-gray-200 flex flex-col items-center justify-center">
        <div className="p-6 bg-white rounded shadow-2xl text-center w-full max-w-md">
          <h1 className="text-3xl font-bold mb-4 text-btc">
            加密貨幣 {selectedSymbol.split("USDT")[0]} 的價格
          </h1>
          <div className="mb-4">
            <label htmlFor="symbol-select" className="block text-lg font-medium mb-2 text-gray-500">
              選擇幣種：
            </label>
            <select
              id="symbol-select"
              value={selectedSymbol}
              onChange={(e) => setSelectedSymbol(e.target.value)}
              className="w-full p-2 border rounded border-cyan-500 text-gray-400"
            >
              {symbols.map((symbol) => (
                <option key={symbol} value={symbol}>
                  {symbol}
                </option>
              ))}
            </select>
          </div>
          {error ? (
            <p className="text-red-500">{error}</p>
          ) : price !== null ? (
            <p className={`text-2xl font-bold flex items-center justify-center ${getPriceClass()}`}>
              ${price.toFixed(2)} <span className="ml-2">{getArrow()}</span>
            </p>
          ) : (
            <p className="text-gray-500">正在載入...</p>
          )}
          <hr className="my-4 border-gray-300" />
          <p className="text-gray-400 mt-6">組員：</p>
          <p className="text-gray-400">S1411132012 碼名字 技術提供</p>
          <p className="text-gray-400">S1411132022 碼名字 報告製作</p>
          <p className="text-gray-400">S14111320 碼名字 報告製作</p>
          <p className="text-gray-400">S14111320 碼名字 上台演講</p>
          <p className="text-gray-400">S14111320 碼名字 上台演講</p>
        </div>
      </div>
    </>
  );
};

export default Home;