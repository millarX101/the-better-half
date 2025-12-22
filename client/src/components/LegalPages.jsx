import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

const LEGAL_CONTENT = {
  terms: {
    title: 'Terms of Service',
    lastUpdated: 'December 2025',
    content: `
## 1. Acceptance of Terms

By accessing or using The Better Half ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.

## 2. Description of Service

The Better Half is an AI-powered entertainment chatbot designed for comedy purposes. The Service simulates relationship banter and provides humorous responses. **This is not real relationship advice.**

## 3. Age Requirement

You must be at least 18 years old to use this Service. By using the Service, you confirm that you are at least 18 years of age.

## 4. User Conduct

You agree not to:
- Use the Service for any illegal purpose
- Attempt to exploit or harm the AI system
- Share content that violates any laws
- Use the Service to harass or harm others
- Attempt to bypass any usage limits or security measures

## 5. Content Disclaimer

The AI responses are generated for entertainment purposes only. The Service:
- Does NOT provide professional relationship advice
- Does NOT replace therapy or counselling
- May contain adult language and themes
- May be offensive or inappropriate for some users

**Use at your own discretion.**

## 6. Account Termination

We reserve the right to terminate or suspend your account at any time, without notice, for conduct that we believe violates these Terms or is harmful to the Service or other users.

## 7. Premium Subscriptions

Premium features are provided on a subscription basis. By purchasing a subscription, you agree to:
- Pay the applicable fees
- Accept our refund policy
- Allow automatic renewal unless cancelled

## 8. Limitation of Liability

THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. WE ARE NOT LIABLE FOR ANY DAMAGES ARISING FROM YOUR USE OF THE SERVICE.

## 9. Changes to Terms

We may update these Terms at any time. Continued use of the Service after changes constitutes acceptance of the new Terms.

## 10. Contact

For questions about these Terms, contact us at hello@thebetterhalf.com.au
    `
  },
  privacy: {
    title: 'Privacy Policy',
    lastUpdated: 'December 2025',
    content: `
## 1. Information We Collect

**Account Information:**
- Email address (for account creation)
- Authentication data

**Usage Data:**
- Chat messages (to improve AI responses)
- Usage patterns and preferences
- Device and browser information

**Payment Information:**
- Processed securely by Paddle
- We do not store your payment card details

## 2. How We Use Your Information

We use your information to:
- Provide and improve the Service
- Process payments
- Send important account notifications
- Improve AI response quality
- Analyse usage patterns

## 3. Data Sharing

We share data with:
- **Supabase** - Database hosting and authentication
- **OpenRouter** - AI model processing
- **Paddle** - Payment processing
- **Google Analytics** - Usage analytics

We do NOT sell your personal information to third parties.

## 4. Data Retention

- Chat messages: Retained to improve AI quality
- Account data: Retained while your account is active
- Payment records: Retained as required by law

## 5. Your Rights

You have the right to:
- Access your personal data
- Request deletion of your data
- Opt out of marketing communications
- Export your data

To exercise these rights, contact us at hello@thebetterhalf.com.au

## 6. Cookies

We use cookies and similar technologies for:
- Authentication
- Analytics (Google Analytics)
- Remembering preferences

## 7. Data Security

We implement appropriate security measures to protect your data. However, no method of transmission over the Internet is 100% secure.

## 8. Children's Privacy

The Service is not intended for users under 18. We do not knowingly collect data from children.

## 9. International Users

Your data may be processed in Australia and other countries where our service providers operate.

## 10. Changes to This Policy

We may update this Privacy Policy at any time. We will notify you of significant changes via email or through the Service.

## 11. Contact

For privacy concerns, contact us at hello@thebetterhalf.com.au
    `
  },
  refund: {
    title: 'Refund Policy',
    lastUpdated: 'December 2025',
    content: `
## 1. Digital Product

The Better Half Premium is a digital product/service. Due to the nature of digital goods, **we generally do not offer refunds** once you have accessed the premium features.

## 2. Free Trial

We offer a **7-day free trial** of Premium features:
- No credit card required
- Full access to all premium features
- Automatically expires after 7 days
- One free trial per account

**We strongly recommend using the free trial** before purchasing to ensure the Service meets your expectations.

## 3. Refund Eligibility

Refunds may be considered in exceptional circumstances:
- Technical issues that prevented use of the Service
- Accidental duplicate purchases
- Billing errors

Refunds are NOT available for:
- Change of mind after purchase
- Dissatisfaction with AI responses
- Failure to cancel before renewal
- Violations of Terms of Service

## 4. How to Request a Refund

To request a refund:
1. Email us at hello@thebetterhalf.com.au
2. Include your account email
3. Explain the reason for your request
4. Submit within 7 days of purchase

## 5. Processing Time

Refund requests are processed within 5-10 business days. Approved refunds will be credited to your original payment method.

## 6. Subscription Cancellation

You can cancel your subscription at any time:
- Access continues until the end of your billing period
- No partial refunds for unused time
- You can resubscribe at any time

## 7. Contact

For refund requests or billing questions, contact us at hello@thebetterhalf.com.au
    `
  }
}

export default function LegalPages() {
  const { page } = useParams()
  const content = LEGAL_CONTENT[page]

  if (!content) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Page Not Found</h1>
          <Link to="/" className="text-hottie-400 hover:underline">
            Return to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-950">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-dark-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <h1 className="font-display text-3xl font-bold">{content.title}</h1>
          <p className="text-dark-500 text-sm mt-2">Last updated: {content.lastUpdated}</p>
        </div>

        {/* Content */}
        <div className="prose prose-invert prose-sm max-w-none">
          {content.content.split('\n').map((line, i) => {
            if (line.startsWith('## ')) {
              return <h2 key={i} className="text-xl font-bold mt-8 mb-4 text-white">{line.replace('## ', '')}</h2>
            }
            if (line.startsWith('**') && line.endsWith('**')) {
              return <p key={i} className="font-bold text-white">{line.replace(/\*\*/g, '')}</p>
            }
            if (line.startsWith('- ')) {
              return <li key={i} className="text-dark-300 ml-4">{line.replace('- ', '')}</li>
            }
            if (line.trim() === '') {
              return null
            }
            return <p key={i} className="text-dark-300 mb-3">{line}</p>
          })}
        </div>

        {/* Footer Links */}
        <div className="mt-12 pt-8 border-t border-dark-800">
          <p className="text-dark-500 text-sm mb-4">Other legal documents:</p>
          <div className="flex gap-4 text-sm">
            {page !== 'terms' && (
              <Link to="/terms" className="text-hottie-400 hover:underline">Terms of Service</Link>
            )}
            {page !== 'privacy' && (
              <Link to="/privacy" className="text-hottie-400 hover:underline">Privacy Policy</Link>
            )}
            {page !== 'refund' && (
              <Link to="/refund" className="text-hottie-400 hover:underline">Refund Policy</Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
