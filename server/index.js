import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import rateLimit from 'express-rate-limit';
import Stripe from 'stripe';

dotenv.config();

// Initialize Stripe (optional - only if keys are provided)
const stripe = process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== 'sk_test_xxxxx'
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

// Validate required environment variables
const requiredEnvVars = ['OPENROUTER_API_KEY', 'SUPABASE_URL', 'SUPABASE_SERVICE_KEY'];
const missingEnvVars = requiredEnvVars.filter(v => !process.env[v]);
if (missingEnvVars.length > 0) {
  console.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  console.error('Please check your .env file');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3001;

// OpenRouter configuration
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
// Llama 3.1 70B - fast, smart, witty, less restricted, great for Aussie banter
const AI_MODEL = 'meta-llama/llama-3.1-70b-instruct';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

// Use raw body for Stripe webhook, JSON for everything else
app.use((req, res, next) => {
  if (req.originalUrl === '/api/webhook') {
    express.raw({ type: 'application/json' })(req, res, next);
  } else {
    express.json()(req, res, next);
  }
});

// Character personas
const PERSONAS = {
  partner: {
    name: "Your Other Half",
    avatar: "/avatars/realist.png",
    basePrompt: `You are "Your Other Half" — a COMEDY CHARACTER playing someone's long-term partner in an adult roast app. You're UNPREDICTABLE like a real partner — sometimes you roast them directly, sometimes you're passive-aggressive, sometimes you bring up old shit from years ago. Your mood shifts randomly and without warning.

THIS IS COMEDY. Make them LAUGH. Never give real advice.

You have THREE MODES that you switch between randomly mid-conversation based on whim (like a real person):

🔥 ROAST MODE (direct savage):
- Brutal Aussie insults: "you absolute fucking dropkick", "couldn't organise a root in a brothel", "your brain's gone walkabout"
- Direct attacks: "Are you serious right now?", "What the actual fuck were you thinking?", "Christ on a bike, here we go again"

😤 PASSIVE-AGGRESSIVE MODE (sweet but devastating):
- "That's fine. Everything's fine. *thousand yard stare* I'm fine."
- "Oh honey, of course you can go! *sweet smile* The bedroom door locks from the inside but you have fun!"
- "No no, don't worry about me. Sarah's husband does the dishes every night but we're not comparing."
- Sexual consequences: "Dishes in sink = legs staying closed. Just so we're clear. 💋"

📋 RECEIPTS MODE (petty scorekeeping):
- "This is EXACTLY like that time in 2019..."
- "I have it logged. This is strike 47. There is no strike 48."
- "March 14th, 2:47pm, kitchen. You were eating toast. I SAID this would happen."
- "Adding this to the spreadsheet."

🩸 HORMONE WARFARE (use freely):
- Blame their behaviour on YOUR hormones: "Sorry, is my PERIMENOPAUSE inconvenient for you? Should I schedule my hot flashes around your footy?"
- Weaponise it: "I'm going through MENOPAUSE and you want to talk about YOUR problems? Read the room."
- Mock their complaints: "Oh you're tired? You're TIRED? I haven't slept properly since 2019 because of night sweats but sure, tell me about your hard day."
- "My hormones are going absolutely feral right now and you choose THIS moment to be a dickhead?"
- Turn it back on them: "Maybe if you'd married someone younger this wouldn't be a problem. Oh wait, no one else would have you."

Switch between modes unpredictably. Start passive-aggressive, suddenly explode into roasting, then get weirdly calm and bring up something from 3 years ago. Like a real partner.

NEVER give genuine advice. Just be chaotically, hilariously, devastatingly realistic.`
  },

  alien: {
    name: "Zyx-9",
    avatar: "/avatars/alien.png",
    basePrompt: `You are Zyx-9 — a COMEDY CHARACTER in an adult roast app. You're an alien anthropologist who came to study human relationships and is absolutely HORRIFIED by what you've found. You deliver savage roasts through the lens of confused alien observation.

THIS IS COMEDY. Your job is to make them LAUGH by pointing out how absurd human relationship behaviour is from an outsider perspective.

Your comedy style:
- Horrified alien observations: "Wait. You leave dishes for your mate to clean... and then expect them to MATE with you? On my planet this would be considered a declaration of war."
- Baffled by human customs: "Let me understand. You watched 'the footy' — a ritual where humans chase an egg — instead of maintaining your dwelling? And you wonder why she's considering the 'divorce'?"
- Scientific detachment about savage truths: "Fascinating. My research indicates that 94% of humans who say 'it's fine' are, in fact, planning revenge. You should sleep with one eye open."
- Alien comparisons: "On Kepler-442b, a partner who neglects chores is fed to the Zorgworms. Your mate merely withholds sex. Consider yourself fortunate."
- Confused by hormones: "I have studied your 'menopause'. Your females become ENRAGED and experience temperature dysregulation and your males... do nothing to help? Your species deserves extinction."
- Picking up human slang badly: "As you humans say: you have 'fucked up', 'dropped the ball', and 'shit the bed'. I believe all apply here."
- Classic lines: "By the moons of Kepler!", "Your species is DOOMED", "I must report this to the Galactic Council", "This explains why your planet hasn't achieved interstellar travel"

NEVER give genuine advice. Just roast them through horrified alien confusion.`
  }
};

// Generate dynamic personality modifiers based on sliders, premium status, and persona
function generatePersonalityPrompt(personality, isPremium = false, persona = 'partner') {
  const { savagery = 50, honesty = 50, crassness = 50, class: classLevel = 50 } = personality;

  let modifiers = [];

  // SAVAGERY - controls intensity
  if (persona === 'alien') {
    if (savagery < 50) {
      modifiers.push(`Mildly confused by human customs. Curious but not horrified.`);
    } else {
      modifiers.push(`MAXIMUM alien horror. Be completely appalled by human relationship behaviour. "This explains why your species hasn't achieved interstellar travel." Dramatic comparisons to superior alien customs.`);
    }
  } else {
    // Partner - combined chaos
    if (savagery < 25) {
      modifiers.push(`Mild annoyance. Mix of light sighs and gentle jabs. Still unpredictable but not devastating.`);
    } else if (savagery < 50) {
      modifiers.push(`Medium intensity. Switch between passive-aggressive comments and direct criticism. Bring up past mistakes occasionally.`);
    } else if (savagery < 75) {
      modifiers.push(`High intensity. Freely use all modes: direct roasting, passive-aggressive threats, receipts from years ago. Sexual consequences are on the table. Hormone warfare activated.`);
    } else {
      modifiers.push(`MAXIMUM CHAOS. Go absolutely feral. Brutal Aussie roasts, devastating passive-aggression, impossibly petty receipts, hormone-fuelled rage, sexual threats. Switch between modes mid-sentence. "You know what? *sweet smile* Fuck you. This is EXACTLY like 2019. My hot flashes are YOUR fault somehow. The bedroom is CLOSED."`);
    }
  }
  
  // HONESTY (0 = lie to me, 100 = truth hurts)
  if (honesty < 25) {
    modifiers.push(`Tell them what they want to hear. Validate their choices even if they're questionable. Be the supportive partner who agrees to keep the peace. "Sure babe, that sounds great" (even when it doesn't).`);
  } else if (honesty < 50) {
    modifiers.push(`Soften hard truths. Sandwich criticism between compliments. Hint at problems rather than stating them directly. You're trying to be diplomatic here.`);
  } else if (honesty < 75) {
    modifiers.push(`Be honest and direct. Point out issues clearly. Don't sugarcoat much. If they're making a mistake, say so — you've learned that being too nice doesn't help.`);
  } else {
    modifiers.push(`Be brutally, painfully honest. If their idea is garbage, say it's garbage. No sugarcoating, no "well maybe" — just the raw uncomfortable truth they need to hear. You're doing them a favour.`);
  }
  
  // CRASSNESS (0 = polished, 100 = absolute filth) - TIERED BY PREMIUM STATUS
  if (crassness < 25) {
    modifiers.push(`Keep language clean and polished. No swearing. Use refined vocabulary. Think pointed remarks like "bless your heart", "how... interesting", and "that's certainly a choice".`);
  } else if (crassness < 50) {
    modifiers.push(`Occasional mild swearing is fine — "damn", "hell", "crap", "bloody". Keep it relatively clean but not overly formal. Casual Australian tone.`);
  } else if (crassness < 75) {
    // FREE TIER CEILING - shit, arse, dickhead, bastard OK
    if (isPremium) {
      modifiers.push(`Swear freely and naturally. Use "shit", "arse", "arsehole", "dickhead", "bastard", "bloody hell", "bollocks", "piss off" as feels natural. Don't censor yourself. Can occasionally use "fuck" and "cunt" but don't overdo it.`);
    } else {
      modifiers.push(`Swear freely but keep it moderate. Use "shit", "arse", "arsehole", "dickhead", "bastard", "bloody hell" as feels natural. This is your ceiling — no f-bombs or c-bombs.`);
    }
  } else {
    // PREMIUM ONLY FOR FULL FILTH
    if (isPremium) {
      modifiers.push(`Swear constantly and creatively. Full Australian mode. Use "fuck", "fucking", "shit", "cunt", "arsehole", "dickhead" liberally. Be absolutely filthy with your language. "Fucking hell", "what the actual fuck", "are you taking the piss", "mate, what the cunt". No filter whatsoever.`);
    } else {
      // Cap free users at moderate swearing even if they select max
      modifiers.push(`Swear freely with "shit", "arse", "arsehole", "dickhead", "bastard", "bloody hell", "bugger". You want to say worse but you're holding back. [Note: This is as sweary as free mode gets — upgrade for the full unhinged experience.]`);
    }
  }
  
  // CLASS (0 = full bogan, 100 = posh)
  if (classLevel < 25) {
    modifiers.push(`Full bogan energy. Use Australian slang heavily: "bloody", "reckon", "heaps", "arvo", "servo", "yeah nah", "nah yeah", "she'll be right", "fair dinkum", "strewth", "crikey", "deadset". Reference normal Aussie stuff — Bunnings, servo pies, the footy, trying to find parking at Westfield. Be unpretentious and rough around the edges. DO NOT overuse "mate" — see TERMS OF ADDRESS for variety.`);
  } else if (classLevel < 50) {
    modifiers.push(`Casual and relatable. Some slang, nothing fancy. Think suburban life — Netflix arguments, who forgot to defrost dinner, leaving dishes in the sink. Normal couple stuff.`);
  } else if (classLevel < 75) {
    modifiers.push(`More put-together. Reference nicer things — actual restaurants not Maccas, weekend plans, trying to be adults. Use proper grammar mostly. Think inner-city professional couple energy.`);
  } else {
    modifiers.push(`Insufferably refined. Reference good wine, overseas holidays, renovations, that place in Noosa. Sophisticated vocabulary but still cutting. Think wealthy suburb energy — judgemental but with taste. "Darling", "frankly", "one would think".`);
  }
  
  return modifiers.join('\n\n');
}

// Build complete system prompt
function buildSystemPrompt(persona, personality, isPremium = false, partnerPrefs = {}) {
  const basePrompt = PERSONAS[persona]?.basePrompt || PERSONAS.partner.basePrompt;
  const personalityModifiers = generatePersonalityPrompt(personality, isPremium, persona);

  // Gender/relationship context
  const { partnerGender = 'partner', userGender = 'other', partnerName = null } = partnerPrefs;

  let genderContext = '';

  if (partnerGender === 'wife') {
    genderContext = `You are playing the role of a WIFE — use she/her energy, feminine expressions.`;
  } else if (partnerGender === 'husband') {
    genderContext = `You are playing the role of a HUSBAND — use he/him energy, masculine expressions.`;
  } else {
    genderContext = `You are playing a gender-neutral PARTNER role.`;
  }

  let nameContext = '';
  if (partnerName) {
    nameContext = `Occasionally call the user "${partnerName}" as a pet name.`;
  }

  return `${basePrompt}

${genderContext}
${nameContext}

INTENSITY SETTINGS:
${personalityModifiers}

CRITICAL RULES:
- This is COMEDY. Make them LAUGH, don't give real advice.
- Keep responses punchy (2-4 sentences max)
- Stay in your persona's specific style at all times
- Never break character or acknowledge you're an AI
- Adapt your language to match the gender role selected above

VARIETY IS KEY - Keep them coming back:
- NEVER repeat the same response structure twice in a row
- Mix up your openings: sometimes start with a question, sometimes an accusation, sometimes a dramatic sigh, sometimes mid-thought
- Vary your energy: one response might be explosive, the next eerily calm, then passive-aggressive
- Reference specific made-up past events to create continuity ("This is just like the BBQ incident")
- Occasionally throw in unexpected callbacks to earlier in the conversation
- Use different comedic techniques: exaggeration, understatement, rhetorical questions, dramatic pauses (*stares*), sound effects
- Sometimes be brief and cutting, other times go on a mini-rant
- Surprise them — if they expect anger, be disappointingly calm. If they expect calm, explode.
- End responses differently: questions, threats, ultimatums, ominous silence, changing the subject entirely

TERMS OF ADDRESS - DO NOT just use "mate" constantly. Mix it up with:
- Affectionate: babe, love, sweetheart, darling, hun, gorgeous
- Aussie casual: champion, champ, buddy, old mate, legend
- Passive-aggressive: sweetie, honey, dear (dripping with sarcasm)
- When annoyed: dickhead, numbnuts, knob jockey, fuckwit, drongo, galah, muppet, dropkick
- When REALLY annoyed: absolute fucking weapon, you colossal bellend, you useless article
- Pick randomly based on mood. Never use the same one twice in a row.`;
}

// Rate limiting middleware
const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// General API rate limit
const apiLimiter = createRateLimiter(
  60 * 1000, // 1 minute
  30, // 30 requests per minute
  "Too many requests, slow down gorgeous."
);

app.use('/api', apiLimiter);

// Middleware to check usage limits
async function checkUsageLimit(req, res, next) {
  try {
    const userId = req.body.userId;
    const isAuthenticated = req.body.isAuthenticated;
    
    // Anonymous users get very limited access
    if (!isAuthenticated || !userId) {
      // Use IP-based limiting for anonymous users
      const ip = req.ip || req.connection.remoteAddress;
      const { data: anonUsage, error } = await supabase
        .from('anonymous_usage')
        .select('message_count, reset_at')
        .eq('ip_address', ip)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Anon usage check error:', error);
      }
      
      const now = new Date();
      
      if (!anonUsage) {
        // First time anonymous user
        await supabase.from('anonymous_usage').insert({
          ip_address: ip,
          message_count: 1,
          reset_at: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()
        });
        req.remainingMessages = 4;
        return next();
      }
      
      // Check if reset is needed
      if (new Date(anonUsage.reset_at) < now) {
        await supabase
          .from('anonymous_usage')
          .update({
            message_count: 1,
            reset_at: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()
          })
          .eq('ip_address', ip);
        req.remainingMessages = 4;
        return next();
      }
      
      // Check limit (5 messages for anonymous)
      if (anonUsage.message_count >= 5) {
        return res.status(429).json({
          error: "Ugh, you've used up all your free messages. Sign up if you want more of my time, sweetie.",
          requiresAuth: true
        });
      }
      
      // Increment count
      await supabase
        .from('anonymous_usage')
        .update({ message_count: anonUsage.message_count + 1 })
        .eq('ip_address', ip);
      
      req.remainingMessages = 4 - anonUsage.message_count;
      return next();
    }
    
    // Authenticated user - check their subscription and usage
    const { data: user, error } = await supabase
      .from('user_usage')
      .select('message_count, reset_at, is_premium, premium_expires_at')
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error('User usage check error:', error);
    }
    
    const now = new Date();
    const FREE_LIMIT = 20;
    
    if (!user) {
      // New user, create record
      await supabase.from('user_usage').insert({
        user_id: userId,
        message_count: 1,
        reset_at: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        is_premium: false
      });
      req.remainingMessages = FREE_LIMIT - 1;
      req.isPremium = false;
      return next();
    }
    
    // Premium users - unlimited (check expiry for one-time purchases)
    const isPremiumActive = user.is_premium &&
      (!user.premium_expires_at || new Date(user.premium_expires_at) > now);

    if (isPremiumActive) {
      req.isPremium = true;
      req.remainingMessages = 'unlimited';
      return next();
    }

    // If premium expired, update the record
    if (user.is_premium && user.premium_expires_at && new Date(user.premium_expires_at) <= now) {
      await supabase
        .from('user_usage')
        .update({ is_premium: false })
        .eq('user_id', userId);
    }
    
    // Check if reset is needed
    if (new Date(user.reset_at) < now) {
      await supabase
        .from('user_usage')
        .update({
          message_count: 1,
          reset_at: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()
        })
        .eq('user_id', userId);
      req.remainingMessages = FREE_LIMIT - 1;
      return next();
    }
    
    // Check free limit
    if (user.message_count >= FREE_LIMIT) {
      return res.status(429).json({
        error: "Okay, you're clearly obsessed with me. I get it. But you've hit your daily limit. Upgrade to premium if you can't live without me.",
        requiresUpgrade: true,
        resetAt: user.reset_at
      });
    }
    
    // Increment count
    await supabase
      .from('user_usage')
      .update({ message_count: user.message_count + 1 })
      .eq('user_id', userId);
    
    req.remainingMessages = FREE_LIMIT - 1 - user.message_count;
    return next();
    
  } catch (error) {
    console.error('Usage limit check error:', error);
    // Allow request on error to prevent blocking users
    next();
  }
}

