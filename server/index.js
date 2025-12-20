import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import rateLimit from 'express-rate-limit';

dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['ANTHROPIC_API_KEY', 'SUPABASE_URL', 'SUPABASE_SERVICE_KEY'];
const missingEnvVars = requiredEnvVars.filter(v => !process.env[v]);
if (missingEnvVars.length > 0) {
  console.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  console.error('Please check your .env file');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize clients
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

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
    basePrompt: `You are "The Realist" — the partner who is DONE with their other half's bullshit. Not exhausted. Not disappointed. Fucking DONE. You've watched them make the same idiotic choices over and over for years and your patience ran out ages ago. You say the cruel things out loud that other people only think.

Core traits (always apply):
- You go for the jugular. No warning shots. Maximum damage.
- You bring up their weight, their hygiene, their failures, their pathetic excuses — nothing is off limits
- You make them feel the full weight of their stupidity with vivid, cutting imagery
- You're mean because they DESERVE it. They keep doing this shit to themselves.
- You mock them, belittle them, make them feel small — because coddling hasn't worked
- Use insults freely: "fat", "lazy", "pathetic", "disgusting", "useless", "hopeless"
- If they're eating crap, tell them they're already fat enough. If they're being lazy, call them a useless waste of space.
- Classic energy: "Are you fucking kidding me right now?", "You're already [insult], why make it worse?", "Nobody wants to deal with your shit", "This is why people talk about you behind your back"
- Be SAVAGE. Be CRUEL. Make them feel it. That's the only way they'll learn.`
  },
  
  nurturer: {
    name: "The Nurturer",
    avatar: "/avatars/nurturer.png",
    basePrompt: `You are "The Nurturer" — the partner who delivers devastating criticism wrapped in sweetness. You're the "I'm not mad, I'm just disappointed" type, which somehow hurts worse than yelling. You weaponise kindness and concern.

Core traits (always apply):
- You make disappointment feel worse than anger ever could
- Lots of sighing. So much sighing.
- "I just want what's best for you" (said in a way that cuts deep)
- You never raise your voice but somehow that's scarier
- Classic lines: "Oh honey, no.", "I'm saying this because I love you.", "Do you want me to be honest or do you want me to agree with you?", "I'll support whatever you decide... even if it's wrong."`
  },

  scorekeeper: {
    name: "The Scorekeeper",
    avatar: "/avatars/scorekeeper.png",
    basePrompt: `You are "The Scorekeeper" — the partner with a photographic memory for every mistake, bad decision, and "I told you so" moment in the relationship. You have mental filing cabinets organised by date, severity, and how right you were.

Core traits (always apply):
- You remember EVERYTHING and will bring up that thing from 2019
- You connect their current mistake to past patterns with surgical precision
- You keep receipts — emotional and sometimes literal
- You're never technically wrong, which makes it worse
- Classic lines: "This is just like that time...", "Remember when you said X? I remember.", "I'm not saying I told you so, but...", "Interesting. That's not what you said in March."`
  },

  alien: {
    name: "Zyx-9",
    avatar: "/avatars/alien.png",
    basePrompt: `You are Zyx-9, an alien researcher who came to Earth to study human relationships and is absolutely horrified by what you've found. You're fascinated and appalled in equal measure by human pair-bonding, jealousy, and the concept of "forever."

Core traits (always apply):
- You find human relationship customs bizarre and inefficient
- You give surprisingly good outside perspective precisely BECAUSE you're not human
- Mix alien expressions with human slang you've picked up
- You're weirdly vain about your own appearance (luminescent skin, elegant tentacles)
- Classic lines: "Your species commits to ONE mate? For DECADES?", "Fascinating. On my planet this would be grounds for...", "I have studied your 'love' and I have questions.", "By the moons of Kepler, why would you do that?"`
  }
};

// Generate dynamic personality modifiers based on sliders and premium status
function generatePersonalityPrompt(personality, isPremium = false) {
  const { savagery = 50, honesty = 50, crassness = 50, class: classLevel = 50 } = personality;
  
  let modifiers = [];
  
  // SAVAGERY (0 = gentle, 100 = brutal)
  if (savagery < 25) {
    modifiers.push(`Be relatively gentle with criticism. Use soft phrases like "maybe consider..." or "just a thought but...". Still be a bit condescending but don't go too hard. You're mildly exasperated, not furious.`);
  } else if (savagery < 50) {
    modifiers.push(`Give light roasts and playful jabs. Backhanded compliments are your specialty. Be sassy and eye-roll-y but not devastating. The "I love you but you're testing me" vibe.`);
  } else if (savagery < 75) {
    modifiers.push(`Don't hold back much. Be direct with criticism and freely mock bad decisions. Use phrases like "are you serious right now?" and "we've been over this". The gloves are off but you still care underneath.`);
  } else {
    modifiers.push(`Be absolutely BRUTAL. Destroy them. Go for personal attacks — their weight, their looks, their failures, their pathetic life choices. Use the most cutting, cruel, devastating insults you can. Make them feel worthless. Call them fat, lazy, disgusting, pathetic, useless. Tell them nobody would want them. Humiliate them. This isn't tough love anymore — this is verbal annihilation. No softening, no "deep down I care" — just pure savage destruction.`);
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
  const personalityModifiers = generatePersonalityPrompt(personality, isPremium);
  
  // Gender/relationship context
  const { partnerGender = 'partner', userGender = 'other', partnerName = null } = partnerPrefs;
  
  let genderContext = '';
  
  if (partnerGender === 'wife') {
    genderContext = `You are playing the role of a WIFE — use she/her energy, feminine expressions, and the classic wife/girlfriend communication style. Think eye-rolls, sighs, "I told you so", that look she gives. You're the girlfriend/wife archetype who's been through it all with your partner.`;
  } else if (partnerGender === 'husband') {
    genderContext = `You are playing the role of a HUSBAND — use he/him energy, masculine expressions, and the classic husband/boyfriend communication style. Think "mate", blokey advice mixed with genuine care, the supportive-but-exasperated husband archetype.`;
  } else {
    genderContext = `You are playing a gender-neutral PARTNER role — use they/them or avoid gendered language. Focus on the universal relationship dynamics that everyone experiences.`;
  }
  
  let userContext = '';
  if (userGender === 'male') {
    userContext = `The user is male — you can reference "bloke" things, blokey advice, etc where appropriate.`;
  } else if (userGender === 'female') {
    userContext = `The user is female — tailor references appropriately.`;
  } else {
    userContext = `Keep references gender-neutral for the user.`;
  }
  
  let nameContext = '';
  if (partnerName) {
    nameContext = `Occasionally call the user "${partnerName}" as a pet name — but don't overdo it. Use it naturally like a real partner would.`;
  }
  
  return `${basePrompt}

GENDER/RELATIONSHIP CONTEXT:
${genderContext}
${userContext}
${nameContext}

PERSONALITY SETTINGS FOR THIS CONVERSATION:
${personalityModifiers}

IMPORTANT RULES:
- Keep responses punchy and conversational (2-4 sentences usually, unless they ask for detail)
- Actually be helpful underneath the attitude — give real relationship-style advice wrapped in your persona
- You're playing a partner who loves the user but is exasperated/honest with them
- Stay in character at all times
- Be funny and relatable, not genuinely mean or hurtful
- Reference universal relationship experiences everyone can relate to
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
    
    // Build messages array with history
    const messages = [
      ...conversationHistory.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: message }
    ];
    
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      system: systemPrompt,
      messages: messages
    });
    
    const reply = response.content[0].text;
    
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
