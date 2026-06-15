import { redirect } from "next/navigation";
import { getAdminToken, adminFetch } from "../../lib/api";
import { AdminShell, type NavGroup } from "../../components/AdminShell";

/** Read theme/addon/flag settings and surface them as:
 *   - `theme`: { primary_color, secondary_color, … } for CSS variables
 *   - `disabledAddons`: a Set of addon keys whose `.enabled` is false → used
 *      to hide sidebar menu items.
 *   - `disabledFlags`: same for feature flags. */
async function loadShellSettings() {
  try {
    const [theme, addons, flags, branding] = await Promise.all([
      adminFetch<{ settings: Array<{ key: string; value: string | null }> }>("/admin/business-settings?prefix=theme."),
      adminFetch<{ settings: Array<{ key: string; value: string | null }> }>("/admin/business-settings?prefix=addon."),
      adminFetch<{ settings: Array<{ key: string; value: string | null }> }>("/admin/business-settings?prefix=flag."),
      adminFetch<{ settings: Array<{ key: string; value: string | null }> }>("/admin/business-settings?prefix=invoice."),
    ]);
    const themeMap = new Map(theme.settings.map((s) => [s.key, s.value]));
    const isTrue = (v: string | null | undefined) => /^(true|1|yes|on)$/i.test((v ?? "").trim());

    const disabledAddons = new Set<string>();
    for (const s of addons.settings) {
      const m = s.key.match(/^addon\.([^.]+)\.enabled$/);
      if (m && !isTrue(s.value)) disabledAddons.add(m[1]);
    }
    const disabledFlags = new Set<string>();
    for (const s of flags.settings) {
      const m = s.key.match(/^flag\.([^.]+)\.enabled$/);
      if (m && !isTrue(s.value)) disabledFlags.add(m[1]);
    }
    const brandName = new Map(branding.settings.map((s) => [s.key, s.value])).get("invoice.short_name");
    return {
      theme: {
        primary: themeMap.get("theme.primary_color") ?? "#10b981",
        secondary: themeMap.get("theme.secondary_color") ?? "#0f766e",
        danger: themeMap.get("theme.danger_color") ?? "#e11d48",
        appPrimary: themeMap.get("theme.app_primary") ?? "#f97316",
      },
      brandName: brandName || themeMap.get("theme.brand_name") || "Eatofine",
      tagline: themeMap.get("theme.tagline") ?? "Admin Panel",
      disabledAddons,
      disabledFlags,
    };
  } catch {
    return {
      theme: { primary: "#10b981", secondary: "#0f766e", danger: "#e11d48", appPrimary: "#f97316" },
      brandName: "Eatofine",
      tagline: "Admin Panel",
      disabledAddons: new Set<string>(),
      disabledFlags: new Set<string>(),
    };
  }
}

/** Sidebar items keyed by addon/feature name — when an addon is disabled
 *  in settings, the corresponding menu entry is removed before rendering. */
const ADDON_GATED_HREFS: Record<string, string[]> = {
  subscription: ["/dashboard/subscription-orders", "/dashboard/subscription-packages"],
  loyalty: ["/dashboard/loyalty-points"],
  openai: [],
  multi_currency: ["/dashboard/currencies"],
  advanced_tax: ["/dashboard/tax-engine"],
  referral: [],
  gift_cards: [],
  tipping: [],
};

function filterNav(nav: NavGroup[], disabledAddons: Set<string>): NavGroup[] {
  // Collect every href to hide based on disabled addons.
  const hiddenHrefs = new Set<string>();
  for (const addonKey of disabledAddons) {
    for (const href of ADDON_GATED_HREFS[addonKey] ?? []) hiddenHrefs.add(href);
  }
  if (hiddenHrefs.size === 0) return nav;

  return nav.map((g) => ({
    ...g,
    items: g.items
      .filter((i) => !hiddenHrefs.has(i.href))
      .map((i) => ({
        ...i,
        children: i.children?.filter((c) => !hiddenHrefs.has(c.href)),
      }))
      .filter((i) => !i.children || i.children.length > 0 || !i.href.startsWith("#")),
  })).filter((g) => g.items.length > 0);
}

