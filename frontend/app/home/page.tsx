import { redirect } from 'next/navigation'

/**
 * Redirect from /home to /
 * Backend has the page configured with path /home
 * but frontend should serve it at /
 */
export default function HomeRedirect() {
  redirect('/')
}

