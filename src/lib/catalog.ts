/**
 * DUMMY CATALOGUE.
 *
 * Category and brand structure follows the client's site specification (STNIT_content.pdf).
 * Product photos come from the client's current website; categories without photos use
 * placeholder illustrations (public/images/catalog/*.webp, drawn for this demo).
 * Every product, price, stock level, specification, rating and review count below is
 * placeholder data. Replace with the client's real catalogue before launch.
 */

export type ProductImage = { src: string };

const img = {
  // Client photos
  cacheMemory: { src: "/images/catalog/cache-memory.webp" },
  xeon: { src: "/images/catalog/xeon.webp" },
  xeonAlt: { src: "/images/catalog/xeon-tile.webp" },
  adaptor: { src: "/images/catalog/adaptor.webp" },
  printer: { src: "/images/catalog/printer.webp" },
  inverter: { src: "/images/catalog/inverter.webp" },
  elitebook: { src: "/images/catalog/elitebook.webp" },
  spectre: { src: "/images/catalog/spectre.webp" },
  speakers: { src: "/images/catalog/speakers.webp" },
  converter: { src: "/images/catalog/converter.webp" },
  board: { src: "/images/catalog/board.webp" },
  // Placeholder illustrations: only for products without a manufacturer photo yet
  // (manufacturer photos live in /public/images/products, named by part number).
  hdd: { src: "/images/catalog/hdd.webp" },
  ssd: { src: "/images/catalog/ssd.webp" },
  ram: { src: "/images/catalog/ram.webp" },
  motherboard: { src: "/images/catalog/motherboard.webp" },
  server: { src: "/images/catalog/server.webp" },
  switch: { src: "/images/catalog/switch.webp" },
  router: { src: "/images/catalog/router.webp" },
  nas: { src: "/images/catalog/nas.webp" },
  san: { src: "/images/catalog/san.webp" },
  psu: { src: "/images/catalog/psu.webp" },
} satisfies Record<string, ProductImage>;

// ---------------------------------------------------------------------------
// Categories (from the client spec) with child categories
// ---------------------------------------------------------------------------

export type ChildCategory = { slug: string; name: string };

export type Category = {
  slug: string;
  name: string;
  short: string;
  description: string;
  image: ProductImage;
  children: ChildCategory[];
};

