import { Injectable } from '@angular/core';
import { createClient } from '@neondatabase/neon-js';
import { environment } from '../../environments/environment';
import { mapAuthError } from '../utils/auth-error.mapper';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
}

@Injectable({ providedIn: 'root' })
export class NeonService {
  readonly client: ReturnType<typeof createClient>;

  constructor() {
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
      return await this.client.auth.signIn.email({ email, password });
    } catch (error) {
      return { data: null, error };
    }
  }

  async signOut() {
    return this.client.auth.signOut();
  }

  getAuthErrorMessage(error: unknown): string {
    return mapAuthError(error);
  }
}
