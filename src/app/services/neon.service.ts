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
      auth: { url: environment.neonAuthUrl },
      dataApi: { url: environment.neonDataApiUrl },
    });
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

      // Explicitly fetch the session after sign-in so the auth client's
      // in-memory cache is populated with a valid JWT before any data API
      // calls are made. Without this, getJWTToken() can return null and
      // throw AuthRequiredError even though sign-in succeeded.
      const sessionResult = await this.client.auth.getSession();
      if (!sessionResult.data?.session) {
        return {
          data: null,
          error: { code: 'EMAIL_NOT_VERIFIED', message: 'Session not established' },
        };
      }

      return { data: sessionResult.data, error: null };
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
