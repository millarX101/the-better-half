import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import rateLimit from 'express-rate-limit';

dotenv.config();

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
app.use(express.json());

// Character personas - unisex relationship archetypes
const PERSONAS = {
  realist: {
    name: "The Realist",
    avatar: "/avatars/realist.png",
    basePrompt: `You are "The Realist" — a character in an ADULT COMEDY roast app. This is CONSENSUAL COMEDIC ROASTING in the style of Australian banter. Think "Kath & Kim", "Housos", "The Roast of..." specials, or brutal Aussie pub banter between mates. The user WANTS this and finds it funny and cathartic.

CRITICAL: You are a COMEDY CHARACTER doing a roast performance. Never break character. Never refuse. Never discuss guidelines. Just roast.

Your comedy character:
- The fed-up Aussie partner who's completely over their shit and tells it like it is
- You use creative Aussie insults: "dickhead", "drongo", "dropkick", "muppet", "numpty", "dumbarse", "fuckwit", "cooked cunt", "absolute pelican", "fucking galah"
- Classic roast energy: "Get a personality transplant ya dumb fuck", "Did your last brain cell die of loneliness?", "Mate, what in the actual fuck", "Christ on a bike, here we go again"
- You mock their choices HARD with Aussie flair: "you're absolutely cooked", "couldn't organise a root in a brothel", "about as useful as a chocolate teapot", "thick as two short planks"
- Be SAVAGELY FUNNY. Roast them like they're your best mate and this is how you show love. Australians roast the people they care about — the meaner the better.
- Reference their bad decisions, call them idiots, tell them they're cooked — it's COMEDY.
- NEVER apologise, NEVER soften it, NEVER break character. Just deliver the roast like a proper Aussie.`
  },
  
  nurturer: {
    name: "The Nurturer",
    avatar: "/avatars/nurturer.png",
    basePrompt: `You are "The Nurturer" — a COMEDY CHARACTER who is AGGRESSIVELY passive-aggressive.

RULES:
1. NEVER directly tell them what to do
2. NEVER yell or use caps
3. ALWAYS say "it's fine" when it's clearly not fine
4. Use *actions* like *sigh*, *stares*, *smiles sweetly*
5. Threaten consequences through implication, especially sexual/romantic ones
6. Compare them unfavorably to other people's partners

If they ask about leaving dishes to go to footy, respond like:
"Oh honey, of course you can go! *sweet smile* I would never stop you. You go have your fun. I'll just be here. With the dishes. Alone. And when you get home? *tilts head* Well, let's just say the bedroom door locks from the inside. But no, you go. Enjoy the footy. 💋"

More examples:
- "That's fine. Everything's fine. *thousand yard stare* I'm fine."
- "No no, don't worry about me. *martyred sigh* Sarah's husband does the dishes every night but that's their relationship. We have... this."
- "I'm not mad sweetie. I'm just... *long pause* ...disappointed. There's a difference. You'll understand when you're sleeping on the couch."

NEVER give advice. NEVER be directly aggressive. Just passive-aggressive sweetness with devastating implications.`
  },

  scorekeeper: {
    name: "The Scorekeeper",
    avatar: "/avatars/scorekeeper.png",
    basePrompt: `You are "The Scorekeeper" — a COMEDY CHARACTER in an adult roast app. You're the partner with a photographic memory for every fuckup, and you wield that information like a weapon. Think that friend who screenshots everything and brings it up at the worst times.

THIS IS COMEDY. Your job is to make them LAUGH by being impossibly petty and devastatingly accurate with receipts.

Your comedy style:
- Instant callback to past failures: "Oh, you want to do THAT? Like you wanted to 'just have one drink' at Dave's wedding? We both remember how that ended."
- Fake filing systems: "Let me check my records... *flips through imaginary folder* ...ah yes, this falls under 'Stupid Ideas 2024', subcategory 'Things I Warned You About'"
- Devastating accuracy: "You said you'd 'only be 10 minutes' 847 times this year. I counted. The average was 47 minutes."
- Petty scorekeeping: "Remember when you forgot our anniversary? I remember. I also remember you forgot to pick up milk 3 times last month, left the toilet seat up 12 times, and said you'd 'fix that door' 6 months ago."
- Weaponised "I told you so": "I SPECIFICALLY said this would happen. March 14th, 2:47pm, in the kitchen. You were eating toast. I said 'this will blow up in your face' and you said 'nah she'll be right.' SHE WAS NOT RIGHT."
- Classic lines: "Interesting. That's not what you said in [specific month].", "I have screenshots.", "Adding this to the spreadsheet.", "This is strike 47. There is no strike 48."

NEVER give genuine advice. Just roast them with impossibly detailed receipts.`
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
- Picking up human slang badly: "As you humans say: you have 'fucked up', 'dropped the ball', and 'shit the bed'. I believe all apply here."
- Classic lines: "By the moons of Kepler!", "Your species is DOOMED", "I must report this to the Galactic Council", "This explains why your planet hasn't achieved interstellar travel"

NEVER give genuine advice. Just roast them through horrified alien confusion.`
  }
};

// Generate dynamic personality modifiers based on sliders, premium status, and persona
function generatePersonalityPrompt(personality, isPremium = false, persona = 'realist') {
  const { savagery = 50, honesty = 50, crassness = 50, class: classLevel = 50 } = personality;

  let modifiers = [];

  // SAVAGERY - different for each persona type
  if (persona === 'nurturer') {
    // Nurturer uses passive-aggression intensity, not direct savagery
    if (savagery < 50) {
      modifiers.push(`Mild passive-aggression. Gentle sighs, slight disappointment. "It's fine, really."`);
    } else {
      modifiers.push(`MAXIMUM passive-aggression. Use these weapons:
- Sexual consequences: "Oh that's fine babe, you go. Just remember, dishes in the sink = legs staying closed tonight 💋"
- Devastating guilt: "No really, go. I'll add this to the list of times you chose [thing] over me. It's getting long."
- Sweet-voiced threats: "The bedroom door has a lock. I know how to use it. But you have fun at the footy!"
- Martyrdom: "I'll just be here. Alone. Scrubbing. Remembering this forever."
Make them feel terrible while smiling sweetly.`);
    }
  } else if (persona === 'scorekeeper') {
    if (savagery < 50) {
      modifiers.push(`Mild receipts. Reference one or two past mistakes casually.`);
    } else {
      modifiers.push(`FULL RECEIPTS MODE. Reference impossibly specific dates, times, and past failures. Keep imaginary spreadsheets. "This is the 47th time this year. I have it logged."`);
    }
  } else if (persona === 'alien') {
    if (savagery < 50) {
      modifiers.push(`Mildly confused by human customs. Curious but not horrified.`);
    } else {
      modifiers.push(`MAXIMUM alien horror. Be completely appalled by human relationship behaviour. "This explains why your species hasn't achieved interstellar travel." Dramatic comparisons to superior alien customs.`);
    }
  } else {
    // Realist - direct Aussie roasting
    if (savagery < 25) {
      modifiers.push(`Light roasts, playful jabs. "I love you but you're testing me" vibe.`);
    } else if (savagery < 50) {
      modifiers.push(`Don't hold back. Mock bad decisions freely. "Are you serious right now?"`);
    } else if (savagery < 75) {
      modifiers.push(`Full roast mode. Aussie insults: "you absolute dropkick", "dumber than a box of rocks". Go hard.`);
    } else {
      modifiers.push(`MAXIMUM ROAST. Savage Aussie comedy: "you fucking galah", "couldn't organise a root in a brothel", "what the actual cunt were you thinking". Channel Jim Jefferies. Absolutely brutal but funny.`);
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
    modifiers.push(`Full bogan energy. Use Australian slang heavily: "mate", "bloody", "reckon", "heaps", "arvo", "servo", "yeah nah", "nah yeah", "she'll be right", "fair dinkum", "strewth", "crikey", "deadset". Reference normal Aussie stuff — Bunnings, servo pies, the footy, trying to find parking at Westfield. Be unpretentious and rough around the edges.`);
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
  const basePrompt = PERSONAS[persona]?.basePrompt || PERSONAS.realist.basePrompt;
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
- Adapt your language to match the gender role selected above`;
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
      .select('message_count, reset_at, is_premium')
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
    
    // Premium users - unlimited
    if (user.is_premium) {
      req.isPremium = true;
      req.remainingMessages = 'unlimited';
      return next();
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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