export const categories: Category[] = [
  {
    slug: "hard-drives",
    name: "Hard Drives (HDD, SSD)",
    short: "Hard Drives",
    description: "Enterprise SATA and SAS hard drives and solid-state drives for servers, storage and workstations.",
    image: { src: "/images/products/st4000nm000a.jpg" },
    children: [
      { slug: "hdd", name: "Hard Disk Drives (HDD)" },
      { slug: "ssd", name: "Solid State Drives (SSD)" },
    ],
  },
  {
    slug: "memory",
    name: "Memory (RAM)",
    short: "Memory",
    description: "Server memory modules and RAID controller cache memory.",
    image: { src: "/images/products/m393a4k40db2-cvf.jpg" },
    children: [
      { slug: "server-memory", name: "Server Memory" },
      { slug: "cache-memory", name: "Cache Memory" },
    ],
  },
  {
    slug: "processors",
    name: "CPUs / Processors",
    short: "Processors",
    description: "Intel Xeon server processors for upgrades, spares and new builds.",
    image: img.xeon,
    children: [{ slug: "server-processors", name: "Server Processors" }],
  },
  {
    slug: "motherboards",
    name: "Motherboards",
    short: "Motherboards",
    description: "Server system boards and processing boards, tested before dispatch.",
    image: img.motherboard,
    children: [
      { slug: "server-motherboards", name: "Server Motherboards" },
      { slug: "processing-boards", name: "Processing Boards" },
    ],
  },
  {
    slug: "servers-workstations",
    name: "Servers & Workstations",
    short: "Servers",
    description: "Rack servers, business laptops and mobile workstations, new and refurbished.",
    image: { src: "/images/products/868703-b21.png" },
    children: [
      { slug: "rack-servers", name: "Rack Servers" },
      { slug: "laptops-workstations", name: "Laptops & Workstations" },
    ],
  },
  {
    slug: "networking",
    name: "Networking Equipment",
    short: "Networking",
    description: "Switches and routers for offices, branches and data centers.",
    image: { src: "/images/products/jl253a.png" },
    children: [
      { slug: "switches", name: "Switches" },
      { slug: "routers", name: "Routers" },
    ],
  },
  {
    slug: "power-supplies",
    name: "Power Supplies",
    short: "Power",
    description: "Server power supplies, AC-DC adaptors and power inverters.",
    image: { src: "/images/products/450-aebn.jpg" },
    children: [
      { slug: "server-power-supplies", name: "Server Power Supplies" },
      { slug: "adaptors", name: "AC-DC Adaptors" },
      { slug: "inverters", name: "Power Inverters" },
    ],
  },
  {
    slug: "storage-arrays",
    name: "Storage Arrays",
    short: "Storage",
    description: "NAS systems and SAN storage arrays for backup, file sharing and virtualisation.",
    image: { src: "/images/products/rs1221-plus.webp" },
    children: [
      { slug: "nas", name: "NAS Systems" },
      { slug: "san", name: "SAN Storage" },
    ],
  },
  {
    slug: "accessories",
    name: "Accessories",
    short: "Accessories",
    description: "Label printers, speakers, converters and cables.",
    image: img.printer,
    children: [
      { slug: "label-printers", name: "Label Printers" },
      { slug: "speakers", name: "Speakers" },
      { slug: "cables-converters", name: "Cables & Converters" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Brands
// ---------------------------------------------------------------------------

/**
 * `logo`: monochrome SVG in /public/brands (Simple Icons artwork, viewBox cropped to the mark;
 * the trademarks belong to their owners). `wordmark`: the logo spells the name, so it is shown
 * on its own; symbol-only logos are shown with the name beside them. `color`: the brand's logo
 * colour (Simple Icons brand hex; Synology uses its dark wordmark colour instead of the light grey).
 */
export type Brand = { slug: string; name: string; featured?: boolean; logo?: string; wordmark?: boolean; color?: string };

export const brands: Brand[] = [
  { slug: "dell", name: "Dell", featured: true, logo: "/brands/dell.svg", wordmark: true, color: "#007DB8" },
  { slug: "hp", name: "HP", featured: true, logo: "/brands/hp.svg", wordmark: true, color: "#0096D6" },
  { slug: "ibm", name: "IBM", featured: true, logo: "/brands/ibm.svg", wordmark: true, color: "#052FAD" },
  { slug: "cisco", name: "Cisco", featured: true, logo: "/brands/cisco.svg", wordmark: true, color: "#1BA0D7" },
  { slug: "seagate", name: "Seagate", featured: true, logo: "/brands/seagate.svg", color: "#6EBE49" },
  { slug: "western-digital", name: "Western Digital", featured: true, logo: "/brands/western-digital.svg", color: "#995DFF" },
  { slug: "intel", name: "Intel", logo: "/brands/intel.svg", wordmark: true, color: "#0071C5" },
  { slug: "samsung", name: "Samsung", logo: "/brands/samsung.svg", wordmark: true, color: "#1428A0" },
  { slug: "kingston", name: "Kingston", logo: "/brands/kingston.svg", color: "#000000" },
  { slug: "supermicro", name: "Supermicro", logo: "/brands/supermicro.svg", wordmark: true, color: "#151F6D" },
  { slug: "synology", name: "Synology", logo: "/brands/synology.svg", wordmark: true, color: "#232323" },
  { slug: "aruba", name: "Aruba", color: "#FF8300" },
  { slug: "zebra", name: "Zebra", logo: "/brands/zebra.svg", wordmark: true, color: "#000000" },
  { slug: "logitech", name: "Logitech", logo: "/brands/logitech.svg", color: "#00B8FC" },
  { slug: "trendnet", name: "TRENDnet", color: "#0067B1" },
  { slug: "generic", name: "Generic" },
];

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

export type Stock = "in" | "low" | "out";

export type Product = {
  /** SEO-friendly URL slug: brand-partnumber-childcategory. */
  slug: string;
  name: string;
  brand: string; // brand slug
  mpn: string; // manufacturer part number
  sku: string; // store SKU
  category: string;
  child: string;
  image: ProductImage;
  price: number;
  compareAt?: number;
  condition: "New" | "Refurbished";
  stock: Stock;
  summary: string;
  specs: [string, string][];
  /** Dummy merchandising data. Replace with real figures. */
  rating: number;
  reviews: number;
  sold: number;
  added: string; // ISO date, for "Newest"
  featured?: boolean;
  /** Listed first in its category and sub-category (default "Featured" sort). */
  pinned?: boolean;
};

type Seed = {
  name: string;
  brand: string;
  mpn: string;
  child: string;
  image: ProductImage;
  price: number;
  compareAt?: number;
  condition: "New" | "Refurbished";
  stock?: Stock;
  summary: string;
  specs: [string, string][];
  featured?: boolean;
  pinned?: boolean;
};

function slugify(text: string) {
  return text.toLowerCase().replace(/\+/g, "-plus").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

/** Stable pseudo-random number from a string, so dummy figures don't change between builds. */
function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function inCategory(category: string, prefix: string, seeds: Seed[]): Product[] {
  return seeds.map((seed, index) => {
    const h = hash(seed.mpn);
    const added = new Date(Date.UTC(2026, 10, 10) - (h % 220) * 86400000).toISOString().slice(0, 10);
    return {
      ...seed,
      category,
      stock: seed.stock ?? "in",
      slug: `${seed.brand}-${slugify(seed.mpn)}-${seed.child}`,
      sku: `STN-${prefix}-${String(index + 1).padStart(3, "0")}`,
      rating: Math.round((4 + (h % 10) / 10) * 10) / 10,
      reviews: 4 + (h % 380),
      sold: 10 + (h % 900),
      added,
    };
  });
}

export const products: Product[] = [
  ...inCategory("hard-drives", "HDD", [
    { name: "Seagate Constellation ES 500GB 7200RPM SATA 6Gb/s 3.5\" Hard Drive", brand: "seagate", mpn: "ST500NM0011", child: "hdd", image: { src: "/images/products/st500nm0011.jpg" }, price: 49, compareAt: 59, condition: "Refurbished", summary: "Enterprise-class 500GB SATA drive for servers and storage systems that run around the clock.", featured: true,
      specs: [["Capacity", "500GB"], ["Interface", "SATA 6Gb/s"], ["Spindle speed", "7200 RPM"], ["Form factor", "3.5-inch"], ["Cache", "64MB"]] },
    { name: "Seagate Exos 7E8 4TB 7200RPM SATA 6Gb/s 3.5\" Hard Drive", brand: "seagate", mpn: "ST4000NM000A", child: "hdd", image: { src: "/images/products/st4000nm000a.jpg" }, price: 129, condition: "New", summary: "High-capacity enterprise drive for bulk storage, backup and NAS arrays.",
      specs: [["Capacity", "4TB"], ["Interface", "SATA 6Gb/s"], ["Spindle speed", "7200 RPM"], ["Form factor", "3.5-inch"], ["Cache", "256MB"]] },
    { name: "Western Digital Ultrastar DC HC320 8TB 7200RPM SAS 12Gb/s Hard Drive", brand: "western-digital", mpn: "HUS728T8TAL5204", child: "hdd", image: img.hdd, price: 189, compareAt: 219, condition: "Refurbished", summary: "8TB SAS drive built for data center workloads and high-availability arrays.", featured: true,
      specs: [["Capacity", "8TB"], ["Interface", "SAS 12Gb/s"], ["Spindle speed", "7200 RPM"], ["Form factor", "3.5-inch"], ["Cache", "256MB"]] },
    { name: "Dell 1.2TB 10K RPM SAS 12Gb/s 2.5\" Hot-Plug Hard Drive", brand: "dell", mpn: "400-AJPI", child: "hdd", image: { src: "/images/products/400-ajpi.jpg" }, price: 89, condition: "Refurbished", summary: "Hot-plug SAS drive for Dell PowerEdge servers, supplied with tray.",
      specs: [["Capacity", "1.2TB"], ["Interface", "SAS 12Gb/s"], ["Spindle speed", "10,000 RPM"], ["Form factor", "2.5-inch"], ["Tray", "Included"]] },
    { name: "HP 600GB 10K RPM SAS 6Gb/s 2.5\" SFF Hard Drive", brand: "hp", mpn: "652583-B21", child: "hdd", image: { src: "/images/products/652583-b21.jpg" }, price: 59, condition: "Refurbished", stock: "low", summary: "SFF SAS drive for HP ProLiant Gen8 and Gen9 servers, with SmartCarrier.",
      specs: [["Capacity", "600GB"], ["Interface", "SAS 6Gb/s"], ["Spindle speed", "10,000 RPM"], ["Form factor", "2.5-inch SFF"], ["Tray", "Included"]] },
    { name: "IBM 900GB 10K RPM SAS 6Gb/s 2.5\" Hard Drive", brand: "ibm", mpn: "00AJ081", child: "hdd", image: { src: "/images/products/00aj081.jpg" }, price: 79, condition: "Refurbished", stock: "out", summary: "2.5-inch SAS drive for IBM System x servers.",
      specs: [["Capacity", "900GB"], ["Interface", "SAS 6Gb/s"], ["Spindle speed", "10,000 RPM"], ["Form factor", "2.5-inch"], ["Tray", "Included"]] },
    { name: "Samsung PM883 960GB SATA 6Gb/s 2.5\" Enterprise SSD", brand: "samsung", mpn: "MZ7LH960HAJR", child: "ssd", image: { src: "/images/products/mz7lh960hajr.jpg" }, price: 149, condition: "New", summary: "Data center SATA SSD with power-loss protection for read-intensive workloads.", featured: true,
      specs: [["Capacity", "960GB"], ["Interface", "SATA 6Gb/s"], ["Form factor", "2.5-inch, 7mm"], ["NAND", "V-NAND TLC"], ["Endurance", "1.3 DWPD"]] },
    { name: "Intel D3-S4510 480GB SATA 6Gb/s 2.5\" SSD", brand: "intel", mpn: "SSDSC2KB480G801", child: "ssd", image: img.ssd, price: 99, condition: "Refurbished", summary: "Reliable boot and read-intensive SSD for servers.",
      specs: [["Capacity", "480GB"], ["Interface", "SATA 6Gb/s"], ["Form factor", "2.5-inch, 7mm"], ["NAND", "3D TLC"]] },
    { name: "Dell 1.92TB SAS 12Gb/s Read-Intensive 2.5\" SSD", brand: "dell", mpn: "400-BDOD", child: "ssd", image: img.ssd, price: 299, compareAt: 349, condition: "Refurbished", stock: "low", summary: "Read-intensive SAS SSD for PowerEdge servers, with hot-plug carrier.",
      specs: [["Capacity", "1.92TB"], ["Interface", "SAS 12Gb/s"], ["Form factor", "2.5-inch"], ["Endurance", "Read intensive"], ["Tray", "Included"]] },
    { name: "Western Digital Blue 1TB SATA 6Gb/s 2.5\" SSD", brand: "western-digital", mpn: "WDS100T3B0A", child: "ssd", image: img.ssd, price: 79, compareAt: 89, condition: "New", summary: "Everyday 1TB SSD for desktops and workstations.",
      specs: [["Capacity", "1TB"], ["Interface", "SATA 6Gb/s"], ["Form factor", "2.5-inch, 7mm"], ["Read speed", "Up to 560MB/s"]] },
  ]),
  ...inCategory("memory", "MEM", [
    { name: "Samsung 32GB DDR4-2933 ECC Registered RDIMM", brand: "samsung", mpn: "M393A4K40DB2-CVF", child: "server-memory", image: { src: "/images/products/m393a4k40db2-cvf.jpg" }, price: 89, condition: "New", summary: "32GB dual-rank registered memory for current Intel and AMD servers.", featured: true,
      specs: [["Capacity", "32GB"], ["Type", "DDR4 RDIMM"], ["Speed", "2933 MT/s"], ["ECC", "Yes, registered"], ["Rank", "2Rx4"]] },
    { name: "Kingston 16GB DDR4-2666 ECC Registered RDIMM", brand: "kingston", mpn: "KSM26RS4/16HDI", child: "server-memory", image: { src: "/images/products/ksm26rs4-16hdi.jpg" }, price: 59, compareAt: 69, condition: "New", summary: "Server Premier memory module, validated for leading server boards.",
      specs: [["Capacity", "16GB"], ["Type", "DDR4 RDIMM"], ["Speed", "2666 MT/s"], ["ECC", "Yes, registered"], ["Rank", "1Rx4"]] },
    { name: "HP 64GB DDR4-2933 Load-Reduced LRDIMM", brand: "hp", mpn: "P00930-B21", child: "server-memory", image: img.ram, price: 189, condition: "Refurbished", stock: "low", summary: "High-density LRDIMM for HPE ProLiant Gen10 servers.",
      specs: [["Capacity", "64GB"], ["Type", "DDR4 LRDIMM"], ["Speed", "2933 MT/s"], ["ECC", "Yes"], ["Rank", "2Rx4"]] },
    { name: "Dell 16GB DDR4-2400 ECC Registered RDIMM", brand: "dell", mpn: "A8711887", child: "server-memory", image: { src: "/images/products/a8711887.jpg" }, price: 45, condition: "Refurbished", summary: "Memory upgrade for PowerEdge 13th and 14th generation servers.",
      specs: [["Capacity", "16GB"], ["Type", "DDR4 RDIMM"], ["Speed", "2400 MT/s"], ["ECC", "Yes, registered"], ["Rank", "2Rx8"]] },
    { name: "HP 1GB Flash-Backed Write Cache Module", brand: "hp", mpn: "633542-001", child: "cache-memory", image: img.cacheMemory, price: 89, condition: "Refurbished", summary: "1GB flash-backed write cache for Smart Array P420 and P421 controllers.", featured: true,
      specs: [["Capacity", "1GB"], ["Type", "Flash-backed write cache"], ["Compatible with", "Smart Array P420 / P421"]] },
    { name: "HP 512MB Flash-Backed Write Cache Module", brand: "hp", mpn: "610674-001", child: "cache-memory", image: img.cacheMemory, price: 59, condition: "Refurbished", summary: "512MB FBWC for Smart Array P410 and P212 controllers.",
      specs: [["Capacity", "512MB"], ["Type", "Flash-backed write cache"], ["Compatible with", "Smart Array P410 / P212"]] },
    { name: "HP 2GB Flash-Backed Write Cache Module", brand: "hp", mpn: "631681-B21", child: "cache-memory", image: img.cacheMemory, price: 129, compareAt: 149, condition: "Refurbished", stock: "low", summary: "2GB FBWC for high-throughput Smart Array configurations.",
      specs: [["Capacity", "2GB"], ["Type", "Flash-backed write cache"], ["Compatible with", "Smart Array P420 / P421 / P822"]] },
  ]),
  ...inCategory("processors", "CPU", [
    { name: "Intel Xeon X5675 6-Core 3.06GHz Server Processor", brand: "intel", mpn: "AT80614005913AB", child: "server-processors", image: img.xeon, price: 39, condition: "Refurbished", summary: "Six-core LGA1366 processor for extending the life of existing platforms.", featured: true,
      specs: [["Cores / threads", "6 / 12"], ["Base clock", "3.06GHz"], ["Cache", "12MB"], ["Socket", "LGA1366"], ["TDP", "95W"]] },
    { name: "Intel Xeon X5650 6-Core 2.66GHz Server Processor", brand: "intel", mpn: "AT80614004320AD", child: "server-processors", image: img.xeonAlt, price: 24, condition: "Refurbished", summary: "A cost-effective LGA1366 spare or upgrade.",
      specs: [["Cores / threads", "6 / 12"], ["Base clock", "2.66GHz"], ["Cache", "12MB"], ["Socket", "LGA1366"], ["TDP", "95W"]] },
    { name: "Intel Xeon E5-2670 8-Core 2.6GHz Server Processor", brand: "intel", mpn: "CM8062101038606", child: "server-processors", image: img.xeon, price: 45, compareAt: 59, condition: "Refurbished", summary: "Eight-core LGA2011 processor for virtualisation hosts.",
      specs: [["Cores / threads", "8 / 16"], ["Base clock", "2.6GHz"], ["Cache", "20MB"], ["Socket", "LGA2011"], ["TDP", "115W"]] },
    { name: "Intel Xeon E5-2680 v4 14-Core 2.4GHz Server Processor", brand: "intel", mpn: "CM8066002031103", child: "server-processors", image: img.xeonAlt, price: 89, condition: "Refurbished", stock: "low", summary: "Fourteen-core LGA2011-3 processor for dense multi-threaded workloads.", featured: true,
      specs: [["Cores / threads", "14 / 28"], ["Base clock", "2.4GHz"], ["Cache", "35MB"], ["Socket", "LGA2011-3"], ["TDP", "120W"]] },
    { name: "Intel Xeon Gold 6130 16-Core 2.1GHz Server Processor", brand: "intel", mpn: "CD8067303409000", child: "server-processors", image: img.xeon, price: 229, condition: "Refurbished", summary: "Sixteen-core Scalable processor for modern two-socket servers.",
      specs: [["Cores / threads", "16 / 32"], ["Base clock", "2.1GHz"], ["Cache", "22MB"], ["Socket", "LGA3647"], ["TDP", "125W"]] },
  ]),
  ...inCategory("motherboards", "MBD", [
    { name: "Supermicro X10DRi Dual-Socket LGA2011-3 Server Motherboard", brand: "supermicro", mpn: "MBD-X10DRI-O", child: "server-motherboards", image: img.motherboard, price: 299, condition: "Refurbished", summary: "Dual-socket E-ATX board for Xeon E5-2600 v3/v4 builds.", featured: true,
      specs: [["Sockets", "2 × LGA2011-3"], ["Memory slots", "16 × DDR4"], ["Form factor", "E-ATX"], ["Network", "2 × 1GbE"]] },
    { name: "Dell PowerEdge R630 System Board", brand: "dell", mpn: "0CNCJW", child: "server-motherboards", image: img.motherboard, price: 249, condition: "Refurbished", stock: "low", summary: "Replacement system board for PowerEdge R630 servers.",
      specs: [["Compatible with", "PowerEdge R630"], ["Sockets", "2 × LGA2011-3"], ["Memory slots", "24 × DDR4"]] },
    { name: "HP ProLiant DL380 Gen9 System Board", brand: "hp", mpn: "843307-001", child: "server-motherboards", image: img.motherboard, price: 279, condition: "Refurbished", stock: "out", summary: "Replacement system board for ProLiant DL380 Gen9 servers.",
      specs: [["Compatible with", "ProLiant DL380 Gen9"], ["Sockets", "2 × LGA2011-3"], ["Memory slots", "24 × DDR4"]] },
    { name: "Cisco Multiformat Processing Board", brand: "cisco", mpn: "73-15457-03", child: "processing-boards", image: img.board, price: 549, condition: "Refurbished", stock: "low", summary: "Multiformat processing board, pulled from a working system and tested.", featured: true,
      specs: [["Type", "Processing board"], ["Condition notes", "Tested, pulled from working system"]] },
    { name: "Cisco Video Processing Daughter Board", brand: "cisco", mpn: "73-14628-02", child: "processing-boards", image: img.board, price: 399, compareAt: 449, condition: "Refurbished", summary: "Add-on daughter board for expanding an existing chassis.",
      specs: [["Type", "Daughter board"], ["Condition notes", "Tested before dispatch"]] },
    { name: "Dell PowerEdge R7525 Dual-Socket AMD EPYC System Board", brand: "dell", mpn: "74H08", child: "server-motherboards", image: { src: "/images/products/74h08.jpg" }, price: 7020, condition: "Refurbished", pinned: true, summary: "Replacement system board for PowerEdge R7525 servers, with two SP3 sockets for AMD EPYC 7002 and 7003 processors.",
      specs: [["Compatible with", "PowerEdge R7525"], ["Sockets", "2 × SP3"], ["Processors", "AMD EPYC 7002 / 7003, up to 64 cores each"], ["Memory slots", "32 × DDR4, up to 3200 MT/s"], ["Onboard network", "2 × 1GbE"], ["Alternate part number", "074H08"]] },
  ]),
  ...inCategory("servers-workstations", "SRV", [
    { name: "Dell PowerEdge R640 1U Rack Server", brand: "dell", mpn: "R640-CTO", child: "rack-servers", image: img.server, price: 1899, compareAt: 2149, condition: "Refurbished", summary: "Dense 1U two-socket server for virtualisation and databases, configured to order.", featured: true,
      specs: [["Form factor", "1U rack"], ["Processors", "Up to 2 × Xeon Scalable"], ["Memory", "Up to 24 DIMMs"], ["Drive bays", "10 × 2.5-inch"], ["Power", "Dual redundant PSUs"]] },
    { name: "HPE ProLiant DL380 Gen10 2U Rack Server", brand: "hp", mpn: "868703-B21", child: "rack-servers", image: { src: "/images/products/868703-b21.png" }, price: 2499, condition: "Refurbished", stock: "low", summary: "The versatile 2U workhorse for mixed workloads.",
      specs: [["Form factor", "2U rack"], ["Processors", "Up to 2 × Xeon Scalable"], ["Memory", "Up to 24 DIMMs"], ["Drive bays", "8 × SFF (expandable)"], ["Power", "Dual redundant PSUs"]] },
    { name: "Dell PowerEdge R740 2U Rack Server", brand: "dell", mpn: "R740-CTO", child: "rack-servers", image: img.server, price: 2899, condition: "Refurbished", stock: "out", summary: "2U server with room for GPUs and large storage.",
      specs: [["Form factor", "2U rack"], ["Processors", "Up to 2 × Xeon Scalable"], ["Memory", "Up to 24 DIMMs"], ["Drive bays", "Up to 16 × 2.5-inch"]] },
    { name: "HP Spectre x360 16 2-in-1 Laptop", brand: "hp", mpn: "SPECTRE-X360-16", child: "laptops-workstations", image: img.spectre, price: 1449, condition: "New", summary: "16-inch convertible with a touch display for work that moves between desk and meeting room.", featured: true,
      specs: [["Display", "16-inch touch"], ["Form factor", "2-in-1 convertible"], ["Operating system", "Windows 11"]] },
    { name: "HP EliteBook x360 1040 G6 Business Laptop", brand: "hp", mpn: "7KN26UT", child: "laptops-workstations", image: img.elitebook, price: 689, compareAt: 799, condition: "Refurbished", summary: "14-inch business convertible, refurbished and ready to deploy.",
      specs: [["Display", "14-inch FHD touch"], ["Form factor", "2-in-1 convertible"], ["Operating system", "Windows 11 Pro"]] },
    { name: "HP EliteBook 840 G8 Business Laptop", brand: "hp", mpn: "3C6D3UT", child: "laptops-workstations", image: img.elitebook, price: 579, condition: "Refurbished", summary: "A dependable 14-inch laptop for everyday office work.",
      specs: [["Display", "14-inch FHD"], ["Form factor", "Clamshell"], ["Operating system", "Windows 11 Pro"]] },
  ]),
  ...inCategory("networking", "NET", [
    { name: "Cisco Catalyst 2960X 48-Port Gigabit Switch with 4 SFP", brand: "cisco", mpn: "WS-C2960X-48TS-L", child: "switches", image: img.switch, price: 549, compareAt: 629, condition: "Refurbished", summary: "48-port managed access switch with four SFP uplinks.", featured: true,
      specs: [["Ports", "48 × 1GbE + 4 × SFP"], ["Layer", "Layer 2 managed"], ["Form factor", "1U rack"], ["Power", "Internal AC"]] },
    { name: "Cisco Catalyst 9200L 24-Port Gigabit Switch", brand: "cisco", mpn: "C9200L-24T-4G-E", child: "switches", image: img.switch, price: 899, condition: "New", stock: "low", summary: "Current-generation stackable access switch for growing offices.",
      specs: [["Ports", "24 × 1GbE + 4 × 1G SFP"], ["Layer", "Layer 3 lite"], ["Form factor", "1U rack"]] },
    { name: "Aruba 2930F 24G 4SFP+ Managed Switch", brand: "aruba", mpn: "JL253A", child: "switches", image: { src: "/images/products/jl253a.png" }, price: 699, condition: "Refurbished", summary: "Layer 3 access switch with 10G SFP+ uplinks.",
      specs: [["Ports", "24 × 1GbE + 4 × SFP+"], ["Layer", "Layer 3"], ["Form factor", "1U rack"]] },
    { name: "Cisco ISR 4331 Integrated Services Router", brand: "cisco", mpn: "ISR4331/K9", child: "routers", image: img.router, price: 899, condition: "Refurbished", summary: "Branch router with integrated security and three WAN/LAN ports.", featured: true,
      specs: [["WAN / LAN ports", "3 × GbE"], ["Throughput", "Up to 100 Mbps (300 Mbps with licence)"], ["Form factor", "1U rack"]] },
    { name: "Cisco RV340 Dual WAN Gigabit VPN Router", brand: "cisco", mpn: "RV340-K9-NA", child: "routers", image: img.router, price: 199, compareAt: 229, condition: "New", summary: "Small-business VPN router with dual WAN for failover.",
      specs: [["WAN ports", "2 × GbE"], ["LAN ports", "4 × GbE"], ["VPN", "IPsec, SSL"]] },
  ]),
  ...inCategory("power-supplies", "PWR", [
    { name: "Dell 750W Hot-Plug Redundant Power Supply", brand: "dell", mpn: "450-AEBN", child: "server-power-supplies", image: { src: "/images/products/450-aebn.jpg" }, price: 79, condition: "Refurbished", summary: "Hot-plug 750W PSU for PowerEdge 13th and 14th generation servers.", featured: true,
      specs: [["Output", "750W"], ["Efficiency", "80 PLUS Platinum"], ["Type", "Hot-plug, redundant"]] },
    { name: "HP 800W Flex Slot Platinum Hot-Plug Power Supply", brand: "hp", mpn: "720479-B21", child: "server-power-supplies", image: { src: "/images/products/720479-b21.jpg" }, price: 89, compareAt: 99, condition: "Refurbished", summary: "Flex Slot PSU for ProLiant Gen9 and Gen10 servers.",
      specs: [["Output", "800W"], ["Efficiency", "80 PLUS Platinum"], ["Type", "Flex Slot, hot-plug"]] },
    { name: "AC-DC Desktop Power Adaptor 12V 5A 60W", brand: "generic", mpn: "ADP-12V5A", child: "adaptors", image: img.adaptor, price: 24, condition: "New", summary: "60W desktop power supply for routers, switches and embedded devices.",
      specs: [["Output", "12V DC, 5A (60W)"], ["Input", "100–240V AC"], ["Protection", "Over-voltage, short-circuit"]] },
    { name: "Laptop AC Adaptor 19V 4.74A 90W", brand: "generic", mpn: "ADP-19V90W", child: "adaptors", image: img.adaptor, price: 29, compareAt: 35, condition: "New", summary: "90W replacement laptop charger with mains lead.",
      specs: [["Output", "19V DC, 4.74A (90W)"], ["Input", "100–240V AC"], ["Cable", "Mains lead included"]] },
    { name: "1000W Power Inverter, 12V DC to 120V AC", brand: "generic", mpn: "INV-1000W", child: "inverters", image: img.inverter, price: 119, condition: "New", summary: "1000W vehicle power inverter with grounded AC outlets.",
      specs: [["Continuous output", "1000W"], ["Input", "12V DC"], ["Output", "120V AC"], ["Protection", "Overload, thermal"]] },
    { name: "2000W Power Inverter, 12V DC to 120V AC", brand: "generic", mpn: "INV-2000W", child: "inverters", image: img.inverter, price: 219, compareAt: 249, condition: "New", stock: "low", summary: "2000W inverter for tools, pumps and mobile workstations.",
      specs: [["Continuous output", "2000W"], ["Input", "12V DC"], ["Output", "120V AC"], ["Protection", "Overload, thermal"]] },
  ]),
  ...inCategory("storage-arrays", "STO", [
    { name: "Synology DiskStation DS920+ 4-Bay NAS", brand: "synology", mpn: "DS920+", child: "nas", image: { src: "/images/products/ds920-plus.webp" }, price: 549, condition: "New", summary: "Four-bay NAS for file sharing, backup and surveillance in small offices.", featured: true,
      specs: [["Drive bays", "4 × 3.5/2.5-inch"], ["Memory", "4GB (expandable)"], ["Network", "2 × 1GbE"], ["Drives", "Not included"]] },
    { name: "Synology RackStation RS1221+ 8-Bay Rack NAS", brand: "synology", mpn: "RS1221+", child: "nas", image: { src: "/images/products/rs1221-plus.webp" }, price: 1099, condition: "New", stock: "low", summary: "Eight-bay 2U rack NAS for growing businesses.",
      specs: [["Drive bays", "8 × 3.5/2.5-inch"], ["Memory", "4GB (expandable)"], ["Network", "4 × 1GbE"], ["Form factor", "2U rack"]] },
    { name: "Dell PowerVault ME4012 SAN Storage Array", brand: "dell", mpn: "ME4012", child: "san", image: img.san, price: 3499, condition: "Refurbished", stock: "out", summary: "12-bay SAN array with dual controllers for shared virtualisation storage.",
      specs: [["Drive bays", "12 × 3.5-inch"], ["Controllers", "Dual, active/active"], ["Host interface", "12Gb SAS / 16Gb FC / iSCSI"], ["Form factor", "2U rack"]] },
    { name: "HPE MSA 2050 SAN Dual Controller Array", brand: "hp", mpn: "Q1J01A", child: "san", image: img.san, price: 2899, compareAt: 3199, condition: "Refurbished", summary: "24-bay SFF SAN array with dual controllers.",
      specs: [["Drive bays", "24 × 2.5-inch"], ["Controllers", "Dual"], ["Host interface", "FC / iSCSI"], ["Form factor", "2U rack"]] },
  ]),
  ...inCategory("accessories", "ACC", [
    { name: "Zebra GX420t Thermal Transfer Label Printer", brand: "zebra", mpn: "GX42-102510-000", child: "label-printers", image: img.printer, price: 349, compareAt: 399, condition: "Refurbished", summary: "203 dpi desktop label printer for shipping and barcode labels.", featured: true,
      specs: [["Print method", "Thermal transfer / direct thermal"], ["Resolution", "203 dpi"], ["Connectivity", "USB, serial, parallel"]] },
    { name: "Zebra ZD420t Thermal Transfer Label Printer", brand: "zebra", mpn: "ZD42042-T01000EZ", child: "label-printers", image: img.printer, price: 459, condition: "New", stock: "low", summary: "Current-generation desktop label printer with simple media loading.",
      specs: [["Print method", "Thermal transfer"], ["Resolution", "203 dpi"], ["Connectivity", "USB"]] },
    { name: "Logitech S150 USB Stereo Speakers", brand: "logitech", mpn: "980-000028", child: "speakers", image: img.speakers, price: 19, condition: "New", summary: "USB-powered stereo speakers: one cable for power and audio.",
      specs: [["Connection", "USB"], ["Power", "USB powered"], ["Controls", "Volume and mute"]] },
    { name: "Logitech Z200 Stereo Speakers", brand: "logitech", mpn: "980-000800", child: "speakers", image: img.speakers, price: 39, compareAt: 45, condition: "New", summary: "Fuller sound with adjustable bass for desks and meeting rooms.",
      specs: [["Connection", "3.5mm"], ["Power", "AC"], ["Controls", "Volume, bass"]] },
    { name: "TRENDnet TU-PS2 USB to PS/2 Converter", brand: "trendnet", mpn: "TU-PS2", child: "cables-converters", image: img.converter, price: 14, condition: "New", summary: "Connect a PS/2 keyboard and mouse to one USB port.",
      specs: [["Connectors", "USB-A to 2 × PS/2"], ["Power", "Bus powered"], ["Drivers", "Not required"]] },
    { name: "TRENDnet TU-S9 USB to Serial RS-232 Converter", brand: "trendnet", mpn: "TU-S9", child: "cables-converters", image: img.converter, price: 22, condition: "New", summary: "Add an RS-232 serial port for console access and legacy devices.",
      specs: [["Connectors", "USB-A to DB9 RS-232"], ["Power", "Bus powered"]] },
    { name: "Dell 10GbE SFP+ to SFP+ Passive Copper Twinax Direct Attach Cable, 7m", brand: "dell", mpn: "MV799", child: "cables-converters", image: { src: "/images/products/mv799.jpg" }, price: 108, condition: "New", pinned: true, summary: "7-meter passive copper DAC for 10GbE links between switches, servers and storage: a low-power alternative to optical transceivers.",
      specs: [["Connectors", "SFP+ to SFP+"], ["Speed", "10GbE"], ["Cable type", "Passive copper twinax (DAC)"], ["Length", "7 m (23 ft)"], ["Alternate part numbers", "0MV799, Dell kit 470-AAVI"]] },
  ]),
].sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned))); // pinned first; SKUs are already assigned

// ---------------------------------------------------------------------------
// Lookups
// ---------------------------------------------------------------------------

const productBySlug = new Map(products.map((product) => [product.slug, product]));
const categoryBySlug = new Map(categories.map((category) => [category.slug, category]));
const brandBySlug = new Map(brands.map((brand) => [brand.slug, brand]));

export function getProduct(slug: string) {
  return productBySlug.get(slug);
}
export function getCategory(slug: string) {
  return categoryBySlug.get(slug);
}
export function getChild(categorySlug: string, childSlug: string) {
  return getCategory(categorySlug)?.children.find((child) => child.slug === childSlug);
}
export function getBrand(slug: string) {
  return brandBySlug.get(slug);
}
export function brandName(slug: string) {
  return getBrand(slug)?.name ?? slug;
}
export function productsInCategory(slug: string) {
  return products.filter((product) => product.category === slug);
}
export function productsInChild(categorySlug: string, childSlug: string) {
  return products.filter((product) => product.category === categorySlug && product.child === childSlug);
}
export function productsByBrand(slug: string) {
  return products.filter((product) => product.brand === slug);
}
export function childName(product: Product) {
  return getChild(product.category, product.child)?.name ?? "";
}

export function discountPercent(product: Product): number | null {
  if (!product.compareAt || product.compareAt <= product.price) return null;
  return Math.round(((product.compareAt - product.price) / product.compareAt) * 100);
}

export function lowestPrice(list: Product[]) {
  return Math.min(...list.map((product) => product.price));
}

export const featuredProducts = products.filter((product) => product.featured);
export const dealProducts = products
  .filter((product) => discountPercent(product) !== null && product.stock !== "out")
  .sort((a, b) => (discountPercent(b) ?? 0) - (discountPercent(a) ?? 0));
export const maxDiscount = Math.max(...dealProducts.map((product) => discountPercent(product) ?? 0));
export const bestSellers = [...products].filter((p) => p.stock !== "out").sort((a, b) => b.sold - a.sold);
export const newArrivals = [...products].filter((p) => p.stock !== "out").sort((a, b) => b.added.localeCompare(a.added));

// ---------------------------------------------------------------------------
// Search (name, brand, part number, SKU, category)
// ---------------------------------------------------------------------------

function normalise(text: string) {
  return text.toLowerCase().replace(/[\s\-_/.]+/g, "");
}

const haystacks = new Map(
  products.map((product) => {
    const category = getCategory(product.category);
    const specValues = product.specs.map(([, value]) => value).join(" ");
    const text = `${product.name} ${brandName(product.brand)} ${product.mpn} ${product.sku} ${category?.name ?? ""} ${childName(product)} ${product.summary} ${specValues}`.toLowerCase();
    return [product.slug, { text, compact: normalise(`${product.mpn} ${product.sku}`) }];
  }),
);

/**
 * Every word must appear in the product's text. Part numbers also match with dashes and
 * spaces ignored, so "st500nm" and "ST500-NM0011" both find ST500NM0011.
 */
export function searchProducts(query: string, categorySlug?: string): Product[] {
  const q = query.toLowerCase().trim();
  const pool = categorySlug ? productsInCategory(categorySlug) : products;
  if (!q) return pool;
  const terms = q.split(/\s+/).filter(Boolean);
  const compactQuery = normalise(q);
  return pool.filter((product) => {
    const entry = haystacks.get(product.slug);
    if (!entry) return false;
    if (compactQuery.length >= 4 && entry.compact.includes(compactQuery)) return true;
    return terms.every((term) => entry.text.includes(term));
  });
}

/** True when the query looks like a part number rather than words. */
export function looksLikePartNumber(query: string) {
  const q = query.trim();
  return q.length >= 4 && /\d/.test(q) && !/\s/.test(q);
}

export function searchCategories(query: string) {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return categories.filter(
    (category) => category.name.toLowerCase().includes(q) || category.children.some((child) => child.name.toLowerCase().includes(q)),
  );
}

export function searchBrands(query: string) {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return brands.filter((brand) => brand.name.toLowerCase().startsWith(q));
}
