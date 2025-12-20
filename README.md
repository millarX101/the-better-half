# The Better Half 💍

An AI chatbot that gives you relationship-style advice — the brutal honesty, the "I told you so", the eye-rolls — without the argument afterwards.

> "Your partner was right. Again."

## The Concept

Everyone knows that feeling when your partner gives you that look. The one that says "I told you this would happen." This app captures that universal relationship dynamic and turns it into actually helpful (if slightly painful) advice.

**Unisex, universal, relatable.** Works for any relationship — straight, gay, any combo. The humour is universal because *all* partners do this.

## Characters

| Persona | Vibe | Classic Line |
|---------|------|--------------|
| **The Realist** | Seen your shit before, zero patience left | "Babe. We both know how this ends." |
| **The Nurturer** | Disappointed, not angry (somehow worse) | "I'm not mad, I'm just... disappointed." |
| **The Scorekeeper** | Remembers everything since 2019 | "This is just like that time you..." |
| **Zyx-9** | Alien horrified by human relationships | "You commit to ONE mate? For DECADES?" |

## Personality Sliders

Users can customise their experience:

| Slider | Min | Max |
|--------|-----|-----|
| **Savagery** | Gentle Nudge | No Mercy |
| **Honesty** | Tell Me What I Want | Truth Hurts |
| **Language** | Polished | Full Bogan* |
| **Vibe** | Tradie Energy | Champagne Problems |

*Maximum crassness (f-bombs, c-bombs) requires premium subscription

## Monetization

### Swearing Tiers
- **Free:** shit, arsehole, dickhead, bastard, bloody hell
- **Premium ($5/mo):** fuck, cunt, and absolutely no filter

### Rate Limits
| Tier | Messages/Day |
|------|-------------|
| Anonymous | 5 |
| Free (signed in) | 20 |
| Premium | Unlimited + full swearing |

## Tech Stack

- **Frontend:** Vite + React 18 + Tailwind CSS
- **Backend:** Node.js + Express
- **Database:** Supabase (Auth + PostgreSQL)
- **AI:** Claude API (Anthropic)
- **Hosting:** Netlify (frontend) + Render (backend)

## Project Structure

```
toxic-hottie/
├── client/                 # Vite React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── hooks/          # Custom hooks (auth)
│   │   └── lib/            # Supabase client
│   └── public/             # Static assets
│
└── server/                 # Express backend
    ├── index.js            # Main server file
    └── supabase-schema.sql # Database schema
```

## Setup

### 1. Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the contents of `server/supabase-schema.sql`
3. Enable Email auth in Authentication → Providers
4. Get your project URL and keys from Settings → API

### 2. Backend Setup

```bash
cd server
cp .env.example .env
# Fill in your environment variables
npm install
npm run dev
```

### 3. Frontend Setup

```bash
cd client
cp .env.example .env
# Fill in your Supabase credentials
npm install
npm run dev
```

### 4. Environment Variables

**Server (.env):**
```
ANTHROPIC_API_KEY=your_anthropic_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_role_key
PORT=3001
CLIENT_URL=http://localhost:5173
```

**Client (.env):**
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## Rate Limiting

| Tier | Messages/Day |
|------|-------------|
| Anonymous | 5 |
| Free (signed in) | 20 |
| Premium ($5-10/mo) | Unlimited |

## Deployment

### Backend (Render)

1. Create a new Web Service on Render
2. Connect your GitHub repo
3. Set root directory to `server`
4. Build command: `npm install`
5. Start command: `npm start`
6. Add environment variables

### Frontend (Netlify)

1. Create a new site on Netlify
2. Connect your GitHub repo
3. Set base directory to `client`
4. Build command: `npm run build`
5. Publish directory: `dist`
6. Add environment variables

## Adding Stripe (TODO)

For premium subscriptions:

1. Create Stripe account
2. Set up Products and Pricing
3. Implement Stripe Checkout on the client
4. Add webhook handler on the server to update `is_premium` in `user_usage` table

## Character Prompt Tips

The magic is in the system prompts. Key elements:

- **Consistent personality traits** - Each character has specific quirks
- **Casual swearing** - Keeps it real and funny
- **Backhanded helpfulness** - Actually useful advice wrapped in narcissism
- **Self-references** - Everything circles back to how hot they are
- **Catchphrases** - "Oh honey...", "It's giving...", "By the moons of Kepler..."

## Contributing

Feel free to add more characters, improve the prompts, or add features. Just keep it funny and relatively harmless.

## License

MIT - Go wild, gorgeous.
