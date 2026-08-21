interface RecaptchaField<T> {
  value?: T | null
  isFieldActive?: boolean
}

interface PublicRecaptchaConfig {
  siteKey?: RecaptchaField<string>
  version?: RecaptchaField<string>
  enabled?: RecaptchaField<boolean>
}

interface RecaptchaApiResponse {
  success: boolean
  data?: {
    recaptcha?: PublicRecaptchaConfig | null
  }
}

declare global {
  interface Window {
    grecaptcha?: {
      ready: (callback: () => void) => void
      execute: (siteKey: string, options: { action: string }) => Promise<string>
    }
  }
}

let recaptchaConfigPromise: Promise<PublicRecaptchaConfig | null> | null = null
let recaptchaScriptPromise: Promise<void> | null = null

function getApiBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "http://localhost:4000"
  ).replace(/\/+$/, "")
}

function getActiveFieldValue<T>(field?: RecaptchaField<T>) {
  if (!field || field.isFieldActive === false) {
    return null
  }

  return field.value ?? null
}

async function getPublicRecaptchaConfig() {
  if (!recaptchaConfigPromise) {
    recaptchaConfigPromise = fetch(`${getApiBaseUrl()}/api/public/google-recaptcha`, {
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) {
          return null
        }

        const data = (await response.json()) as RecaptchaApiResponse
        return data.success ? data.data?.recaptcha || null : null
      })
      .catch(() => null)
  }

  return recaptchaConfigPromise
}

function isRecaptchaEnabled(config: PublicRecaptchaConfig | null) {
  const siteKey = getActiveFieldValue(config?.siteKey)
  const enabled = getActiveFieldValue(config?.enabled)

  return Boolean(siteKey && enabled !== false)
}

function loadRecaptchaScript(siteKey: string) {
  if (typeof window === "undefined") {
    return Promise.resolve()
  }

  if (window.grecaptcha) {
    return Promise.resolve()
  }

  if (!recaptchaScriptPromise) {
    recaptchaScriptPromise = new Promise((resolve, reject) => {
      const existingScript = document.querySelector<HTMLScriptElement>(
        `script[src^="https://www.google.com/recaptcha/api.js"]`
      )

      if (existingScript) {
        existingScript.addEventListener("load", () => resolve(), { once: true })
        existingScript.addEventListener("error", () => reject(new Error("Failed to load Google reCAPTCHA")), { once: true })
        return
      }

      const script = document.createElement("script")
      script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`
      script.async = true
      script.defer = true
      script.onload = () => resolve()
      script.onerror = () => reject(new Error("Failed to load Google reCAPTCHA"))
      document.head.appendChild(script)
    })
  }

  return recaptchaScriptPromise
}

export async function getRecaptchaToken(action: string) {
  if (typeof window === "undefined") {
    return null
  }

  const config = await getPublicRecaptchaConfig()
  if (!isRecaptchaEnabled(config)) {
    return null
  }

  const siteKey = getActiveFieldValue(config?.siteKey)
  const version = getActiveFieldValue(config?.version) || "v3"

  if (!siteKey) {
    return null
  }

  if (version !== "v3") {
    throw new Error("This website currently supports Google reCAPTCHA v3. Please select v3 in the admin captcha settings.")
  }

  await loadRecaptchaScript(siteKey)

  return new Promise<string>((resolve, reject) => {
    if (!window.grecaptcha) {
      reject(new Error("Google reCAPTCHA is not available. Please refresh the page and try again."))
      return
    }

    window.grecaptcha.ready(() => {
      window.grecaptcha
        ?.execute(siteKey, { action })
        .then(resolve)
        .catch(() => reject(new Error("Captcha verification failed. Please refresh the page and try again.")))
    })
  })
}
