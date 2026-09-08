'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { toast } from 'sonner';
import { bg } from '@/lib/i18n/bg';
import { ZedLogo } from '@/components/ui/zed-logo';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    if (searchParams.get('error') === 'auth_callback') {
      toast.error(bg.auth.resetLinkInvalid);
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', data.user.id)
        .single();

      toast.success('Успешен вход в системата');

      if (userData?.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
      router.refresh();
    } catch {
      // Generic message — do not leak whether email exists
      toast.error(bg.auth.invalidCredentials);
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
            Отчитане на предприятията във връзка с устойчивостта
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
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
                className="focus-visible:ring-earth-300"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{bg.auth.password}</Label>
              <Input
                id="password"
                type="password"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="focus-visible:ring-earth-300"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-earth-300 hover:bg-earth-400 text-white"
              disabled={loading}
            >
              {loading ? bg.general.loading : bg.auth.login}
            </Button>
            <div className="text-center">
              <Link
                href="/forgot-password"
                className="text-sm text-earth-400 hover:text-earth-300 underline"
              >
                {bg.auth.forgotPassword}
              </Link>
            </div>
            <div className="flex justify-center mt-6">
              <Image
                src="/zed-logo.png"
                alt="ZED България"
                width={80}
                height={32}
                className="object-contain"
              />
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-earth-50 to-earth-100">
          <Loader2 className="h-8 w-8 animate-spin text-earth-300" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
