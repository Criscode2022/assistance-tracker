import { Injectable } from '@angular/core';
import { createClient } from '@neondatabase/neon-js';
import { TranslateService } from '@ngx-translate/core';
import { environment } from '../../environments/environment';
import { getAuthErrorKey } from '../utils/auth-error.mapper';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
}

@Injectable({ providedIn: 'root' })
export class NeonService {
  readonly client: ReturnType<typeof createClient>;

  constructor(private translate: TranslateService) {
    this.client = createClient({
      auth: { url: this.resolveUrl(environment.neonAuthUrl) },
      dataApi: { url: this.resolveUrl(environment.neonDataApiUrl) },
    });
  }

  /**
   * Same-origin proxy paths (e.g. "/__neon-auth") are resolved to an absolute
   * URL against the current origin so the auth/data clients hit this domain,
   * which Netlify reverse-proxies to Neon. Absolute URLs (used in dev) pass
   * through unchanged.
   */
  private resolveUrl(url: string): string {
    if (url.startsWith('/') && typeof window !== 'undefined') {
      return window.location.origin + url;
    }
    return url;
  }

  async getSession() {
    const { data, error } = await this.client.auth.getSession();
    if (error) return null;
    return data?.session ?? null;
  }

  async getUser(): Promise<AuthUser | null> {
    const { data, error } = await this.client.auth.getSession();
    if (error || !data?.user) return null;
    return {
      id: data.user.id,
      email: data.user.email,
      name: data.user.name ?? undefined,
    };
  }

  async signUp(email: string, password: string, name: string) {
    try {
      return await this.client.auth.signUp.email({ email, password, name });
    } catch (error) {
      return { data: null, error };
    }
  }

  async signIn(email: string, password: string) {
    try {
      const result = await this.client.auth.signIn.email({ email, password });
      if (result.error) return { data: null, error: result.error };

      // Warm the session cache without blocking on null — in iOS PWA standalone
      // mode the session cookie may not be readable immediately after sign-in,
      // so we must not treat a null session here as a login failure.
      await this.client.auth.getSession();

      return { data: result.data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async signOut() {
    return this.client.auth.signOut();
  }

  getAuthErrorMessage(error: unknown): string {
    return this.translate.instant(getAuthErrorKey(error));
  }
}
