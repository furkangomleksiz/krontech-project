import type {
  AwardBadge,
  BlogPostDetail,
  BlogPostPreview,
  Datasheet,
  Locale,
  OfficeLocation,
  ProductFeature,
  PublicPageModel,
  StatItem,
} from "@/types/content";

/* ── Generic pages ─────────────────────────────────────────── */

function page(locale: Locale, slug: string, title: string, description: string): PublicPageModel {
  return {
    locale,
    slug,
    seo: { title, description, canonicalPath: slug === "home" ? "" : `/${slug}` },
    hero: {
      title,
      description,
      cta: { label: locale === "tr" ? "Detaylar" : "Learn More", href: "#" },
    },
    sections: [],
  };
}

export const mockPages: Record<string, PublicPageModel> = {
  "tr:home": {
    ...page("tr", "home", "Kron Teknoloji Güvenlik Çözümleri", "Kurumsal erişim güvenliği platformu."),
    sections: [
      { id: "products", type: "feature-grid", heading: "Kron Ürünleri", items: [] },
      { id: "updates", type: "article-list", heading: "Güncel Kal", items: [] },
    ],
  },
  "en:home": {
    ...page("en", "home", "Kron Technology Security Solutions", "Enterprise-grade access security platform."),
    sections: [
      { id: "products", type: "feature-grid", heading: "Kron Products", items: [] },
      { id: "updates", type: "article-list", heading: "Keep up to Date", items: [] },
    ],
  },
  "tr:resources": page(
    "tr",
    "resources",
    "Siber Güvenlik Kaynakları | Kron",
    "Webinarlar, vaka çalışmaları ve veri sayfalarıyla Kron'un Ayrıcalıklı Erişim Yönetimi çözümlerini keşfedin.",
  ),
  "en:resources": page(
    "en",
    "resources",
    "Cybersecurity Resources | Kron",
    "Explore webinars, case studies, and datasheets for Kron's high-end Privileged Access Management solutions.",
  ),
  "tr:contact":   page("tr", "contact", "İletişim", "Bizimle iletişime geçin."),
  "en:contact":   page("en", "contact", "Contact", "Get in touch with us."),
};

/* ── Blog list ─────────────────────────────────────────────── */

export const mockBlogList: BlogPostPreview[] = [
  {
    slug: "human-risk-and-pam",
    locale: "en",
    title: "Your Biggest Security Risk Isn't Human: Fixing Non-Human Identities with Kron PAM",
    excerpt:
      "With the increasing role of organizations in cloud DevOps, and automation-driven infrastructure it's easy to successfully deploy simply, yet fail to govern access. The new category is non-human identities. They compromise service accounts, applications, APIs, scripts, containers.",
    category: "PAM",
    tags: "PAM,Identity,Security",
    readTimeMinutes: 7,
    publishedAt: "2025-03-20",
  },
  {
    slug: "what-is-pam",
    locale: "en",
    title: "What is Privileged Access Management (PAM)?",
    excerpt:
      "Privileged Access Management (PAM) refers to the most effective way to protect the most critical and sensitive accounts in your cybersecurity strategy.",
    category: "PAM",
    tags: "PAM,Basics",
    readTimeMinutes: 5,
    publishedAt: "2025-03-02",
  },
  {
    slug: "data-breach-7-steps",
    locale: "en",
    title: "How to Identify a Data Breach in 7 Steps (CheckList Included)",
    excerpt:
      "Data breaches can start years before they're discovered. Here we've compiled a checklist for you to understand if the enterprise that you're working with has been breached.",
    category: "Security",
    tags: "DataBreach,Incident,Checklist",
    readTimeMinutes: 6,
    publishedAt: "2024-11-07",
  },
  {
    slug: "multi-tenant-pam-msp",
    locale: "en",
    title: "Multi-Tenant Privileged Access Management for MSPs and MSSPs",
    excerpt:
      "To MSPs and MSSPs, privileged access management must go beyond managing privileged accounts. Frameworks such as NIST CMMC, the Cyber Resilience Act 2023, and the UK Cyber Security and Resilience Bill increasingly require multi-tenancy PAM platforms.",
    category: "MSP",
    tags: "MSP,MSSP,PAM,MultiTenant",
    readTimeMinutes: 8,
    publishedAt: "2024-11-01",
  },
  {
    slug: "cyber-insecurity-fractured-world",
    locale: "en",
    title: "Cyber Insecurity in a Fractured World: Why Privileged Access Has Become a Strategic Risk",
    excerpt:
      "Why has cyber insecurity become a top global risk? Learn how rising cyber insecurity, geopolitics, and emerging technologies intersect in the World Economic Forum's Global Cybersecurity Outlook 2025.",
    category: "Strategy",
    tags: "Strategy,CyberRisk,GeoPolicy",
    readTimeMinutes: 6,
    publishedAt: "2024-10-15",
  },
];

