import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Lock, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 10 * 60 * 1000; // 10분
const LOCKOUT_STORAGE_KEY = "cordia_admin_auth_lockout";

interface LockoutState {
  attempts: number;
  lockedUntil: number | null;
}

function getStoredLockout(): LockoutState {
  try {
    const raw = localStorage.getItem(LOCKOUT_STORAGE_KEY);
    if (!raw) return { attempts: 0, lockedUntil: null };
    return JSON.parse(raw);
  } catch {
    return { attempts: 0, lockedUntil: null };
  }
}

function setStoredLockout(state: LockoutState) {
  try {
    localStorage.setItem(LOCKOUT_STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

export default function AdminLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [lockoutSeconds, setLockoutSeconds] = useState<number>(() => {
    const state = getStoredLockout();
    if (state.lockedUntil && state.lockedUntil > Date.now()) {
      return Math.ceil((state.lockedUntil - Date.now()) / 1000);
    }
    return 0;
  });
  const [attempts, setAttempts] = useState<number>(() => getStoredLockout().attempts);

  // 1초마다 카운트다운
  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const interval = setInterval(() => {
      setLockoutSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setStoredLockout({ attempts: 0, lockedUntil: null });
          setAttempts(0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutSeconds]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutSeconds > 0) return;

    setError("");
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        const nextAttempts = attempts + 1;
        setAttempts(nextAttempts);

        if (nextAttempts >= MAX_ATTEMPTS) {
          const lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
          setStoredLockout({ attempts: nextAttempts, lockedUntil });
          setLockoutSeconds(Math.ceil(LOCKOUT_DURATION_MS / 1000));
          setError(`비밀번호를 ${MAX_ATTEMPTS}회 연속 잘못 입력하여 10분간 로그인이 잠겼습니다.`);
          toast({
            variant: "destructive",
            title: "보안 잠금 활성화",
            description: "보안을 위해 10분간 로그인이 제한됩니다.",
          });
        } else {
          setStoredLockout({ attempts: nextAttempts, lockedUntil: null });
          const remaining = MAX_ATTEMPTS - nextAttempts;
          if (nextAttempts >= 3) {
            setError(`비밀번호가 올바르지 않습니다. (${nextAttempts}/${MAX_ATTEMPTS}회 실패 — ${remaining}회 더 실패 시 10분간 잠김)`);
          } else {
            setError("이메일 또는 비밀번호가 올바르지 않습니다.");
          }
        }
      } else {
        // 성공 시 실패 카운트 리셋
        setStoredLockout({ attempts: 0, lockedUntil: null });
        setAttempts(0);
        toast({
          title: "로그인 성공",
          description: "관리자 패널로 이동합니다.",
        });
        navigate("/admin");
      }
    } catch (err: any) {
      setError(err.message || "로그인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 py-10">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-[#0f2445]/10 rounded-full p-4">
                <Lock className="w-8 h-8 text-[#0f2445]" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-slate-900">
              CordiaEC Admin
            </CardTitle>
            <p className="text-slate-500 text-sm mt-1">
              관리자 패널 접속
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <div>
                <Label htmlFor="email" className="text-slate-700 font-semibold">이메일</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                  placeholder="admin@cordiaec.com"
                  disabled={loading}
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-slate-700 font-semibold">비밀번호</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  placeholder="비밀번호"
                  disabled={loading}
                />
              </div>

              {lockoutSeconds > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm flex items-center justify-between">
                  <span>🔒 보안 잠금 활성화</span>
                  <span className="font-mono font-bold text-amber-900">
                    {Math.floor(lockoutSeconds / 60).toString().padStart(2, "0")}:
                    {(lockoutSeconds % 60).toString().padStart(2, "0")} 후 해제
                  </span>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading || !email || !password || lockoutSeconds > 0}
                className="w-full bg-[#0f2445] hover:bg-[#1a3a60] text-white font-bold h-11 rounded-xl transition-all"
              >
                {lockoutSeconds > 0
                  ? `로그인 잠김 (${Math.floor(lockoutSeconds / 60)}분 ${lockoutSeconds % 60}초 남음)`
                  : loading
                  ? "로그인 중..."
                  : "로그인"}
              </Button>

            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
