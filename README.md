# LearnChemistry.in — Frontend UI Template (HTML/CSS/JS)

This is a **frontend-only** UI for a digital notes website (NEET/JEE/Class 11/12). It includes:

- Homepage (Landing)
- Product Listing (Shop)
- Product Detail
- Cart
- Checkout (Razorpay button placeholder)
- Login/Signup UI (placeholder)
- User Dashboard (purchases + order history)
- Admin UI (add product + view orders)

## Run locally

> **Important:** Navbar/Footer are loaded using `fetch()` from `/components`. This needs a local server (not `file://`).

### Option A — VS Code Live Server (recommended)
1. Open the folder in VS Code
2. Install **Live Server** extension
3. Right-click `index.html` → **Open with Live Server**

### Option B — Python http server
```bash
python -m http.server 5500
```
Then open: `http://localhost:5500/learnchemistry-ui/index.html`

## Backend integration mapping
- Homepage: `GET /products`
- Product detail: `GET /product/:id`
- Checkout: `POST /create-order`
- Payment verify: `POST /verify-payment`
- Dashboard orders: `GET /my-orders`
- Download: `GET /download/:id`

## Notes
- Cart uses `localStorage` (key: `lc_cart`).
- Checkout simulates payment and creates orders in `localStorage` (`lc_orders`).
- Replace dummy data in `assets/js/data.js` with your backend API.
