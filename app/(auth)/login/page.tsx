'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { bg } from '@/lib/i18n/bg';
import { ZedLogo } from '@/components/ui/zed-logo';
import Image from 'next/image';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Check user role to redirect appropriately
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', data.user.id)
        .single();

      toast.success('Успешен вход в системата');
      
      // Redirect admins to admin dashboard, clients to regular dashboard
      if (userData?.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
      router.refresh();
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || bg.auth.invalidCredentials);
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
            Управление на корпоративната устойчивост
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
              <button
                type="button"
                className="text-sm text-earth-400 hover:text-earth-300 underline"
                onClick={() => toast.info('Функционалността ще бъде добавена скоро')}
              >
                {bg.auth.forgotPassword}
              </button>
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
