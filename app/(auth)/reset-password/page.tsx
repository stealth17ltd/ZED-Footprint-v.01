'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { toast } from 'sonner';
import { bg } from '@/lib/i18n/bg';
import { ZedLogo } from '@/components/ui/zed-logo';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => {
      setHasSession(!!user);
      setCheckingSession(false);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 8) {
      toast.error(bg.auth.passwordMinLength);
      return;
    }
    if (password !== confirmPassword) {
      toast.error(bg.auth.passwordsMustMatch);
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      toast.success(bg.auth.passwordUpdated);
      await supabase.auth.signOut();
      router.push('/login');
      router.refresh();
    } catch {
      toast.error(bg.auth.resetLinkInvalid);
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-earth-50 to-earth-100">
        <Loader2 className="h-8 w-8 animate-spin text-earth-300" />
      </div>
    );
  }

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
            {bg.auth.resetPassword}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!hasSession ? (
            <div className="text-center space-y-4">
              <p className="text-sm text-gray-600">{bg.auth.resetLinkInvalid}</p>
              <Link
                href="/forgot-password"
                className="inline-flex items-center gap-1 text-sm text-earth-400 hover:text-earth-300 underline"
              >
                {bg.auth.sendResetLink}
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">{bg.auth.resetPassword}</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  disabled={loading}
                  autoComplete="new-password"
                  className="focus-visible:ring-earth-300"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{bg.auth.confirmPassword}</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="********"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  disabled={loading}
                  autoComplete="new-password"
                  className="focus-visible:ring-earth-300"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-earth-300 hover:bg-earth-400 text-white"
                disabled={loading}
              >
                {loading ? bg.general.loading : bg.general.save}
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
