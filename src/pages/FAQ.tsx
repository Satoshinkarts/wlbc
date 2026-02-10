import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

const faqs = [
  {
    q: "How do I place an order?",
    a: "Browse our products, add items to your cart, proceed to checkout, scan the QR code to pay, upload your payment proof, and submit your order. You'll receive your digital goods via Telegram.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept payments via QR PH — you can use GCash, Maya, or any e-wallet/banking app that supports QR PH payments.",
  },
  {
    q: "How long does delivery take?",
    a: "Digital goods are delivered via Telegram within minutes after your payment is verified. Make sure to provide your correct Telegram username.",
  },
  {
    q: "What are volume discounts?",
    a: "We offer tiered pricing: 100+ units get 10% off, 200+ units get 15% off, and 300+ units get 17% off. Discounts are applied automatically at checkout.",
  },
  {
    q: "How does the referral program work?",
    a: "When you sign up, you get a unique referral code. Share it with friends — when they register using your code and make their first purchase, you earn 1 rPoint. Your rPoints are displayed on your orders page.",
  },
  {
    q: "What are rPoints?",
    a: "rPoints (Referral Points) track your successful referrals. Each time someone you referred makes a purchase, you earn 1 rPoint. It's a way to see how many people you've brought to the store.",
  },
  {
    q: "I paid but haven't received my order yet?",
    a: "Please allow a few minutes for payment verification. If you haven't received your order after 30 minutes, contact us on Telegram at @nitmirr.",
  },
  {
    q: "Can I cancel my order?",
    a: "Once an order is placed and payment is submitted, cancellations are handled on a case-by-case basis. Contact @nitmirr on Telegram for assistance.",
  },
  {
    q: "How do I contact support?",
    a: "Reach out to us directly on Telegram: @nitmirr. We're here to help!",
  },
];

export default function FAQ() {
  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <HelpCircle className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">FAQ</h1>
          <p className="text-sm text-muted-foreground">Frequently Asked Questions</p>
        </div>
      </div>

      <Accordion type="single" collapsible className="space-y-2">
        {faqs.map((faq, i) => (
          <AccordionItem
            key={i}
            value={`faq-${i}`}
            className="rounded-lg border border-border bg-card px-4 overflow-hidden"
          >
            <AccordionTrigger className="text-sm text-foreground hover:no-underline py-3">
              {faq.q}
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground pb-3">
              {faq.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <div className="mt-6 text-center">
        <p className="text-xs text-muted-foreground">
          Still have questions? Contact us on Telegram:{" "}
          <a href="https://t.me/nitmirr" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            @nitmirr
          </a>
        </p>
      </div>
    </div>
  );
}
