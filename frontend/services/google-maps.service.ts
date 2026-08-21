interface GoogleMapsField<T> {
  value?: T | null
  isFieldActive?: boolean
}

interface PublicGoogleMapsConfig {
  apiKey?: GoogleMapsField<string>
  enabled?: GoogleMapsField<boolean>
}

interface GoogleMapsApiResponse {
  success: boolean
  data?: {
    maps?: PublicGoogleMapsConfig | null
    googleMaps?: PublicGoogleMapsConfig | null
    map?: PublicGoogleMapsConfig | null
  }
}

let googleMapsConfigPromise: Promise<PublicGoogleMapsConfig | null> | null = null

function getApiBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "http://localhost:4000"
  ).replace(/\/+$/, "")
}

function getActiveFieldValue<T>(field?: GoogleMapsField<T>) {
  if (!field || field.isFieldActive === false) {
    return null
  }

  return field.value ?? null
}

async function getPublicGoogleMapsConfig() {
  if (!googleMapsConfigPromise) {
    googleMapsConfigPromise = fetch(`${getApiBaseUrl()}/api/public/google-maps`, {
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) {
          return null
        }

        const data = (await response.json()) as GoogleMapsApiResponse
        return data.success
          ? data.data?.maps || data.data?.googleMaps || data.data?.map || null
          : null
      })
      .catch(() => null)
  }

  return googleMapsConfigPromise
}

export async function getPublicGoogleMapsApiKey() {
  const envApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""
  const config = await getPublicGoogleMapsConfig()
  const enabled = getActiveFieldValue(config?.enabled)

  if (config && enabled === false) {
    return ""
  }

  return getActiveFieldValue(config?.apiKey) || envApiKey
}
