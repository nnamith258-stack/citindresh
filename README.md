# AgriSmart Prototype

AgriSmart is a market and produce-price prototype. It includes a Node.js backend, a market-prices page, a farmer marketplace, and a local SQLite database.

## Requirements

- Node.js 24 or newer
- Visual Studio Code

This project uses Node's built-in `node:sqlite` module, so no npm packages need to be installed.

## Run In VS Code

1. Open VS Code.
2. Open this folder:

   ```text
   C:\Users\nnami_9itp2db\OneDrive\Desktop\agrismart
   ```

3. Open the VS Code terminal.
4. Run:

   ```powershell
   node --no-warnings server.js
   ```

5. Open:

   ```text
   http://localhost:3000
   ```

Keep the terminal running while using the app.

## Run With VS Code Debugger

1. Open the Run and Debug panel.    
2. Choose `Run AgriSmart Backend (No Warnings)`.
3. Press `F5`.
4. Open `http://localhost:3000`.

## Run With Task

Use `Terminal > Run Task... > Start AgriSmart`.

## Project Files

- `index.html` - frontend UI
- `server.js` - backend API and static file server
- `data/agrismart.sqlite` - local SQLite database
- `start-agrismart.bat` - Windows double-click runner
- `.vscode/launch.json` - VS Code debugger setup
- `.vscode/tasks.json` - VS Code task setup

## Main API Routes

- `GET /api/health`
- `GET /api/market`
- `GET /api/price-trend`
- `GET /api/listings`
- `POST /api/listings`
- `GET /api/orders`
- `POST /api/orders`

Market prices and forecasts are sample demo data. Verify current prices with your local mandi before making a sale.