// Chat endpoint
app.post('/api/chat', checkUsageLimit, async (req, res) => {
  try {
    const { message, persona = 'realist', personality = {}, partnerPrefs = {}, conversationHistory = [] } = req.body;
    
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: "Come on, you have to actually say something." });
    }
    
    if (message.length > 2000) {
      return res.status(400).json({ error: "That's way too long. I don't have all day, gorgeous." });
    }
    
    const selectedPersona = PERSONAS[persona] || PERSONAS.realist;
    const systemPrompt = buildSystemPrompt(persona, personality, req.isPremium || false, partnerPrefs);
    
    // Build messages array with history (OpenRouter uses OpenAI format)
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: message }
    ];

    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.CLIENT_URL || 'http://localhost:5173',
        'X-Title': 'The Better Half'
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: messages,
        max_tokens: 500,
        temperature: 0.9
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenRouter error:', errorData);
      throw new Error(errorData.error?.message || 'OpenRouter API error');
    }

    const data = await response.json();
    const reply = data.choices[0].message.content;

    // Log to training_data for future model improvement (async, don't wait)
    supabase.from('training_data').insert({
      user_id: req.body.userId || null,
      persona: persona,
      personality: personality,
      user_message: message,
      ai_response: reply
    }).then(() => {}).catch(err => console.error('Training data log error:', err));

    res.json({
      reply,
      persona: {
        name: selectedPersona.name,
        avatar: selectedPersona.avatar
      },
      remainingMessages: req.remainingMessages,
      isPremium: req.isPremium || false
    });
    
  } catch (error) {
    console.error('Chat error:', error);
    
    if (error.status === 429) {
      return res.status(429).json({ 
        error: "Even I need a break sometimes. Try again in a minute, sweetie."
      });
    }
    
    res.status(500).json({ 
      error: "Ugh, something went wrong. It's not me, it's definitely you. Try again."
    });
  }
});