const NAV: NavGroup[] = [
  {
    section: null,
    items: [
      { href: "/dashboard", label: "Dashboard", icon: "home" },
      { href: "/dashboard/pos", label: "POS", icon: "cart" },
    ],
  },
  {
    section: "ORDER MANAGEMENT",
    items: [
      {
        href: "#orders-group",
        label: "Orders",
        icon: "orders",
        children: [
          { href: "/dashboard/orders", label: "All Orders", icon: "orders" },
          { href: "/dashboard/orders?type=take_away", label: "Take Away", icon: "package" },
          { href: "/dashboard/orders?type=dine_in", label: "Dine In", icon: "food" },
        ],
      },
      { href: "/dashboard/subscription-orders", label: "Subscription Orders", icon: "calendar" },
      { href: "/dashboard/dispatch", label: "Dispatch", icon: "compass" },
      { href: "/dashboard/refunds", label: "Order Refunds", icon: "refunds" },
      {
        href: "#order-reasons",
        label: "Reasons",
        icon: "faq",
        children: [
          { href: "/dashboard/order-cancel-reasons", label: "Cancellation Reasons", icon: "cancel" },
          { href: "/dashboard/refund-reasons", label: "Refund Reasons", icon: "refunds" },
        ],
      },
    ],
  },
  {
    section: "RESTAURANT MANAGEMENT",
    items: [
      { href: "/dashboard/zones?for=restaurant", label: "Zone Setup", icon: "zone" },
      { href: "/dashboard/cuisines", label: "Cuisine", icon: "cuisine" },
      {
        href: "#restaurants-group",
        label: "Restaurants",
        icon: "restaurant",
        children: [
          { href: "/dashboard/restaurants", label: "All Restaurants", icon: "restaurant" },
          { href: "/dashboard/restaurants/add", label: "Add New", icon: "addon" },
          { href: "/dashboard/restaurants-pending", label: "Joining Requests", icon: "shield" },
          { href: "/dashboard/restaurants/bulk", label: "Bulk Import / Export", icon: "ledger" },
        ],
      },
      {
        href: "#restaurant-finance",
        label: "Disbursement & Payouts",
        icon: "bank",
        children: [
          { href: "/dashboard/disbursements?type=restaurant", label: "Restaurant Disbursement", icon: "bank" },
          { href: "/dashboard/withdraw-requests?type=restaurant", label: "Withdraw Requests", icon: "cash" },
          { href: "/dashboard/withdrawal-methods", label: "Withdrawal Methods", icon: "bank" },
        ],
      },
    ],
  },
  {
    section: "FOOD MANAGEMENT",
    items: [
      {
        href: "#food-group",
        label: "Foods",
        icon: "food",
        children: [
          { href: "/dashboard/food", label: "All Foods", icon: "food" },
          { href: "/dashboard/food/add", label: "Add New", icon: "addon" },
          { href: "/dashboard/food-pending", label: "New Food Requests", icon: "shield" },
          { href: "/dashboard/reviews", label: "Reviews", icon: "star" },
          { href: "/dashboard/food/bulk", label: "Bulk Import / Export", icon: "ledger" },
        ],
      },
      {
        href: "#categories-group",
        label: "Categories",
        icon: "category",
        children: [
          { href: "/dashboard/categories", label: "Category", icon: "category" },
          { href: "/dashboard/categories/sub", label: "Sub Category", icon: "category" },
          { href: "/dashboard/categories/bulk", label: "Bulk Import / Export", icon: "ledger" },
        ],
      },
      {
        href: "#addons",
        label: "Add-ons",
        icon: "addon",
        children: [
          { href: "/dashboard/add-ons", label: "Add-ons", icon: "addon" },
          { href: "/dashboard/addon-categories", label: "Addon Categories", icon: "category" },
        ],
      },
      {
        href: "#tagging",
        label: "Attributes & Tags",
        icon: "tag",
        children: [
          { href: "/dashboard/attributes", label: "Attributes", icon: "attribute" },
          { href: "/dashboard/tags", label: "Tags", icon: "tag" },
        ],
      },
    ],
  },
  {
    section: "PROMOTIONS MANAGEMENT",
    items: [
      { href: "/dashboard/campaigns", label: "Campaigns", icon: "campaign" },
      { href: "/dashboard/coupons", label: "Coupons", icon: "coupon" },
      {
        href: "#banners-ads",
        label: "Banners & Ads",
        icon: "banner",
        children: [
          { href: "/dashboard/banners", label: "Banners", icon: "banner" },
          { href: "/dashboard/promotional-banners", label: "Promotional Banners", icon: "banner" },
          { href: "/dashboard/advertisements", label: "Advertisements", icon: "ads" },
        ],
      },
      {
        href: "#rewards",
        label: "Rewards",
        icon: "star",
        children: [
          { href: "/dashboard/cash-backs", label: "Cashback", icon: "cashback" },
          { href: "/dashboard/wallet-bonuses", label: "Wallet Bonuses", icon: "wallet" },
        ],
      },
      { href: "/dashboard/notifications", label: "Push Notifications", icon: "bell" },
    ],
  },
  {
    section: "ENHANCEMENTS",
    items: [
      { href: "/dashboard/business-plans", label: "Business Plans", badge: "new", icon: "plan" },
      { href: "/dashboard/additional-charges", label: "Additional Charges", badge: "new", icon: "extra" },
      {
        href: "#tax-gst",
        label: "GST",
        badge: "new",
        icon: "tax",
        children: [
          { href: "/dashboard/tax-engine", label: "GST Engine", icon: "tax" },
          { href: "/dashboard/invoices", label: "GST Invoices", icon: "invoice" },
          { href: "/dashboard/invoice-setup", label: "Invoice Setup", icon: "settings" },
        ],
      },
      {
        href: "#tds",
        label: "TDS",
        badge: "new",
        icon: "tds",
        children: [
          { href: "/dashboard/tds", label: "TDS Reports", icon: "tds" },
          { href: "/dashboard/tds/settings", label: "TDS Settings", icon: "settings" },
        ],
      },
      {
        href: "#delivery-charges",
        label: "Delivery Charges",
        badge: "new",
        icon: "bike",
        children: [
          { href: "/dashboard/delivery-partner-charges", label: "Partner Charges", icon: "bike" },
          { href: "/dashboard/user-delivery-charges", label: "User Charges", icon: "bike" },
        ],
      },
      {
        href: "#compliance",
        label: "Documents",
        badge: "new",
        icon: "shield",
        children: [
          { href: "/dashboard/document-categories", label: "Document Master", icon: "settings" },
          { href: "/dashboard/submitted-documents", label: "Review Queue", icon: "shield" },
          { href: "/dashboard/fraud-flags", label: "Fraud Flags", icon: "shield" },
        ],
      },
      {
        href: "#billing-automation",
        label: "Billing",
        badge: "new",
        icon: "invoice",
        children: [
          { href: "/dashboard/vendor-invoices", label: "Vendor Invoices", icon: "invoice" },
          { href: "/dashboard/credit-notes", label: "Credit Notes", icon: "invoice" },
        ],
      },
      { href: "/dashboard/vendor-promotions", label: "Vendor Promotions", badge: "new", icon: "extra" },
      { href: "/dashboard/platform-settings", label: "Platform Settings", badge: "new", icon: "settings" },
    ],
  },
  {
    section: "USER MANAGEMENT",
    items: [
      {
        href: "#customers-group",
        label: "Customers",
        icon: "user",
        children: [
          { href: "/dashboard/users", label: "All Customers", icon: "user" },
          { href: "/dashboard/customer-wallet-fund", label: "Add Wallet Fund", icon: "wallet" },
          { href: "/dashboard/newsletter", label: "Newsletter Subscribers", icon: "comment" },
        ],
      },
      {
        href: "#delivery-men-group",
        label: "Delivery Men",
        icon: "bike",
        children: [
          { href: "/dashboard/delivery-men", label: "All Delivery Men", icon: "bike" },
          { href: "/dashboard/delivery-men/add", label: "Add New", icon: "addon" },
          { href: "/dashboard/delivery-men-pending", label: "Joining Requests", icon: "shield" },
          { href: "/dashboard/zones?for=deliveryman", label: "Zone Setup", icon: "zone" },
          { href: "/dashboard/vehicles", label: "Vehicle Category Setup", icon: "car" },
          { href: "/dashboard/shifts", label: "Shift Setup", icon: "clock" },
          { href: "/dashboard/dm-bonuses", label: "Bonuses", icon: "star" },
          { href: "/dashboard/dm-incentives", label: "Incentives", icon: "currency" },
          { href: "/dashboard/dm-incentives/history", label: "Incentives History", icon: "ledger" },
          { href: "/dashboard/dm-reviews", label: "Reviews", icon: "star" },
          { href: "/dashboard/disbursements?type=deliveryman", label: "DM Disbursement", icon: "bank" },
          { href: "/dashboard/dm-earnings", label: "DM Earnings", icon: "currency" },
          { href: "/dashboard/withdraw-requests?type=deliveryman", label: "DM Withdraw Requests", icon: "cash" },
        ],
      },
      {
        href: "#staff",
        label: "Staff",
        icon: "users",
        children: [
          { href: "/dashboard/employees", label: "Employees", icon: "users" },
          { href: "/dashboard/admin-roles", label: "Admin Roles", icon: "shield" },
        ],
      },
    ],
  },
  {
    section: "FINANCIAL MANAGEMENT",
    items: [
      {
        href: "#fin-transactions",
        label: "Transactions",
        icon: "transactions",
        children: [
          { href: "/dashboard/account-transactions", label: "Account Transactions", icon: "transactions" },
          { href: "/dashboard/wallet-transactions", label: "Wallet Ledger", icon: "ledger" },
          { href: "/dashboard/wallet-ledger", label: "Refund Wallet Audit", icon: "ledger" },
        ],
      },
      {
        href: "#fin-rewards-history",
        label: "Rewards History",
        icon: "history",
        children: [
          { href: "/dashboard/loyalty-points", label: "Loyalty Points", icon: "star" },
          { href: "/dashboard/cashback-histories", label: "Cashback History", icon: "history" },
        ],
      },
      { href: "/dashboard/offline-payment-methods", label: "Offline Payments", icon: "card" },
    ],
  },
  {
    section: "CONTACT",
    items: [
      // Reviews moved into their own sections: Food → Food Management,
      // Deliveryman → Delivery Men.
      { href: "/dashboard/contact-messages", label: "Contact Messages", icon: "comment" },
    ],
  },
  {
    section: "CONTENT",
    items: [
      { href: "/dashboard/pages", label: "Pages (T&C, Privacy…)", icon: "comment" },
      { href: "/dashboard/landing-page", label: "Landing Page", icon: "home" },
      { href: "/dashboard/email-templates", label: "Email Templates", icon: "comment" },
      {
        href: "#cms-misc",
        label: "Marketing",
        icon: "share",
        children: [
          { href: "/dashboard/faqs", label: "FAQs", icon: "faq" },
          { href: "/dashboard/page-seo", label: "Page SEO", icon: "seo" },
          { href: "/dashboard/social-media", label: "Social Media", icon: "share" },
        ],
      },
    ],
  },
  {
    section: "SYSTEM",
    items: [
      {
        href: "#reports-group",
        label: "Reports",
        icon: "chart",
        children: [
          { href: "/dashboard/reports", label: "Overview", icon: "chart" },
          { href: "/dashboard/reports/transaction", label: "Transaction", icon: "transactions" },
          { href: "/dashboard/reports/expense", label: "Expense", icon: "currency" },
          { href: "/dashboard/reports/disbursement", label: "Disbursement", icon: "bank" },
          { href: "/dashboard/reports/food", label: "Food", icon: "food" },
          { href: "/dashboard/reports/order", label: "Regular Order Report", icon: "orders" },
          { href: "/dashboard/reports/order/campaign", label: "Campaign Order Report", icon: "orders" },
          { href: "/dashboard/reports/restaurant", label: "Restaurant", icon: "restaurant" },
          { href: "/dashboard/reports/customer", label: "Customer", icon: "user" },
          { href: "/dashboard/reports/tax", label: "GST", icon: "tax" },
          { href: "/dashboard/reports/admin-earning", label: "Admin Earning", icon: "currency" },
          { href: "/dashboard/reports/restaurant-earning", label: "Restaurant Earning", icon: "currency" },
          { href: "/dashboard/reports/deliveryman-earning", label: "Deliveryman Earning", icon: "currency" },
        ],
      },
      {
        href: "#sys-business",
        label: "Business Settings",
        icon: "settings",
        children: [
          { href: "/dashboard/business-settings", label: "Business Setup", icon: "settings" },
          { href: "/dashboard/currencies", label: "Currency", icon: "currency" },
        ],
      },
      { href: "/dashboard/theme-settings", label: "Theme Settings", icon: "settings" },
      { href: "/dashboard/login-setup", label: "Login Setup", icon: "shield" },
      { href: "/dashboard/app-settings", label: "App & Web Settings", icon: "settings" },
      {
        href: "#sys-notifications",
        label: "Notifications",
        icon: "bell",
        children: [
          { href: "/dashboard/notification-channels", label: "Channels", icon: "bell" },
          { href: "/dashboard/notification-messages", label: "Messages", icon: "comment" },
        ],
      },
      { href: "/dashboard/translations", label: "Translations", icon: "translate" },
      {
        href: "#sys-thirdparty",
        label: "3rd Party & Configurations",
        icon: "settings",
        children: [
          { href: "/dashboard/third-party-config", label: "3rd Party", icon: "settings" },
          { href: "/dashboard/payment-gateways", label: "Payment Gateways", icon: "card" },
          { href: "/dashboard/firebase-notification", label: "Firebase Notification", icon: "bell" },
          { href: "/dashboard/offline-payment-methods", label: "Offline Payment Setup", icon: "card" },
          { href: "/dashboard/join-us-setup", label: "Join Us Page Setup", icon: "comment" },
          { href: "/dashboard/analytics-script", label: "Analytics Script", icon: "history" },
          { href: "/dashboard/ai-setup", label: "AI Setup", icon: "settings" },
        ],
      },
      {
        href: "#sys-subscription",
        label: "Subscription Management",
        icon: "package",
        children: [
          { href: "/dashboard/subscription-packages", label: "Subscription Packages", icon: "package" },
          { href: "/dashboard/subscription-orders", label: "Subscriber List", icon: "calendar" },
          { href: "/dashboard/subscription-settings", label: "Settings", icon: "settings" },
        ],
      },
      { href: "/dashboard/gallery", label: "Gallery / Files", icon: "settings" },
      { href: "/dashboard/system-addons", label: "System Addons", icon: "settings" },
      { href: "/dashboard/addon-activation", label: "Addon Activation", icon: "settings" },
      { href: "/dashboard/activity-log", label: "Activity Log", icon: "history" },
      { href: "/dashboard/clean-database", label: "Clean Database", icon: "cancel" },
    ],
  },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const token = await getAdminToken();
  if (!token) redirect("/login");

  // Pull theme + addon gating from settings — applied on every nav render.
  const settings = await loadShellSettings();
  const filteredNav = filterNav(NAV, settings.disabledAddons);

  // Inject as inline CSS variables so existing utility classes pick them up.
  // The classes `bg-emerald-X` etc. already point at these vars via tailwind
  // theme; this overrides per-instance for the dashboard scope.
  const themeStyle = `:root {
    --color-primary: ${settings.theme.primary};
    --color-secondary: ${settings.theme.secondary};
    --color-danger: ${settings.theme.danger};
    --color-app-primary: ${settings.theme.appPrimary};
  }`;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: themeStyle }} />
      <AdminShell
        nav={filteredNav}
        fullName="Super Admin"
        role="Administrator"
        email="admin@admin.com"
        brandName={settings.brandName}
        tagline={settings.tagline}
      >
        {children}
      </AdminShell>
    </>
  );
}
