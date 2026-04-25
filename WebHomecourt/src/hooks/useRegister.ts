import { supabase } from "../lib/supabase"
import { useCallback, useMemo, useState } from "react"

export type AlertTone = "success" | "error" | "warning" | "info"

export type AlertState = {
    tone: AlertTone
    message: string
} | null

export type ValidationResult =
  | { ok: true }
  | { ok: false; tone: "warning" | "error"; message: string }

export function firstError(
  rules: Array<() => ValidationResult | null>
): ValidationResult {
  for (const rule of rules) {
    const res = rule()
    if (res && !res.ok) return res
  }
  return { ok: true }
}

function validateEmail (value: string)  {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return regex.test(value)
}

export type PasswordIssue = "required" | "minLength" | "upper" | "lower" | "number" | "symbol"

export type PasswordPolicyResult = {
  ok: boolean
  issues: PasswordIssue[]
}

export function checkPasswordPolicy(password: string): PasswordPolicyResult {
  const issues: PasswordIssue[] = []

  if (!password) issues.push("required")
  if (password.length > 0 && password.length < 8) issues.push("minLength")
  if (password && !/[A-Z]/.test(password)) issues.push("upper")
  if (password && !/[a-z]/.test(password)) issues.push("lower")
  if (password && !/[0-9]/.test(password)) issues.push("number")
  if (password && !/[^A-Za-z0-9]/.test(password)) issues.push("symbol")

  return { ok: issues.length === 0, issues }
}

export function passwordPolicyMessage(issues: PasswordIssue[]) {
  if (issues.includes("required")) return "Password is required."
  if (issues.includes("minLength")) return "Password must be at least 8 characters."
  if (issues.length) return "Use upper/lowercase, a number, and a symbol."
  return ""
}

type UseRegisterReturn = {
    email: string
    setEmail: (v: string) => void
    touchEmail: () => void
    password: string
    setPassword: (v: string) => void
    touchPassword: () => void
    confirmPassword: string
    setConfirmPassword: (v: string) => void
    touchConfirmPassword: () => void
    loading: boolean
    alert: AlertState
    emailError: string
    passwordError: string
    canSubmit: boolean
    register: () => Promise<boolean>
    clearAlert: () => void
}

export function useRegister(): UseRegisterReturn {
    const [email, setEmailState]       = useState('');
    const [password, setPasswordState] = useState('');
    const [confirmPassword, setConfirmPasswordState] = useState('');
    const [loading, setLoading]   = useState(false);
    const [alert, setAlert] = useState<AlertState>(null);

    const [touched, setTouched] = useState({
        email: false,
        password: false,
        confirmPassword: false,
    })
    const [submitted, setSubmitted] = useState(false)
    const cleanEmail = useMemo(() => email.trim(), [email])
    const showEmailError = submitted || touched.email
    const showPasswordError = submitted || touched.password || touched.confirmPassword
    const emailError = useMemo(() => {
        if (!showEmailError) return ""
        if (!cleanEmail) return ""
        if (!validateEmail(cleanEmail)) return "Invalid email format."
        return ""
    }, [showEmailError, cleanEmail])

    const passwordPolicy = useMemo(() => checkPasswordPolicy(password), [password])

    const passwordError = useMemo(() => {
        if (!showPasswordError) return ""
        // Errores como cosas que requiere como contraseña minima segura
        const policyMsg = passwordPolicyMessage(passwordPolicy.issues)
        if (policyMsg) return policyMsg
        // Confirmar que las contraseñas sean iguales
        if (confirmPassword && password !== confirmPassword) return "Your passwords are not the same."
        return ""
    }, [showPasswordError, passwordPolicy.issues, password, confirmPassword])

    const canSubmit = useMemo(() => {
        if (loading) return false
        if (!cleanEmail) return false
        if (emailError) return false
        if (!passwordPolicy.ok) return false
        if (password !== confirmPassword) return false
        return true
    }, [loading, cleanEmail, emailError, passwordPolicy.ok, password, confirmPassword])

    const clearAlert = useCallback(() => setAlert(null), [])

    const touchEmail = useCallback(() => {
        setTouched((t) => ({ ...t, email: true }))
    }, [])

    const touchPassword = useCallback(() => {
        setTouched((t) => ({ ...t, password: true }))
    }, [])

    const touchConfirmPassword = useCallback(() => {
        setTouched((t) => ({ ...t, confirmPassword: true }))
    }, [])

    const setEmail = useCallback((v: string) => {
        setEmailState(v)
        setAlert(null)
    }, [])

    const setPassword = useCallback((v: string) => {
        setPasswordState(v)
        setAlert(null)
    }, [])

    const setConfirmPassword = useCallback((v: string) => {
        setConfirmPasswordState(v)
        setAlert(null)
    }, [])

    const register = useCallback(async () => {
        if (loading) return false
        setSubmitted(true)
        setAlert(null)

        const validation = firstError([
            () => (!cleanEmail ? { ok: false, tone: "warning", message: "Email is required." } : null),
            () => (!validateEmail(cleanEmail) ? { ok: false, tone: "warning", message: "Invalid email format." } : null),

            () => {
                const { issues } = checkPasswordPolicy(password)
                const msg = passwordPolicyMessage(issues)
                return msg ? { ok: false, tone: "warning", message: msg } : null
            },

            () =>
                password !== confirmPassword
                ? { ok: false, tone: "warning", message: "Your passwords are not the same." }
                : null,
        ])

        if (!validation.ok) {
            setAlert({ tone: validation.tone, message: validation.message })
            return false
        }

        setLoading(true)
        try {
            const { data, error } = await supabase.auth.signUp({
                email: cleanEmail,
                password,
            })

            if (error) {
                setAlert({ tone: "error", message: error.message })
                return false
            }

            if (data.user && !data.session) {
                // setAlert({ tone: "success", message: "Check your email to confirm your account." })
                return true
            }

            setAlert({ tone: "success", message: "Registro exitoso." })
            return true
        } finally {
            setLoading(false)
        }
    }, [loading, cleanEmail, password, confirmPassword])

    return { email, setEmail, touchEmail, password, setPassword, touchPassword, confirmPassword, setConfirmPassword,
           touchConfirmPassword, loading, alert, emailError, passwordError, canSubmit, register, clearAlert,}
}