export const mockBlogHighlights: BlogPostPreview[] = [
  {
    slug: "cybersecurity-predictions-2024",
    locale: "en",
    title: "2024 Cybersecurity Predictions: What to Expect in the Year Ahead",
    excerpt: "",
    publishedAt: "2024-01-05",
  },
  {
    slug: "zerofox-cybersecurity-funding",
    locale: "en",
    title: "ZeroFox Cybersecurity Funding & Latest News Digest",
    excerpt: "",
    publishedAt: "2024-02-14",
  },
  {
    slug: "privileged-vs-non-privileged",
    locale: "en",
    title: "Privileged vs. Non-Privileged: Understanding Access Tiers",
    excerpt: "",
    publishedAt: "2024-03-07",
  },
  {
    slug: "securing-remote-workers",
    locale: "en",
    title: "Securing Remote Workers with Zero-Trust PAM Architecture",
    excerpt: "",
    publishedAt: "2024-04-19",
  },
  {
    slug: "session-recording-compliance",
    locale: "en",
    title: "Session Recording for Compliance: How Kron PAM Helps",
    excerpt: "",
    publishedAt: "2024-05-28",
  },
];

/* ── Blog detail ───────────────────────────────────────────── */

export const mockBlogDetail: BlogPostDetail = {
  ...mockBlogList[0],
  content: [
    "Your Biggest Security Risk Isn't Human: Fixing Non-Human Identities with Kron PAM",
    "With the increasing role of organizations in cloud DevOps, and automation-driven infrastructure it's easy to successfully deploy simply, yet fail to govern access. The new category is non-human identities. They comprise service accounts, applications, APIs, scripts, containers. These are entities that are less visible than human employees, but often have more privileged access to your infrastructure than any human ever would.",
    "The Hidden Risk: Hardcoded Credentials and Unmanaged Secrets",
    "It is a terrible misapprehension among organizations without a Secrets Management solution that their environments are secure. When there is a machine that has unauthorized administrator passwords, API keys, and tokens left in the environment without any rotation at all, the only question that remains is whether the bad actor who will exploit them is from inside or outside the organization.",
    "Hardcoded credentials are a trap for developers to say the least, but they represent a security threat in the long term too, because the leaked credentials can be used for all manner of lateral movement within the organization's infrastructure.",
    "Kron PAM Secrets Management Agent: Dynamic Credential Access",
    "Kron PAM's Secrets Management Agent is designed to remove credentials from code and replace them with dynamic credentials, just-in-time credential injection and API-based credential retrieval — all in a way that is completely transparent to the application. This removes the problem altogether; applications can access the resources they need, but credentials are never stored anywhere in the application itself.",
  ],
  faq: [
    {
      question: "What is Non-Human Identity management?",
      answer:
        "Non-Human Identity Management refers to the governance of machine identities such as service accounts, application credentials, API keys, and certificates — automated systems that access resources on behalf of people or processes.",
    },
    {
      question: "What are the benefits of using Kron PAM for NHI?",
      answer:
        "Kron PAM provides centralized vaulting, automated rotation, and just-in-time issuance of credentials for non-human identities, reducing the attack surface and eliminating hardcoded secrets from application code.",
    },
    {
      question: "How does Kron PAM manage the Distributed Credential Problem?",
      answer:
        "Kron PAM introduces a multi-approach architecture: it centrally vaults all credentials, enforces rotation policies, and provides ephemeral credentials to applications — so no long-lived secret ever exists outside the vault.",
    },
    {
      question: "What is the advantage of the vaulting mechanism in the Secrets Management Agent?",
      answer:
        "Unlike traditional file-based secrets storage, Kron PAM's vaulting mechanism provides API-driven access, full audit trails, role-based access controls, and automatic rotation without application restart.",
    },
    {
      question: "Can Kron PAM manage Non-Human Identities at scale?",
      answer:
        "Yes. Kron PAM is designed for enterprise deployments with thousands of service accounts. It supports cloud-native environments (Kubernetes, AWS, Azure, GCP) and provides SDK integrations for CI/CD pipelines.",
    },
  ],
};

/* ── Product features ──────────────────────────────────────── */

