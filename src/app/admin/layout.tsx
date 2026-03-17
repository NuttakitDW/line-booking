"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

const NAV_ITEMS = [
  { href: "/admin", label: "แดชบอร์ด", icon: "📊" },
  { href: "/admin/schedule", label: "ตารางเวลา", icon: "🗓" },
  { href: "/admin/services", label: "บริการ", icon: "✂️" },
  { href: "/admin/blocked-dates", label: "วันหยุด", icon: "🚫" },
  { href: "/admin/bookings", label: "รายการจอง", icon: "📋" },
  { href: "/admin/settings", label: "ตั้งค่า", icon: "⚙️" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:block">
        <div className="p-6 border-b border-gray-200">
          <h1 className="font-bold text-lg text-gray-800">P&apos;Som Admin</h1>
          <p className="text-xs text-gray-400 mt-1">ระบบจัดการร้าน</p>
        </div>
        <nav className="p-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-4 left-4">
          <button
            onClick={async () => {
              await fetch("/api/admin/auth", { method: "DELETE" });
              window.location.href = "/admin/login";
            }}
            className="text-sm text-gray-400 hover:text-gray-600"
          >
            ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* Mobile nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex justify-around py-2">
          {NAV_ITEMS.slice(0, 5).map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 px-2 py-1 text-xs ${
                  isActive ? "text-blue-600" : "text-gray-400"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 p-6 md:p-8 pb-24 md:pb-8">{children}</main>
    </div>
  );
}
