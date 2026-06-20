'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Phone, ArrowLeft, ArrowRight, Loader2, ShieldCheck, KeyRound, Sparkles, CheckCircle2, UserCircle2 } from 'lucide-react'
import { useAuthStore } from '@/lib/auth-store'
import { useFoodStore } from '@/lib/store'
import { DEMO_ACCOUNTS, DEMO_OTP } from '@/lib/demo-users'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type Step = 'phone' | 'otp' | 'success'

export function LoginDialog() {
  const open = useAuthStore((s) => s.loginOpen)
  const setOpen = useAuthStore((s) => s.setLoginOpen)
  const setUser = useAuthStore((s) => s.setUser)
  const setView = useFoodStore((s) => s.setView)

  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [hint, setHint] = useState<string>('')
  const [error, setError] = useState<string>('')

  useEffect(() => {
    if (open) {
      setStep('phone')
      setPhone('')
      setOtp('')
      setHint('')
      setError('')
    }
  }, [open])

  const sendOtp = async (phoneArg?: string) => {
    const p = (phoneArg ?? phone).trim()
    if (!p) {
      setError('Enter your phone number')
      return
    }
    setSending(true)
    setError('')
    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: p }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to send OTP')
        return
      }
      if (phoneArg) setPhone(phoneArg)
      setHint(data.isDemo ? data.message : data.message)
      setStep('otp')
      toast.success('OTP sent', { description: data.isDemo ? 'Use 123456 for demo accounts' : undefined })
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const verifyOtp = async () => {
    if (otp.length !== 6) {
      setError('Enter the 6-digit code')
      return
    }
    setVerifying(true)
    setError('')
    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code: otp }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Verification failed')
        return
      }
      setUser(data.user)
      setStep('success')
      toast.success(`Welcome, ${data.user.name || data.user.phone}!`, {
        description: `Signed in as ${data.user.roleLabels?.join(', ') || data.user.roles.join(', ')}`,
      })
      setTimeout(() => {
        setOpen(false)
      }, 1400)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setVerifying(false)
    }
  }

  const quickLogin = async (acctPhone: string) => {
    setPhone(acctPhone)
    setSending(true)
    setError('')
    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: acctPhone }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to send OTP')
        return
      }
      setPhone(acctPhone)
      setHint('Demo account — OTP is 123456')
      setOtp(DEMO_OTP)
      setStep('otp')
      // Auto-verify for one-click role login
      setTimeout(() => doVerify(acctPhone, DEMO_OTP), 400)
    } catch {
      setError('Network error')
    } finally {
      setSending(false)
    }
  }

  const doVerify = async (phoneArg: string, codeArg: string) => {
    setVerifying(true)
    setError('')
    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneArg, code: codeArg }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Verification failed')
        return
      }
      setUser(data.user)
      setStep('success')
      toast.success(`Welcome, ${data.user.name || data.user.phone}!`, {
        description: `Signed in as ${data.user.roleLabels?.join(', ') || data.user.roles.join(', ')}`,
      })
      setTimeout(() => setOpen(false), 1400)
    } catch {
      setError('Network error')
    } finally {
      setVerifying(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[92vh] gap-0 overflow-hidden p-0 sm:max-w-md">
        {/* Header banner */}
        <div className="relative bg-gradient-to-br from-primary to-orange-600 p-5 text-white">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20 backdrop-blur">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-extrabold">Sign in to FoodieDash</DialogTitle>
              <DialogDescription className="text-xs text-white/80">
                OTP-based secure login · RBAC protected
              </DialogDescription>
            </div>
          </div>
          <Sparkles className="pointer-events-none absolute right-3 top-3 h-16 w-16 text-white/10" />
        </div>

        {error && (
          <div className="mx-4 mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        {step === 'phone' && (
          <div className="p-5">
            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-semibold">Phone number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendOtp()}
                  placeholder="98765 43210"
                  className="pl-9"
                  inputMode="tel"
                />
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                We&apos;ll send a 6-digit verification code.
              </p>
            </div>
            <Button
              onClick={() => sendOtp()}
              disabled={sending || !phone}
              className="h-11 w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
              Send OTP
              <ArrowRight className="h-4 w-4" />
            </Button>

            {/* Demo accounts quick login */}
            <div className="mt-5">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <UserCircle2 className="h-3.5 w-3.5" />
                Quick demo login (one-click)
              </div>
              <ScrollArea className="max-h-[280px]">
                <div className="grid gap-1.5 pr-2">
                  {DEMO_ACCOUNTS.map((acct) => (
                    <button
                      key={acct.phone}
                      onClick={() => quickLogin(acct.phone)}
                      disabled={sending}
                      className={cn(
                        'flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2 text-left text-sm transition hover:border-primary hover:bg-accent disabled:opacity-50'
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {acct.roleLabel.split(' ').map((w) => w[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-semibold leading-tight">{acct.roleLabel}</div>
                          <div className="text-xs text-muted-foreground">{acct.name}</div>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              </ScrollArea>
              <p className="mt-2 text-center text-[11px] text-muted-foreground">
                All demo accounts use OTP <span className="font-mono font-bold">{DEMO_OTP}</span>
              </p>
            </div>
          </div>
        )}

        {step === 'otp' && (
          <div className="p-5">
            <button
              onClick={() => { setStep('phone'); setOtp(''); setError('') }}
              className="mb-3 inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Change number
            </button>
            <label className="mb-2 block text-sm font-semibold">Enter verification code</label>
            <p className="mb-4 text-xs text-muted-foreground">
              Sent to <span className="font-semibold text-foreground">{phone}</span>
            </p>
            {hint && (
              <div className="mb-3 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-xs text-primary">
                {hint}
              </div>
            )}
            <div className="flex justify-center">
              <InputOTP
                value={otp}
                onChange={(v) => { setOtp(v); setError('') }}
                maxLength={6}
                onComplete={() => {}}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
            <Button
              onClick={verifyOtp}
              disabled={verifying || otp.length !== 6}
              className="mt-5 h-11 w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              Verify & Sign In
            </Button>
            <button
              onClick={() => sendOtp()}
              disabled={sending}
              className="mt-3 w-full text-center text-xs font-semibold text-primary hover:underline"
            >
              Resend OTP
            </button>
          </div>
        )}

        {step === 'success' && (
          <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-9 w-9 text-green-600" />
            </div>
            <h3 className="text-lg font-bold">Signed in!</h3>
            <p className="text-sm text-muted-foreground">Redirecting you to FoodieDash…</p>
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
