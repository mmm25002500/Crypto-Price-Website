# 加密貨幣價格網站顯示 - 文檔
一個很讚的加密貨幣價格網站顯示，只 for 小組報告用。
## 使用說明
沒XD

## 網站架構
### 內部API
#### ADDR
路徑：`/api/{name}?lebel_1=val_1&label2=val_2&...`
#### 功能表
| API | Input | Output | 簡介 |
| --- | --- | --- | --- |
|  | req.query: {  } | res: {  } |  |

### 外部API
| 價格 | 加密貨幣列表 |
| -------- | -------- |
| Binance 幣安交易所 | Binance 幣安交易所 |

### 使用資源
| 內容 | 服務 |
| ---- | ---- |
| Backend Server | Vercel |
| Frontend Server | Vercel |
| Crypto Info Provider | Binance 幣安交易所 |

## Hot Reloading & Deployment
### pnpm (recommendation)
```bash
# install necessary pkg
pnpm i
# hot reloading dev
pnpm dev
# deploy & compile
pnpm build
```
### npm (Not recommended)
```bash
# install necessary pkg
npm i
# hot reloading dev
npm run dev
# deploy & compile
npm run build
```
### yarn (Not recommended)
```bash
# install necessary pkg
yarn
# hot reloading dev
yarn dev
# deploy & compile
yarn build
```