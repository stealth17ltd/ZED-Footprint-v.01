'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { toast } from 'sonner';
import { bg } from '@/lib/i18n/bg';
import { ZedLogo } from '@/components/ui/zed-logo';
import { ArrowLeft, Mail } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const redirectTo = `${window.location.origin}/auth/callback?next=/reset-password`;
      await createClient().auth.resetPasswordForEmail(email.trim(), { redirectTo });
      // Always show success — do not reveal whether the email exists
      setSent(true);
      toast.success(bg.auth.resetEmailSent);
    } catch {
      setSent(true);
      toast.success(bg.auth.resetEmailSent);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-earth-50 to-earth-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center">
            <div className="scale-150">
              <ZedLogo size="xl" />
            </div>
          </div>
          <CardDescription className="text-base mb-2">
            {bg.auth.forgotPassword}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="text-center space-y-4">
              <div className="mx-auto h-12 w-12 rounded-full bg-earth-50 flex items-center justify-center">
                <Mail className="h-6 w-6 text-earth-400" />
              </div>
              <p className="text-sm text-gray-600">{bg.auth.resetEmailSent}</p>
              <Link
                href="/login"
                className="inline-flex items-center gap-1 text-sm text-earth-400 hover:text-earth-300 underline"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                {bg.auth.backToLogin}
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-sm text-gray-500 text-center">
                Въведете регистрирания имейл. Ще изпратим линк за нова парола.
              </p>
              <div className="space-y-2">
                <Label htmlFor="email">{bg.auth.email}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Въведете e-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  autoComplete="email"
                  className="focus-visible:ring-earth-300"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-earth-300 hover:bg-earth-400 text-white"
                disabled={loading}
              >
                {loading ? bg.general.loading : bg.auth.sendResetLink}
              </Button>
              <div className="text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1 text-sm text-earth-400 hover:text-earth-300 underline"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  {bg.auth.backToLogin}
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
