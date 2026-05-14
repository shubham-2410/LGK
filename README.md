# Local Goa Kayaking

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Create your `.env` file**
   ```bash
   cp .env.example .env
   ```
   Then fill in your `DATABASE_URL` and other values.

3. **Push database schema**
   ```bash
   npm run db:push
   ```

4. **Run in development** (frontend + backend on port 5000)
   ```bash
   npm run dev
   ```
   Open http://localhost:5000

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server (frontend + backend) |
| `npm run build` | Build for production |
| `npm start` | Run production build |
| `npm run db:push` | Push schema to database |

## File Uploads

By default uploads are stored locally in `public/uploads/`.  
You can change this in the admin Settings → Storage to use Google Drive or cPanel FTP.
