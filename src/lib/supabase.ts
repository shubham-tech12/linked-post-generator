 // Mock Supabase client to bypass missing environment variables and connection errors
export const supabase = {
  auth: {
    getSession: async () => ({ data: { session: { user: { email: 'test@gmail.com' } } }, error: null }),
    onAuthStateChange: (callback: any) => {
      // Automatically trigger a logged-in state for testing
      callback('SIGNED_IN', { user: { email: 'test@gmail.com' } });
      return { data: { subscription: { unsubscribe: () => {} } } };
    },
    signInWithOAuth: async () => ({ data: {}, error: null }),
    signOut: async () => ({ error: null }),
  }
};