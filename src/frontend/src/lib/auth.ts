export const auth = {
  api: {
    getSession: async () => {
      const token = localStorage.getItem("auth_token");
      if (!token) return { session: null };
      
      // Return the stored session info from localStorage
      // The actual token validity will be checked when making API calls
      try {
        const storedUserInfo = localStorage.getItem("auth_user");
        if (storedUserInfo) {
          const user = JSON.parse(storedUserInfo);
          return { 
            session: { 
              user: { 
                id: user.id, 
                email: user.email, 
                name: user.name, 
                image: user.image 
              }, 
              token 
            } 
          };
        }
      } catch (e) {
        console.error("getSession error:", e);
      }
      
      // If we only have the token but no user info, return a minimal session
      // The user info will be retrieved when needed via API calls
      return { session: { user: null, token } };
    },
  },
};
