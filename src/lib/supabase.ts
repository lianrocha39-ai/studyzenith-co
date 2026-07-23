// Supabase Client Integration

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string) || "https://xyzcompany.supabase.co";
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummykey";

export type UserProfile = {
  id: string;
  email: string;
  name: string;
  createdAt: string;
};

export type SupabaseUser = {
  id: string;
  email: string;
  user_metadata?: {
    name?: string;
    [key: string]: any;
  };
};

export type SupabaseSession = {
  access_token: string;
  user: SupabaseUser;
};

// Local Auth storage key
const AUTH_STORAGE_KEY = "studyzenith_auth_session";
const USERS_DB_KEY = "studyzenith_registered_users";

export const supabase = {
  auth: {
    async getSession(): Promise<{ data: { session: SupabaseSession | null }; error: any }> {
      try {
        const stored = localStorage.getItem(AUTH_STORAGE_KEY);
        if (stored) {
          const session = JSON.parse(stored) as SupabaseSession;
          return { data: { session }, error: null };
        }
      } catch (e) {
        console.error("Error reading auth session", e);
      }
      return { data: { session: null }, error: null };
    },

    async signUp({ email, password, options }: { email: string; password: string; options?: { data?: { name?: string } } }) {
      // Get registered users registry
      let users: Record<string, { password: string; name: string; id: string }> = {};
      try {
        const raw = localStorage.getItem(USERS_DB_KEY);
        if (raw) users = JSON.parse(raw);
      } catch (e) {}

      if (users[email.toLowerCase()]) {
        return { data: null, error: { message: "Este e-mail já está cadastrado." } };
      }

      const name = options?.data?.name || email.split("@")[0];
      const userId = `usr_${crypto.randomUUID()}`;

      users[email.toLowerCase()] = { password, name, id: userId };
      localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));

      const user: SupabaseUser = {
        id: userId,
        email: email.toLowerCase(),
        user_metadata: { name },
      };

      const session: SupabaseSession = {
        access_token: `token_${userId}`,
        user,
      };

      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));

      return { data: { user, session }, error: null };
    },

    async signInWithPassword({ email, password }: { email: string; password: string }) {
      let users: Record<string, { password: string; name: string; id: string }> = {};
      try {
        const raw = localStorage.getItem(USERS_DB_KEY);
        if (raw) users = JSON.parse(raw);
      } catch (e) {}

      const account = users[email.toLowerCase()];
      if (!account || account.password !== password) {
        return { data: null, error: { message: "E-mail ou senha incorretos." } };
      }

      const user: SupabaseUser = {
        id: account.id,
        email: email.toLowerCase(),
        user_metadata: { name: account.name },
      };

      const session: SupabaseSession = {
        access_token: `token_${account.id}`,
        user,
      };

      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));

      return { data: { user, session }, error: null };
    },

    async signOut() {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return { error: null };
    },
  },
};
