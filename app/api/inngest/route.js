// app/api/inngest/route.js

import { serve } from "inngest/next";
import { 
    inngest, 
    syncUserCreation, 
    syncUserDeletion, 
    syncUserUpdation, 
    createUserOrder // <--- ADD THIS FUNCTION NAME
} from "@/config/inngest"; 


// Create an API that serves zero functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    syncUserCreation,
    syncUserUpdation,
    syncUserDeletion,
    createUserOrder // Now it is correctly defined!
  ],
});