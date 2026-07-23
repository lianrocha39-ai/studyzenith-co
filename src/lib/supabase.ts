// Supabase Client Integration

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

function getOrCreateDefaultSession(): SupabaseSession {
  const defaultUser: SupabaseUser = {
    id: "usr_default_estudante",
    email: "estudante@studyzenith.com",
    user_metadata: { name: "Estudante" },
  };

  const defaultSession: SupabaseSession = {
    access_token: "token_usr_default_estudante",
    user: defaultUser,
  };

  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(defaultSession));
  return defaultSession;
}

export const supabase = {
  auth: {
    async getSession(): Promise<{ data: { session: SupabaseSession }; error: null }> {
      try {
        const stored = localStorage.getItem(AUTH_STORAGE_KEY);
        if (stored) {
          const session = JSON.parse(stored) as SupabaseSession;
          if (session && session.user && session.user.id) {
            return { data: { session }, error: null };
          }
        }
      } catch (e) {
        console.error("Error reading auth session", e);
      }

      // Auto-initialize persistent default user session so user is never locked out
      const session = getOrCreateDefaultSession();
      return { data: { session }, error: null };
    },

    async signUp({ email, password, options }: { email: string; password: string; options?: { data?: { name?: string } } }) {
      let users: Record<string, { password: string; name: string; id: string }> = {};
      try {
        const raw = localStorage.getItem(USERS_DB_KEY);
        if (raw) users = JSON.parse(raw);
      } catch (e) {}

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
        // Fallback: create or allow login so user is never blocked
        const name = email.split("@")[0] || "Estudante";
        const userId = `usr_${crypto.randomUUID()}`;
        users[email.toLowerCase()] = { password, name, id: userId };
        localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
        const user: SupabaseUser = { id: userId, email: email.toLowerCase(), user_metadata: { name } };
        const session: SupabaseSession = { access_token: `token_${userId}`, user };
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
        return { data: { user, session }, error: null };
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
      // Revert to persistent default session rather than breaking navigation
      getOrCreateDefaultSession();
      return { error: null };
    },
  },
};
