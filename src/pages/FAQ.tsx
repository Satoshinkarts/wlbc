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
    a: "Browse products → add to cart → checkout → choose your payment method → scan the QR code to pay → upload payment proof → submit. Your digital goods are delivered securely via Telegram.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept QR PH (GCash, Maya, or any banking app) and Crypto (USDT via BNB Smart Chain / BEP20). All payments are verified before order processing.",
  },
  {
    q: "How does crypto payment work?",
    a: "Select 'Crypto – USDT (BEP20)' at checkout, scan the QR code or copy the wallet address, send the exact amount in USDT on BNB Smart Chain, then upload your transaction screenshot as proof.",
  },
  {
    q: "Is my payment secure?",
    a: "Yes. All payments are verified manually before processing. Your payment proof is encrypted and stored securely. We never store sensitive financial information.",
  },
  {
    q: "How fast is delivery?",
    a: "Digital goods are delivered via Telegram within minutes after payment is verified. Make sure your Telegram username is correct at checkout.",
  },
  {
    q: "What are volume discounts?",
    a: "Volume discounts apply exclusively to PVA - Gmail products. Buy more, save more: 100+ units = 10% off, 200+ units = 15% off, 300+ units = 17% off. Discounts apply automatically at checkout.",
  },
  {
    q: "How does the referral program work?",
    a: "You get a unique referral code on your Orders page. Share it — when someone signs up with your code and makes a purchase, you earn 1 rPoint. Track your rPoints on the Orders page.",
  },
  {
    q: "I paid but haven't received my order?",
    a: "Allow a few minutes for verification. If your order hasn't arrived within 30 minutes, contact us on Telegram at @nitmirr.",
  },
  {
    q: "Can I cancel or refund an order?",
    a: "Cancellations and refunds are handled case-by-case after payment is submitted. Contact @nitmirr on Telegram for assistance.",
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
