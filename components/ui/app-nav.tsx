'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Building2, LayoutDashboard, LogOut, FileText, HelpCircle,
  PlusCircle, Shield, Target, Database, ChevronDown, ListChecks,
  Receipt, Tag, Upload, Zap, Leaf, Users, GitCompareArrows,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface NavProps {
  isAdmin: boolean;
  firstName?: string | null;
  role?: string | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function useNavHelpers() {
  const pathname = usePathname();
  const isActive = (href: string, exact = false) =>
    exact ? pathname === href : pathname.startsWith(href);

  const linkCls = (href: string, exact = false) =>
    `flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
      isActive(href, exact)
        ? 'text-earth-500 bg-earth-50 font-semibold'
        : 'text-gray-600 hover:text-earth-400 hover:bg-gray-50'
    }`;

  const triggerCls = (active: boolean) =>
    `flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md outline-none cursor-pointer transition-colors ${
      active
        ? 'text-earth-500 bg-earth-50 font-semibold'
        : 'text-gray-600 hover:text-earth-400 hover:bg-gray-50'
    }`;

  return { pathname, isActive, linkCls, triggerCls };
}

function SectionHeader({ label, color }: { label: string; color: string }) {
  return (
    <div className={`mx-1 mb-1 mt-0.5 px-2 py-1 rounded text-xs font-semibold ${color}`}>
      {label}
    </div>
  );
}

function menuItemCls(active: boolean) {
  return `cursor-pointer flex items-center gap-2 w-full ${active ? 'bg-earth-50 text-earth-500' : ''}`;
}

// ── NavLinks: horizontal nav items (left side) ────────────────────────────

export function AppNavLinks({ isAdmin }: { isAdmin: boolean }) {
  const { pathname, isActive, linkCls, triggerCls } = useNavHelpers();
  const isDataActive = isActive('/data-entry') || isActive('/scope3');

  return (
    <nav className="hidden md:flex items-center space-x-0.5">
      {isAdmin ? (
        <>
          <Link href="/admin" className={linkCls('/admin', true)}>
            <LayoutDashboard className="h-4 w-4" /> Табло
          </Link>
          <Link href="/admin/companies" className={linkCls('/admin/companies')}>
            <Building2 className="h-4 w-4" /> Компании
          </Link>
          <Link href="/admin/users" className={linkCls('/admin/users')}>
            <Users className="h-4 w-4" /> Потребители
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger className={triggerCls(isDataActive)}>
              <Database className="h-4 w-4" /> Данни <ChevronDown className="h-3 w-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-60">
              <SectionHeader label="ВСИЧКИ ДАННИ" color="bg-gray-50 text-gray-600" />
              <DropdownMenuItem asChild>
                <Link href="/data-entry/list" className={menuItemCls(pathname === '/data-entry/list')}>
                  <ListChecks className="h-4 w-4 text-earth-400" /> Обхват 1 & 2 емисии
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/scope3/transactions" className={menuItemCls(pathname === '/scope3/transactions')}>
                  <Receipt className="h-4 w-4 text-blue-500" /> Обхват 3 транзакции
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      ) : (
        <>
          <Link href="/dashboard" className={linkCls('/dashboard', true)}>
            <LayoutDashboard className="h-4 w-4" /> Табло
          </Link>

          {/* Данни dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className={triggerCls(isDataActive)}>
              <Database className="h-4 w-4" /> Данни <ChevronDown className="h-3 w-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              <SectionHeader label="ОБХВАТ 1 & 2 — Директни" color="bg-green-50 text-green-700" />
              <DropdownMenuItem asChild>
                <Link href="/data-entry" className={menuItemCls(pathname === '/data-entry')}>
                  <PlusCircle className="h-4 w-4 text-earth-400" /> Въвеждане на данни
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/data-entry/list" className={menuItemCls(pathname === '/data-entry/list')}>
                  <ListChecks className="h-4 w-4 text-earth-400" /> Преглед на емисии
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <SectionHeader label="ОБХВАТ 3 — Верига на стойността" color="bg-blue-50 text-blue-700" />
              <DropdownMenuItem asChild>
                <Link href="/scope3/dashboard" className={menuItemCls(pathname === '/scope3/dashboard')}>
                  <Leaf className="h-4 w-4 text-green-600" /> Табло Обхват 3
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/scope3/import" className={menuItemCls(pathname.startsWith('/scope3/import'))}>
                  <Upload className="h-4 w-4 text-blue-500" /> Импорт транзакции
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/scope3/transactions" className={menuItemCls(pathname === '/scope3/transactions')}>
                  <Receipt className="h-4 w-4 text-blue-500" /> Виж транзакции
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/scope3/classify" className={menuItemCls(pathname === '/scope3/classify')}>
                  <Tag className="h-4 w-4 text-blue-500" /> Класификация
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/scope3/rules" className={menuItemCls(pathname === '/scope3/rules')}>
                  <Zap className="h-4 w-4 text-purple-500" /> Правила
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Simple links */}
          <Link href="/reports" className={linkCls('/reports')}>
            <FileText className="h-4 w-4" /> Отчети
          </Link>

          <Link href="/targets" className={linkCls('/targets')}>
            <Target className="h-4 w-4" /> Цели
          </Link>

          <Link href="/comparison" className={linkCls('/comparison')}>
            <GitCompareArrows className="h-4 w-4" /> Сравнение
          </Link>

          <Link href="/help" className={linkCls('/help')}>
            <HelpCircle className="h-4 w-4" /> Помощ
          </Link>
        </>
      )}
    </nav>
  );
}

// ── NavUser: avatar + dropdown (right side) ───────────────────────────────

export function AppNavUser({ isAdmin, firstName, role }: NavProps) {
  const initials   = firstName ? firstName.slice(0, 2).toUpperCase() : 'U';
  const roleLabel  =
    role === 'admin'  ? 'Администратор' :
    role === 'member' ? 'Потребител'    : (role ?? 'Потребител');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2.5 hover:bg-gray-50 rounded-lg px-3 py-2 transition-colors outline-none">
        <div className="h-8 w-8 rounded-full bg-earth-400 flex items-center justify-center text-white text-xs font-bold shrink-0">
          {initials}
        </div>
        <div className="hidden md:block text-left">
          <p className="text-sm font-medium text-gray-700 leading-tight">{firstName ?? 'Потребител'}</p>
          <p className="text-xs text-gray-400 leading-tight capitalize">{roleLabel}</p>
        </div>
        <ChevronDown className="h-3 w-3 text-gray-400 hidden md:block" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-52">
        <div className="px-3 py-2.5 border-b">
          <p className="text-sm font-semibold text-gray-800">{firstName ?? 'Потребител'}</p>
          <p className="text-xs text-gray-400">{roleLabel}</p>
        </div>
        {!isAdmin && (
          <DropdownMenuItem asChild>
            <Link href="/settings/company" className="cursor-pointer flex items-center gap-2 mt-1">
              <Building2 className="h-4 w-4" /> Настройки компания
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <form action="/api/auth/signout" method="post">
          <DropdownMenuItem asChild>
            <button type="submit" className="w-full flex items-center gap-2 text-red-600 cursor-pointer">
              <LogOut className="h-4 w-4" /> Изход
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
