import { redirect } from "next/navigation";
import { getAdminToken } from "../../lib/api";
import { AdminShell, type NavGroup } from "../../components/AdminShell";

const NAV: NavGroup[] = [
  {
    section: null,
    items: [
      { href: "/dashboard", label: "Dashboard", icon: "home" },
    ],
  },
  {
    section: "ORDER MANAGEMENT",
    items: [
      { href: "/dashboard/orders", label: "Orders", icon: "orders" },
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
      { href: "/dashboard/zones", label: "Zone Setup", icon: "zone" },
      { href: "/dashboard/cuisines", label: "Cuisine", icon: "cuisine" },
      { href: "/dashboard/restaurants", label: "Restaurants", icon: "restaurant" },
      { href: "/dashboard/vendors", label: "Vendors", icon: "vendor" },
    ],
  },
  {
    section: "FOOD MANAGEMENT",
    items: [
      { href: "/dashboard/food", label: "Foods", icon: "food" },
      { href: "/dashboard/categories", label: "Categories", icon: "category" },
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
        label: "Tax & GST",
        badge: "new",
        icon: "tax",
        children: [
          { href: "/dashboard/tax-engine", label: "GST Engine", icon: "tax" },
          { href: "/dashboard/invoices", label: "Tax Invoices", icon: "invoice" },
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
      { href: "/dashboard/users", label: "Customers", icon: "user" },
      { href: "/dashboard/delivery-men", label: "Delivery Men", icon: "bike" },
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
      {
        href: "#fin-payouts",
        label: "Payouts",
        icon: "bank",
        children: [
          { href: "/dashboard/withdraw-requests", label: "Withdraw Requests", icon: "cash" },
          { href: "/dashboard/withdrawal-methods", label: "Withdrawal Methods", icon: "bank" },
          { href: "/dashboard/disbursements", label: "Disbursements", icon: "bank" },
          { href: "/dashboard/dm-earnings", label: "DM Earnings", icon: "currency" },
        ],
      },
      { href: "/dashboard/offline-payment-methods", label: "Offline Payments", icon: "card" },
    ],
  },
  {
    section: "LOGISTICS",
    items: [
      { href: "/dashboard/shifts", label: "Shifts", icon: "clock" },
      { href: "/dashboard/vehicles", label: "Vehicles", icon: "car" },
    ],
  },
  {
    section: "REVIEW & CONTACT",
    items: [
      {
        href: "#reviews",
        label: "Reviews",
        icon: "star",
        children: [
          { href: "/dashboard/reviews", label: "Food Reviews", icon: "star" },
          { href: "/dashboard/dm-reviews", label: "DM Reviews", icon: "star" },
        ],
      },
      { href: "/dashboard/contact-messages", label: "Contact Messages", icon: "comment" },
    ],
  },
  {
    section: "SYSTEM",
    items: [
      { href: "/dashboard/reports", label: "Reports", icon: "chart" },
      { href: "/dashboard/business-settings", label: "Business Settings", icon: "settings" },
      { href: "/dashboard/subscription-packages", label: "Subscription Packages", icon: "package" },
      {
        href: "#sys-content",
        label: "Content",
        icon: "comment",
        children: [
          { href: "/dashboard/faqs", label: "FAQs", icon: "faq" },
          { href: "/dashboard/page-seo", label: "Page SEO", icon: "seo" },
          { href: "/dashboard/social-media", label: "Social Media", icon: "share" },
        ],
      },
      {
        href: "#sys-locale",
        label: "Localization",
        icon: "globe",
        children: [
          { href: "/dashboard/currencies", label: "Currencies", icon: "currency" },
          { href: "/dashboard/translations", label: "Translations", icon: "translate" },
        ],
      },
    ],
  },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const token = await getAdminToken();
  if (!token) redirect("/login");

  return (
    <AdminShell nav={NAV} fullName="Super Admin" role="Administrator" email="admin@admin.com">
      {children}
    </AdminShell>
  );
}
