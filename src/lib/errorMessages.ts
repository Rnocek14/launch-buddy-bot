/**
 * User-friendly error messages for common scenarios
 */

interface ErrorMessageConfig {
  title: string;
  description: string;
  action?: string;
  type?: "rate_limit" | "payment_required" | "network" | "auth" | "generic";
}

export const getErrorMessage = (error: any): ErrorMessageConfig => {
  const errorCode = error?.code;
  
  // Supabase Functions returns errors in different structures
  // Try to extract the actual error message from various possible locations
  let errorMessage = "";
  
  // Handle Supabase FunctionsHttpError structure first
  if (error?.context) {
    try {
      // error.context might already be parsed or need parsing
      const contextError = typeof error.context === 'string' 
        ? JSON.parse(error.context)
        : error.context;
      
      if (contextError?.error) {
        errorMessage = contextError.error.toLowerCase();
      } else if (typeof contextError === 'string') {
        errorMessage = contextError.toLowerCase();
      }
    } catch (e) {
      console.error('Failed to parse error.context:', e);
    }
  }
  
  // Fallback to other error structures if context didn't work
  if (!errorMessage) {
    if (typeof error === "string") {
      errorMessage = error.toLowerCase();
    } else if (error?.error && typeof error.error === "string") {
      // Supabase Functions often returns { error: "message" }
      errorMessage = error.error.toLowerCase();
    } else if (error?.message) {
      errorMessage = error.message.toLowerCase();
    } else if (error?.error?.message) {
      errorMessage = error.error.message.toLowerCase();
    }
  }

  // HTTP Status Code errors
  if (error?.status === 429 || errorMessage.includes("rate limit") || errorMessage.includes("too many requests")) {
    return {
      title: "Rate Limit Exceeded",
      description: "You've made too many requests in a short time. Please wait a few minutes before trying again. Rate limits help ensure fair usage for all users.",
      action: "Wait and retry",
      type: "rate_limit"
    };
  }

  if (error?.status === 402 || errorMessage.includes("payment required") || errorMessage.includes("upgrade required")) {
    return {
      title: "Upgrade Required",
      description: "This feature requires a Pro subscription. Upgrade now to access unlimited deletions and premium features.",
      action: "Upgrade to Pro",
      type: "payment_required"
    };
  }

  if (error?.status === 503 || errorMessage.includes("service unavailable")) {
    return {
      title: "Service Temporarily Unavailable",
      description: "Our servers are experiencing high traffic. Please try again in a few minutes.",
      action: "Try again",
      type: "generic"
    };
  }

  if (error?.status === 500 || errorMessage.includes("internal server error")) {
    return {
      title: "Server Error",
      description: "Something went wrong on our end. Our team has been notified and is working on a fix. Please try again later.",
      action: "Report issue",
      type: "generic"
    };
  }

  // Authentication errors
  if (errorCode === "auth/invalid-email" || errorMessage.includes("invalid email")) {
    return {
      title: "Invalid Email",
      description: "Please enter a valid email address.",
      action: "Check your email format",
      type: "auth"
    };
  }

  if (errorCode === "auth/user-not-found" || errorMessage.includes("user not found")) {
    return {
      title: "Account Not Found",
      description: "No account exists with this email. Would you like to sign up?",
      action: "Create an account",
      type: "auth"
    };
  }

  if (errorCode === "auth/wrong-password" || errorMessage.includes("wrong password")) {
    return {
      title: "Incorrect Password",
      description: "The password you entered is incorrect. Please try again.",
      action: "Reset password",
      type: "auth"
    };
  }

  if (errorCode === "auth/too-many-requests") {
    return {
      title: "Too Many Attempts",
      description: "Your account has been temporarily locked due to too many failed login attempts. Please try again later or reset your password.",
      action: "Try again in a few minutes",
      type: "rate_limit"
    };
  }

  if (errorCode === "auth/email-already-in-use" || errorMessage.includes("already in use")) {
    return {
      title: "Email Already Registered",
      description: "An account with this email already exists. Try logging in instead.",
      action: "Go to login",
      type: "auth"
    };
  }

  // Network errors
  if (errorMessage.includes("network") || errorMessage.includes("fetch failed") || errorMessage.includes("failed to fetch")) {
    return {
      title: "Connection Error",
      description: "We couldn't connect to our servers. Please check your internet connection and try again.",
      action: "Check connection",
      type: "network"
    };
  }

  if (errorMessage.includes("timeout") || errorMessage.includes("timed out")) {
    return {
      title: "Request Timeout",
      description: "The request took too long to complete. This might be due to slow internet or server load. Please try again.",
      action: "Retry request",
      type: "network"
    };
  }

  // Gmail/OAuth errors — only trigger when clearly Gmail/OAuth related
  if (errorMessage.includes("gmail") || errorMessage.includes("oauth")) {
    return {
      title: "Gmail Connection Failed",
      description: "We couldn't connect to your Gmail account. Please try reconnecting and make sure to grant all permissions.",
      action: "Reconnect Gmail",
      type: "auth"
    };
  }

  // Only treat scope/permission errors as Gmail issues when paired with Gmail/OAuth context.
  // Otherwise generic "permission" wording (e.g. RLS, broker scans) was incorrectly showing "Reconnect Gmail".
  if (
    (errorMessage.includes("insufficient") && errorMessage.includes("scope")) ||
    errorMessage.includes("missing scope") ||
    errorMessage.includes("gmail.metadata") ||
    errorMessage.includes("gmail.readonly") ||
    errorMessage.includes("mail.read")
  ) {
    return {
      title: "Missing Permissions",
      description: "Your Gmail connection is missing required permissions. Please reconnect and grant access to scan your emails.",
      action: "Grant permissions",
      type: "auth"
    };
  }

  // Token errors - OAuth refresh token issues (be very liberal with matching)
  const tokenErrorPatterns = [
    'failed to refresh',
    'invalid_grant',
    'token has been expired',
    'token expired',
    'token revoked',
    'refresh access token',
    'token has been revoked',
    'expired or revoked',
    'oauth',
    'refresh token'
  ];
  
  if (tokenErrorPatterns.some(pattern => errorMessage.includes(pattern))) {
    return {
      title: "Email Connection Expired",
      description: "Your email connection has expired or been revoked. Please go to Settings → Email Connections and reconnect your account to continue scanning.",
      action: "Reconnect account",
      type: "auth"
    };
  }

  // Database errors
  if (errorMessage.includes("rls") || errorMessage.includes("row-level security")) {
    return {
      title: "Access Denied",
      description: "You don't have permission to perform this action. Please make sure you're logged in.",
      action: "Sign in",
      type: "auth"
    };
  }

  // Deletion request errors
  if (errorMessage.includes("deletion") && errorMessage.includes("failed")) {
    return {
      title: "Deletion Request Failed",
      description: "We couldn't send your deletion request. The service may not have proper contact information yet.",
      action: "Discover contact first",
      type: "generic"
    };
  }

  // Scan errors
  if (errorMessage.includes("scan") && errorMessage.includes("failed")) {
    return {
      title: "Scan Failed",
      description: "We couldn't complete your email scan. This might be due to Gmail API limits or connection issues.",
      action: "Try again later",
      type: "generic"
    };
  }

  // Authorization errors
  if (errorMessage.includes("authorization") || errorMessage.includes("not authorized") || errorMessage.includes("unauthorized")) {
    return {
      title: "Authorization Required",
      description: "You need to complete the authorization process before using this feature.",
      action: "Complete authorization",
      type: "auth"
    };
  }

  // Quota/limit errors
  if (errorMessage.includes("quota") || errorMessage.includes("limit exceeded")) {
    return {
      title: "Quota Exceeded",
      description: "You've reached your usage limit for this feature. Upgrade to Pro for higher limits or wait until your quota resets.",
      action: "View limits",
      type: "payment_required"
    };
  }

  // Generic fallback
  return {
    title: "Something Went Wrong",
    description: errorMessage || "An unexpected error occurred. Please try again or contact support if the problem persists.",
    action: "Try again",
    type: "generic"
  };
};

/**
 * Success messages for common actions
 */
export const successMessages = {
  scanComplete: {
    title: "Scan Complete!",
    message: "We've discovered services in your inbox. Review them below and request deletions as needed."
  },
  deletionRequested: {
    title: "Deletion Request Sent!",
    message: "Your deletion request has been sent. We'll track the status and notify you of any updates."
  },
  gmailConnected: {
    title: "Gmail Connected!",
    message: "Your Gmail account is now connected. You can start scanning for services."
  },
  authorizationComplete: {
    title: "Authorization Complete!",
    message: "You're all set! You can now use all features to manage your digital footprint."
  },
  contactDiscovered: {
    title: "Contact Discovered!",
    message: "We found privacy contact information for this service."
  },
  batchDeletionComplete: {
    title: "Batch Deletion Complete!",
    message: "All deletion requests have been sent successfully."
  }
};