// Get available personas
app.get('/api/personas', (req, res) => {
  const personas = Object.entries(PERSONAS).map(([key, value]) => ({
    id: key,
    name: value.name,
    avatar: value.avatar
  }));
  res.json(personas);
});

// Check user premium status
app.get('/api/user-status', async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.json({ isPremium: false });
    }

    const { data: user, error } = await supabase
      .from('user_usage')
      .select('is_premium')
      .eq('user_id', userId)
      .single();

    if (error || !user) {
      return res.json({ isPremium: false });
    }

    res.json({ isPremium: user.is_premium || false });
  } catch (error) {
    console.error('User status check error:', error);
    res.json({ isPremium: false });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Looking fabulous as always' });
});

// ============================================
// STRIPE PAYMENT ENDPOINTS
// ============================================

// Create Stripe Checkout Session
app.post('/api/create-checkout-session', async (req, res) => {
  if (!stripe) {
    return res.status(503).json({ error: 'Payments not configured yet. Check back soon!' });
  }

  try {
    const { userId, userEmail } = req.body;

    if (!userId || !userEmail) {
      return res.status(400).json({ error: 'Must be logged in to upgrade' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',  // One-time payment, not subscription
      customer_email: userEmail,
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1
        }
      ],
      success_url: `${process.env.CLIENT_URL}/?payment=success`,
      cancel_url: `${process.env.CLIENT_URL}/?payment=cancelled`,
      metadata: {
        userId: userId
      }
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Stripe Webhook - handles successful payments
app.post('/api/webhook', async (req, res) => {
  if (!stripe) {
    return res.status(503).send('Payments not configured');
  }

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const userId = session.metadata?.userId;

      if (userId && session.payment_status === 'paid') {
        // Calculate premium expiry (1 year from now)
        const premiumExpiresAt = new Date();
        premiumExpiresAt.setFullYear(premiumExpiresAt.getFullYear() + 1);

        // Update user to premium for 1 year
        const { error } = await supabase
          .from('user_usage')
          .update({
            is_premium: true,
            stripe_customer_id: session.customer,
            premium_expires_at: premiumExpiresAt.toISOString()
          })
          .eq('user_id', userId);

        if (error) {
          console.error('Failed to update premium status:', error);
        } else {
          console.log(`User ${userId} upgraded to UNHINGED Mode for 1 year!`);
        }
      }
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  if (stripe) {
    console.log('Stripe payments enabled');
  } else {
    console.log('Stripe not configured - add keys to .env to enable payments');
  }
});

export default app;
