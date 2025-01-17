import Head from "next/head";
import { useEffect, useRef, useState } from "react";

// 定義 Binance API 符號類型
interface BinanceSymbol {
  symbol: string;
  status: string;
  quoteAsset: string;
}

const Home = () => {
  const [price, setPrice] = useState<number | null>(null);
  const [previousPrice, setPreviousPrice] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [symbols, setSymbols] = useState<string[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState<string>("BTCUSDT");
  const [ip, setIp] = useState<string>("");
  const [ipErr, setIpErr] = useState<string | null>(null);

  // 用來暫存最新價格，避免在 WebSocket 每次推送都 setState
  const latestPriceRef = useRef<number | null>(null);

  // 撈幣種列表
  useEffect(() => {
    const fetchSymbols = async () => {
      try {
        const response = await fetch("https://api.binance.com/api/v3/exchangeInfo");
        const data = await response.json();
        const filteredSymbols = data.symbols
          .filter((symbol: BinanceSymbol) => symbol.status === "TRADING" && symbol.quoteAsset === "USDT")
          .map((symbol: BinanceSymbol) => symbol.symbol);
        setSymbols(filteredSymbols);
      } catch {
        setError("無法獲取幣種列表，請稍後再試。");
      }
    };
    fetchSymbols();
  }, []);

  // WebSocket 即時連線，但只用 interval(0.5秒) 更新 React state
  useEffect(() => {
    if (!selectedSymbol) return;

    // 1) 連線到指定幣種的 WebSocket
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${selectedSymbol.toLowerCase()}@trade`);

    // 2) 接收最新成交價，暫存到 latestPriceRef
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const currentPrice = parseFloat(data.p); // 'p' 即最新成交價
        latestPriceRef.current = currentPrice;
      } catch {
        setError("數據解析失敗");
      }
    };

    ws.onerror = () => {
      setError("WebSocket 連線錯誤，請稍後再試。");
    };

    // 3) 每 0.5 秒讀取 latestPriceRef，才更新 React state
    const intervalId = setInterval(() => {
      if (latestPriceRef.current !== null) {
        setPreviousPrice((prev) => (price !== null ? price : prev));
        setPrice(latestPriceRef.current);
      }
    }, 500);

    // 4) 組件卸載時：關閉 interval 與 WebSocket
    return () => {
      clearInterval(intervalId);
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    };
  }, [selectedSymbol, price]);

  // 變更下拉選單，同時呼叫後端 API 通知樹莓派 (選擇性)
  const handleSymbolChange = async (newSymbol: string) => {
    try {
      setSelectedSymbol(newSymbol);

      // 此處如您所示, 呼叫後端 Flask API (假設樹莓派上 Flask 服務跑在 http://192.168.2.156:5000)
      const res = await fetch(`http://${ip}:5000/start?coin=${newSymbol}`);
      if (!res.ok) {
        setIpErr(`後端回傳錯誤碼: ${res.status}`);
      } else {
        const data = await res.json();
        console.log("後端回傳 =>", data);
      }
    } catch (err) {
      console.error(err);
      setIpErr("呼叫後端失敗，請稍後再試。");
    }
  };

  // 判斷價格漲跌顯示顏色
  const getPriceClass = () => {
    if (price !== null && previousPrice !== null) {
      return price > previousPrice ? "text-green-500" : "text-red-500";
    }
    return "";
  };

  // 判斷箭頭方向
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
              輸入ip：
            </label>
            <input
              type="text"
              id="ip"
              className=" border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 -500" placeholder="請輸入ip"
              required
              onChange={(e) => setIp(e.target.value)}
            />
            <p className="text-red-700 font-extrabold">{ ipErr }</p>

            <label htmlFor="symbol-select" className="block text-lg font-medium mb-2 text-gray-500">
              選擇幣種：
            </label>
            <select
              id="symbol-select"
              value={selectedSymbol}
              onChange={(e) => handleSymbolChange(e.target.value)}
              className="w-full p-2 border rounded border-cyan-500 text-gray-700"
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
          <p className="text-gray-400">12 技術提供</p>
          <p className="text-gray-400">22 報告製作</p>
          <p className="text-gray-400">39 報告製作</p>
          <p className="text-gray-400">27 上台演講</p>
          <p className="text-gray-400">18 上台演講</p>
        </div>
      </div>
    </>
  );
};

export default Home;
