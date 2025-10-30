import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Leaf, Mail, Lock, Eye, EyeOff } from "lucide-react";

const SignIn = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');

  useEffect(() => {
    document.title = "Sign In - Agri-Health AI Assistant";
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 
        'Sign in to your Agri-Health AI Assistant account to access personalized health monitoring and crop management tools for farmers.'
      );
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!email || !password) {
      setMessageType('error');
      setMessage('Email and password are required');
      return;
    }

    setLoading(true);

    try {
      const apiBase = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000';
      const res = await fetch(`${apiBase}/api/user/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (res.ok) {
        // backend returns accessToken and user
        const token = data.accessToken || data.token;
        if (token) {
          // store token (short-lived access token)
          localStorage.setItem('accessToken', token);
        }
        setMessageType('success');
        setMessage(data.msg || 'Signed in successfully');
        // redirect to dashboard or protected route
        setTimeout(() => navigate('/dashboard'), 800);
      } else {
        const serverMsg = data?.msg || data?.message || data?.error || 'Sign in failed';
        setMessageType('error');
        setMessage(serverMsg as string);
      }
    } catch (err: any) {
      setMessageType('error');
      setMessage(err?.message || 'Network error during sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />
      <main className="pt-20">
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-md mx-auto">
              <Card className="shadow-elegant">
                <CardHeader className="text-center space-y-4">
                  <div className="mx-auto p-3 bg-gradient-primary rounded-full w-fit">
                    <Leaf className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <CardTitle className="text-2xl">Welcome Back</CardTitle>
                  <CardDescription>
                    Sign in to your Agri-Health AI Assistant account
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  {message ? (
                    <Alert className={messageType === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                      <AlertDescription>{message}</AlertDescription>
                    </Alert>
                  ) : (
                    <Alert>
                      <AlertDescription>
                        Sign in to access your account. Your credentials are processed securely on the server.
                      </AlertDescription>
                    </Alert>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="Enter your email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-10 pr-10"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="remember" 
                          checked={rememberMe}
                          onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                        />
                        <Label htmlFor="remember" className="text-sm">
                          Remember me
                        </Label>
                      </div>
                      <Link 
                        to="/forgot-password" 
                        className="text-sm text-primary hover:underline"
                      >
                        Forgot password?
                      </Link>
                    </div>

                    <Button type="submit" className="w-full" size="lg" disabled={loading} aria-busy={loading}>
                      {loading ? 'Signing in…' : 'Sign In'}
                    </Button>
                  </form>

                  <div className="text-center space-y-4">
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-muted"></div>
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                          Or continue with
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Button variant="outline" size="sm">
                        Google
                      </Button>
                      <Button variant="outline" size="sm">
                        Facebook
                      </Button>
                    </div>

                    <p className="text-sm text-muted-foreground">
                      Don't have an account?{" "}
                      <Link to="/register" className="text-primary hover:underline font-medium">
                        Sign up here
                      </Link>
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Trust Indicators */}
              <div className="mt-8 text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Trusted by over 500,000 farmers worldwide
                </p>
                <div className="flex justify-center space-x-4 text-xs text-muted-foreground">
                  <span>🔒 Secure & Private</span>
                  <span>📱 Mobile Friendly</span>
                  <span>🌍 Multilingual</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default SignIn;