/**
 * User-friendly error messages for common scenarios
 */

interface ErrorMessageConfig {
  title: string;
  description: string;
  action?: string;
}

export const getErrorMessage = (error: any): ErrorMessageConfig => {
  const errorCode = error?.code;
  const errorMessage = error?.message?.toLowerCase() || "";

  // Authentication errors
  if (errorCode === "auth/invalid-email" || errorMessage.includes("invalid email")) {
    return {
      title: "Invalid Email",
      description: "Please enter a valid email address.",
      action: "Check your email format"
    };
  }

  if (errorCode === "auth/user-not-found" || errorMessage.includes("user not found")) {
    return {
      title: "Account Not Found",
      description: "No account exists with this email. Would you like to sign up?",
      action: "Create an account"
    };
  }

  if (errorCode === "auth/wrong-password" || errorMessage.includes("wrong password")) {
    return {
      title: "Incorrect Password",
      description: "The password you entered is incorrect. Please try again.",
      action: "Reset password"
    };
  }

  if (errorCode === "auth/too-many-requests") {
    return {
      title: "Too Many Attempts",
      description: "Your account has been temporarily locked due to too many failed login attempts. Please try again later or reset your password.",
      action: "Try again in a few minutes"
    };
  }

  if (errorCode === "auth/email-already-in-use" || errorMessage.includes("already in use")) {
    return {
      title: "Email Already Registered",
      description: "An account with this email already exists. Try logging in instead.",
      action: "Go to login"
    };
  }

  // Network errors
  if (errorMessage.includes("network") || errorMessage.includes("fetch failed")) {
    return {
      title: "Connection Error",
      description: "We couldn't connect to our servers. Please check your internet connection and try again.",
      action: "Check connection"
    };
  }

  // Gmail/OAuth errors
  if (errorMessage.includes("gmail") || errorMessage.includes("oauth")) {
    return {
      title: "Gmail Connection Failed",
      description: "We couldn't connect to your Gmail account. Please try reconnecting and make sure to grant all permissions.",
      action: "Reconnect Gmail"
    };
  }

  if (errorMessage.includes("scope") || errorMessage.includes("permission")) {
    return {
      title: "Missing Permissions",
      description: "Your Gmail connection is missing required permissions. Please reconnect and grant access to scan your emails.",
      action: "Grant permissions"
    };
  }

  // Token errors
  if (errorMessage.includes("token") && errorMessage.includes("expired")) {
    return {
      title: "Session Expired",
      description: "Your session has expired. Please sign in again to continue.",
      action: "Sign in again"
    };
  }

  // Database errors
  if (errorMessage.includes("rls") || errorMessage.includes("row-level security")) {
    return {
      title: "Access Denied",
      description: "You don't have permission to perform this action. Please make sure you're logged in.",
      action: "Sign in"
    };
  }

  // Deletion request errors
  if (errorMessage.includes("deletion") && errorMessage.includes("failed")) {
    return {
      title: "Deletion Request Failed",
      description: "We couldn't send your deletion request. The service may not have proper contact information yet.",
      action: "Discover contact first"
    };
  }

  // Rate limiting
  if (errorMessage.includes("rate limit") || errorMessage.includes("too many requests")) {
    return {
      title: "Slow Down",
      description: "You're making too many requests. Please wait a moment and try again.",
      action: "Wait a minute"
    };
  }

  // Scan errors
  if (errorMessage.includes("scan") && errorMessage.includes("failed")) {
    return {
      title: "Scan Failed",
      description: "We couldn't complete your email scan. This might be due to Gmail API limits or connection issues.",
      action: "Try again later"
    };
  }

  // Authorization errors
  if (errorMessage.includes("authorization") || errorMessage.includes("not authorized")) {
    return {
      title: "Authorization Required",
      description: "You need to complete the authorization process before using this feature.",
      action: "Complete authorization"
    };
  }

  // Generic fallback
  return {
    title: "Something Went Wrong",
    description: errorMessage || "An unexpected error occurred. Please try again or contact support if the problem persists.",
    action: "Try again"
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
