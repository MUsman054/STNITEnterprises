import policies from "@/content/policies.json";
import { site } from "@/lib/site";

/**
 * Support and policy pages.
 *
 * - Return Policy and Shipping Policy: from the client's content PDF (STNIT_content.pdf).
 * - Terms & Conditions, Privacy Policy, Goods & Services: from the client's current website
 *   (policies.json). The PDF's versions of Terms and Privacy are an unedited template that
 *   still names another company ("talhadomain"), so the website versions are used instead.
 * - FAQs: answers from the current website's FAQ, updated to match the new policies.
 * - Warranty: DRAFT. No warranty text was provided. Have the client supply or approve it.
 */

export type Block =
  | { type: "h2" | "h3" | "p"; text: string }
  | { type: "ul" | "ol"; items: string[] };

export type SupportPage = {
  title: string;
  intro?: string;
  notice?: string;
  blocks: Block[];
};

type RawBlock = { type: string; text?: string; items?: string[] };

/** Lines the old site wrote as "– item" paragraphs become proper list items. */
function fromWebsite(raw: RawBlock[]): Block[] {
  const blocks: Block[] = [];
  const pushItem = (text: string) => {
    const last = blocks[blocks.length - 1];
    if (last?.type === "ul") last.items.push(text);
    else blocks.push({ type: "ul", items: [text] });
  };
  for (const block of raw) {
    if (block.type === "ul") {
      for (const item of block.items ?? []) pushItem(item);
      continue;
    }
    const text = (block.text ?? "").trim();
    if (!text) continue;
    if (/^[–—-]\s+/.test(text)) pushItem(text.replace(/^[–—-]\s+/, ""));
    else if (block.type === "h2" || block.type === "h3") blocks.push({ type: block.type, text });
    else blocks.push({ type: "p", text });
  }
  return blocks;
}

const web = policies as Record<string, { title: string; blocks: RawBlock[] }>;
const { phone, salesEmail } = site.contact;

export const faqs: { question: string; answer: string }[] = [
  {
    question: "How long does shipping take?",
    answer: "Orders within the US ship in 2–5 business days. Tracking information is emailed to you as soon as it is available.",
  },
  { question: "Where do you ship?", answer: "We ship anywhere in the world." },
  { question: "Where can I view my sales receipt?", answer: "Your invoice will be shared with you by email." },
  {
    question: "How can I return an item?",
    answer: `All returns need a Return Material Authorization (RMA) number first. Email ${salesEmail} or call ${phone} to request one. See our Return Policy for the full conditions.`,
  },
  {
    question: "What if my order doesn't match what I ordered?",
    answer: "Please report any differences between your purchase order and the items you received within 2 days of delivery.",
  },
  {
    question: "Will you restock items shown as out of stock?",
    answer: "We may restock products, depending on availability. Use “Add to Quote” on the product page and we will let you know.",
  },
  {
    question: "I can't find the part number I need. Can you source it?",
    answer: "Often, yes. Search for the part number; if it isn't listed, the results page lets you send us a part request and our procurement team will get back to you.",
  },
  {
    question: "Can I get a quote for bulk or business orders?",
    answer: "Yes. Use “Add to Quote” on any product page with your quantity and target price, or contact our sales team directly.",
  },
];

export const supportPages: Record<string, SupportPage> = {
  faqs: {
    title: "Frequently Asked Questions",
    intro: "Answers to the questions we hear most. Can't find yours? Contact us and we'll help.",
    blocks: [],
  },
  "return-policy": {
    title: "Return & Refund Policy",
    intro:
      "Thank you for shopping with us. If you are not fully satisfied with your purchase, you may return it for a refund or exchange, subject to the following terms.",
    blocks: [
      { type: "h2", text: "Return conditions" },
      {
        type: "ul",
        items: [
          "Products must be in original condition and packaging.",
          "All original tags, labels, manuals, accessories, and software must be included.",
          "Used or customer-damaged items are not eligible for return.",
          "Returns must be requested through our Return Material Authorization (RMA) process.",
        ],
      },
      { type: "h2", text: "RMA process" },
      {
        type: "ol",
        items: [
          "All returns must be pre-approved with an RMA number.",
          "Items must be returned in the same packaging as received.",
          "Do not write directly on the original box. Use an outer box and clearly label it with the RMA number and our full address.",
          "If the original packaging is marked or damaged, a 25% restocking fee will be applied.",
          "Items with missing or replaced components, or items found functional after being reported defective, may incur up to a 50% restocking fee.",
          "Once received and inspected by our team, replacements will be processed within 14 business days.",
        ],
      },
      { type: "h2", text: "Important notes" },
      {
        type: "ul",
        items: [
          "Any discrepancies between your purchase order and received items must be reported within 2 days of delivery.",
          "Returns without an RMA number will not be accepted.",
        ],
      },
      { type: "h2", text: "Refunds" },
      {
        type: "ul",
        items: [
          "Refunds will be issued after inspection and may take up to 30 days to reflect, depending on your bank or credit card provider.",
          "If you haven't received your refund after this time, please contact us.",
        ],
      },
      { type: "h2", text: "Contact us" },
      { type: "p", text: `For RMA requests, refunds, or any assistance, call ${phone} or email ${salesEmail}.` },
    ],
  },
  "shipping-policy": {
    title: "Shipping Policy",
    intro: "How and when your order ships, and what to do if something isn't right.",
    blocks: [
      { type: "h2", text: "Processing time" },
      { type: "p", text: "Orders within the US are shipped in 2–5 business days." },
      { type: "h2", text: "Where we ship" },
      { type: "p", text: "We ship anywhere in the world." },
      { type: "h2", text: "Tracking" },
      { type: "p", text: "Tracking information will be emailed to you once it is available." },
      { type: "h2", text: "Delivery issues" },
      {
        type: "ul",
        items: [
          "Delivery delays due to incorrect shipping details or missed deliveries are not our responsibility.",
          "Any discrepancies between your purchase order and the items received must be reported within 2 days of delivery.",
        ],
      },
      { type: "h2", text: "Invoices" },
      { type: "p", text: "Your invoice will be shared with you by email." },
      { type: "h2", text: "Questions" },
      { type: "p", text: `Call ${phone} or email ${salesEmail}.` },
    ],
  },
  warranty: {
    title: "Warranty",
    notice:
      "Our full warranty terms are being finalised. For the warranty on a specific item, contact us before you order and we'll confirm it in writing.",
    blocks: [
      { type: "p", text: "Warranty coverage depends on the product and its condition (new or refurbished). The warranty that applies to your item is confirmed on your invoice." },
      { type: "h2", text: "Making a warranty claim" },
      {
        type: "ol",
        items: [
          `Contact us at ${salesEmail} or ${phone} with your order number and the item's part number.`,
          "Describe the fault, and include photos or a short video where possible.",
          "We'll issue an RMA number and return instructions. See our Return Policy for how RMAs work.",
        ],
      },
    ],
  },
  "terms-conditions": { title: "Terms & Conditions", blocks: fromWebsite(web["terms-condition"]?.blocks ?? []) },
  "privacy-policy": { title: "Privacy Policy", blocks: fromWebsite(web["privacy-policy"]?.blocks ?? []) },
  "goods-services-offered": { title: "Goods & Services Offered", blocks: fromWebsite(web["goods-services-offered"]?.blocks ?? []) },
};