export const mockProductFeatures: ProductFeature[] = [
  {
    id: "protect",
    title: "Protect What You Connect™",
    titleHighlight: "Connect™",
    description:
      "The Kron PAM Privileged Access Management Suite is known as the best-in-class PAM solution in the marketplace, covering IT, applications, security configurations and efficiency in enterprises and non-human environments.",
    reverse: false,
  },
  {
    id: "unified",
    title: "Unified Management of Privileged Access Control",
    titleHighlight: "Privileged Access Control",
    description:
      "Kron PAM enables IT to efficiently secure file access, used in configurations and infrastructure records of information, as well as any threat to privileged accounts across the entire enterprise — regardless of location or business continuity requirements.",
    reverse: true,
  },
  {
    id: "compliance",
    title: "Regulatory Compliance",
    titleHighlight: "Compliance",
    description:
      "Kron PAM provides tools, capabilities, subscription log records and comprehensive audit records with regulatory compliance including ISO 27001, ISO 31000, SOC 2, HIPAA, NIST 800-53, CIPA, GDPR, SOX, PIPA Compliance for energy, health, and telecommunications.",
    reverse: false,
  },
  {
    id: "secure",
    title: "Stronger, Simpler and More Secure",
    titleHighlight: "More Secure",
    description:
      "The Kron PAM is engineered to support Software-Defined Networks today and into the future. Kron PAM prevents our customers, maintains individual accountability and increases operational efficiency significantly by managing credentials and mitigating privileged actions.",
    reverse: true,
  },
];

/* ── Datasheets ────────────────────────────────────────────── */

export const mockDatasheets: Datasheet[] = [
  { id: "pam",     title: "Kron PAM",                               downloadUrl: "#" },
  { id: "vault",   title: "Password Vault",                          downloadUrl: "#" },
  { id: "session", title: "Session Manager",                         downloadUrl: "#" },
  { id: "mfa",     title: "Multi-Factor Authentication (MFA)",       downloadUrl: "#" },
  { id: "uam",     title: "Unified Access Manager (UAM)",            downloadUrl: "#" },
  { id: "dam",     title: "Data Access Manager & Dynamic Data Masking", downloadUrl: "#" },
  { id: "sra",     title: "Secure Remote Access",                    downloadUrl: "#" },
  { id: "pta",     title: "Privileged Task Automation (PTA)",        downloadUrl: "#" },
];

/* ── Stats ─────────────────────────────────────────────────── */

export const mockStats: StatItem[] = [
  { id: "clients-1",  number: "20+",   label: "Clients\n8 Countries" },
  { id: "clients-2",  number: "200+",  label: "Clients\n30 Countries" },
  { id: "partners",   number: "150+",  label: "Partners\n200+ Partners" },
  { id: "deploys",    number: "1000+", label: "Deployments" },
];

/* ── Award badges ──────────────────────────────────────────── */

export const mockAwards: AwardBadge[] = [
  { id: "gartner",    name: "Gartner Peer Insights",     category: "Hybrid Rated on Gartner Poor Insights", abbrev: "G" },
  { id: "kuppinger",  name: "KuppingerCole Leadership",  category: "Leadership Compass 2025",               abbrev: "KC" },
  { id: "forrester",  name: "Forrester Wave Leader",     category: "Leader",                                abbrev: "F" },
];

/* ── Office locations ──────────────────────────────────────── */

export const mockOffices: OfficeLocation[] = [
  {
    id: "istanbul",
    name: "Kron Istanbul (HQ)",
    email: "info@krontech.com",
    phone: "+90 (212) 266 11 22",
    fax: "+90 (212) 266 12 44",
    address: "17-3 Anadolu Kurumları, YG Binası, K:3 Ofis, No:B401 Maslak-Sariyer, Istanbul",
    imageUrl: "/contact-istanbul.jpg",
    reverse: false,
  },
  {
    id: "usa",
    name: "Kron USA",
    email: "info_us@krontech.com",
    phone: "+1-201-204-0008",
    address: "2 Cid Street, Suite 201, Jersey City, NJ 07302, USA",
    imageUrl: "/contact-usa.jpg",
    reverse: true,
  },
  {
    id: "ankara",
    name: "Kron Ankara",
    email: "info@krontech.com",
    phone: "+90 (312) 284 09 89",
    fax: "+90 (312) 285 08 87",
    address: "Bilkent CyberPark, 2 Ofis No:207 Bilkent, Ankara, 15864",
    imageUrl: "/contact-ankara.jpg",
    reverse: false,
  },
  {
    id: "izmir",
    name: "Kron İzmir",
    email: "info@krontech.com",
    phone: "+90 (232) 464 11 07",
    address: "Akdeniz Mh. Menderes No:2 Konak, İzmir",
    imageUrl: "/contact-izmir.jpg",
    reverse: true,
  },
];
