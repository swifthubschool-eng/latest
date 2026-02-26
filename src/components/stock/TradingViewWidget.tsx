"use client";

import { useEffect, useRef, memo } from "react";

function TradingViewWidget({ symbol }: { symbol: string }) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;
    container.current.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      "autosize": true,
      "symbol":
        symbol === "NIFTY 50" ? "NIFTY" :
          symbol === "SENSEX" ? "SENSEX" :
            symbol === "NIFTY BANK" ? "BANKNIFTY" :
              symbol === "NIFTY FIN SERVICE" ? "FINNIFTY" :
                symbol === "NIFTY 500" ? "NIFTY500" :
                  `NSE:${symbol}`, // Force NSE for equity symbols to avoid ambiguity (e.g. IOC -> Itochu)
      "interval": "D",
      "timezone": "Asia/Kolkata",
      "theme": "dark",
      "style": "1",
      "locale": "en",
      "enable_publishing": false,
      "allow_symbol_change": true,
      "calendar": false,
      "support_host": "https://www.tradingview.com"
    });

    container.current.appendChild(script);
  }, [symbol]);

  return (
    <div className="tradingview-widget-container" ref={container} style={{ height: "100%", width: "100%" }}>
      <div className="tradingview-widget-container__widget" style={{ height: "100%", width: "100%" }}></div>
    </div>
  );
}

export default memo(TradingViewWidget);
