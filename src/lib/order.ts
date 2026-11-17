/**
 * Order constants shared by the browser and the server. Orders themselves live in the
 * database (src/server/orders.ts); nothing personal is stored in the browser.
 */

export type PaymentMethodId = "card" | "bank";

export const paymentMethods: { id: PaymentMethodId; label: string; note: string }[] = [
  {
    id: "card",
    label: "Credit or debit card",
    note: "You'll pay on Stripe's secure checkout page (cards, Apple Pay, Google Pay). We never see or store your card details.",
  },
  {
    id: "bank",
    label: "Bank transfer",
    note: "We'll email our bank details with your order number. Your order ships once the payment arrives.",
  },
];

export type OrderStatus =
  | "pending_payment"
  | "awaiting_bank_transfer"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export const orderStatusLabel: Record<OrderStatus, string> = {
  pending_payment: "Awaiting payment",
  awaiting_bank_transfer: "Awaiting bank transfer",
  paid: "Paid",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

export const usStates: [code: string, name: string][] = [
  ["AL", "Alabama"], ["AK", "Alaska"], ["AZ", "Arizona"], ["AR", "Arkansas"], ["CA", "California"],
  ["CO", "Colorado"], ["CT", "Connecticut"], ["DE", "Delaware"], ["DC", "District of Columbia"],
  ["FL", "Florida"], ["GA", "Georgia"], ["HI", "Hawaii"], ["ID", "Idaho"], ["IL", "Illinois"],
  ["IN", "Indiana"], ["IA", "Iowa"], ["KS", "Kansas"], ["KY", "Kentucky"], ["LA", "Louisiana"],
  ["ME", "Maine"], ["MD", "Maryland"], ["MA", "Massachusetts"], ["MI", "Michigan"],
  ["MN", "Minnesota"], ["MS", "Mississippi"], ["MO", "Missouri"], ["MT", "Montana"],
  ["NE", "Nebraska"], ["NV", "Nevada"], ["NH", "New Hampshire"], ["NJ", "New Jersey"],
  ["NM", "New Mexico"], ["NY", "New York"], ["NC", "North Carolina"], ["ND", "North Dakota"],
  ["OH", "Ohio"], ["OK", "Oklahoma"], ["OR", "Oregon"], ["PA", "Pennsylvania"],
  ["RI", "Rhode Island"], ["SC", "South Carolina"], ["SD", "South Dakota"], ["TN", "Tennessee"],
  ["TX", "Texas"], ["UT", "Utah"], ["VT", "Vermont"], ["VA", "Virginia"], ["WA", "Washington"],
  ["WV", "West Virginia"], ["WI", "Wisconsin"], ["WY", "Wyoming"],
];

/**
 * Countries a customer can ship to (ISO 3166-1 alpha-2). Left out: uninhabited territories,
 * and Cuba, Iran, North Korea and Syria, which are under comprehensive US export sanctions.
 */
const countryCodes = (
  "AF AX AL DZ AS AD AO AI AG AR AM AW AU AT AZ BS BH BD BB BY BE BZ BJ BM BT BO BQ BA BW BR IO BN BG BF BI CV KH CM CA KY " +
  "CF TD CL CN CX CC CO KM CG CD CK CR CI HR CW CY CZ DK DJ DM DO EC EG SV GQ ER EE SZ ET FK FO FJ FI FR GF PF GA GM GE DE " +
  "GH GI GR GL GD GP GU GT GG GN GW GY HT VA HN HK HU IS IN ID IQ IE IM IL IT JM JP JE JO KZ KE KI KR XK KW KG LA LV LB LS " +
  "LR LY LI LT LU MO MG MW MY MV ML MT MH MQ MR MU YT MX FM MD MC MN ME MS MA MZ MM NA NR NP NL NC NZ NI NE NG NU NF MK MP " +
  "NO OM PK PW PS PA PG PY PE PH PN PL PT PR QA RE RO RU RW BL SH KN LC MF PM VC WS SM ST SA SN RS SC SL SG SX SK SI SB SO " +
  "ZA SS ES LK SD SR SJ SE CH TW TJ TZ TH TL TG TK TO TT TN TR TM TC TV UG UA AE GB US UY UZ VU VE VN VG VI WF EH YE ZM ZW"
).split(" ");

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

export function countryName(code: string) {
  try {
    return regionNames.of(code) ?? code;
  } catch {
    return code;
  }
}

/** [code, name] pairs: United States first, then A–Z. */
export const countries: [code: string, name: string][] = [
  ["US", countryName("US")],
  ...countryCodes
    .filter((code) => code !== "US")
    .map((code): [string, string] => [code, countryName(code)])
    .sort((a, b) => a[1].localeCompare(b[1])),
];

export const countryCodeSet = new Set(countryCodes);

/** Shipping address as display lines, e.g. "Houston, TX 77084" then "United States". */
export function addressLines(address: {
  company: string | null;
  address1: string;
  address2: string | null;
  city: string;
  state: string;
  zip: string;
  country: string;
}) {
  const region = [address.state, address.zip].filter(Boolean).join(" ");
  return [address.company, address.address1, address.address2, [address.city, region].filter(Boolean).join(", "), countryName(address.country)].filter(
    (line): line is string => Boolean(line),
  );
}
