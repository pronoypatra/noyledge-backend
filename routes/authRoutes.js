import express from "express";
import { registerUser, loginUser, googleLogin, refreshToken, casLogin } from "../controllers/authController.js";
import protect from "../middleware/authMiddleware.js";
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import { parseString } from "xml2js";
import env from "../config/env.js";

const router = express.Router();

// CAS Configuration
// Get backend URL - CAS server needs to be able to reach this URL
const getBackendUrl = (req) => {
  // Priority: BACKEND_URL env var > construct from request > default localhost
  if (env.BACKEND_URL && env.BACKEND_URL !== `http://localhost:${env.PORT}`) {
    return env.BACKEND_URL;
  }
  // Try to get from request (for production with proxies)
  if (req) {
    const protocol = req.protocol || 'http';
    const host = req.get('host') || `localhost:${env.PORT}`;
    return `${protocol}://${host}`;
  }
  // Fallback to env or localhost
  return env.BACKEND_URL || `http://localhost:${env.PORT}`;
};

// Get CAS config from env module (already loaded)
const getCasConfig = () => {
  return {
    cas_url: env.CAS_URL,
    cas_version: env.CAS_VERSION,
  };
};

// CAS Login - redirects to CAS server
router.get("/cas/login", (req, res) => {
  // Service URL must be the backend callback endpoint
  // CAS server will redirect back to this URL after authentication
  const casConfig = getCasConfig();
  const backendUrl = getBackendUrl(req);
  const serviceUrl = `${backendUrl}/api/auth/cas/callback`;
  const casLoginUrl = `${casConfig.cas_url}/login?service=${encodeURIComponent(serviceUrl)}`;
  res.redirect(casLoginUrl);
});

// CAS Callback - handles ticket validation
router.get("/cas/callback", async (req, res) => {
  try {
    const ticket = req.query.ticket;
    
    if (!ticket) {
      return res.redirect(`${env.FRONTEND_URL}/login?error=cas_no_ticket`);
    }

    // Validate ticket with CAS server
    // Service URL must match what we sent in the login request
    const casConfig = getCasConfig();
    const backendUrl = getBackendUrl(req);
    const serviceUrl = `${backendUrl}/api/auth/cas/callback`;
    const validateUrl = `${casConfig.cas_url}/serviceValidate?service=${encodeURIComponent(serviceUrl)}&ticket=${ticket}`;
    
    const response = await fetch(validateUrl);
    const xmlText = await response.text();
    
    // Parse CAS XML response
    let casId, email, name;
    
    try {
      const result = await new Promise((resolve, reject) => {
        // Use explicitArray: true to handle arrays properly
        parseString(xmlText, { explicitArray: true, mergeAttrs: true }, (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        });
      });
      
      // Extract user information from CAS response
      // CAS XML structure: <cas:serviceResponse><cas:authenticationSuccess><cas:user>username</cas:user>...
      const serviceResponse = result["cas:serviceResponse"] || result["serviceResponse"];
      if (!serviceResponse) {
        throw new Error("No serviceResponse in CAS XML");
      }
      
      const authSuccess = serviceResponse["cas:authenticationSuccess"] || serviceResponse["authenticationSuccess"];
      if (!authSuccess) {
        // Check for authentication failure
        const authFailure = serviceResponse["cas:authenticationFailure"] || serviceResponse["authenticationFailure"];
        if (authFailure) {
          const errorMsg = authFailure[0]?._ || authFailure[0] || "CAS authentication failed";
          throw new Error(errorMsg);
        }
        throw new Error("No authentication success or failure in CAS response");
      }
      
      // Handle array or single value
      const authSuccessObj = Array.isArray(authSuccess) ? authSuccess[0] : authSuccess;
      casId = authSuccessObj["cas:user"]?.[0] || authSuccessObj["user"]?.[0] || authSuccessObj["cas:user"] || authSuccessObj["user"];
      
      // Extract attributes if available
      const attributes = authSuccessObj["cas:attributes"]?.[0] || authSuccessObj["attributes"]?.[0] || authSuccessObj["cas:attributes"] || authSuccessObj["attributes"];
      if (attributes) {
        email = attributes["cas:email"]?.[0] || attributes["email"]?.[0] || attributes["cas:email"] || attributes["email"];
        name = attributes["cas:displayName"]?.[0] || attributes["displayName"]?.[0] || 
               attributes["cas:name"]?.[0] || attributes["name"]?.[0] ||
               attributes["cas:displayName"] || attributes["displayName"] ||
               attributes["cas:name"] || attributes["name"];
      }
    } catch (parseError) {
      // Fallback to regex parsing
      const usernameMatch = xmlText.match(/<cas:user[^>]*>(.*?)<\/cas:user>/i) || xmlText.match(/<user[^>]*>(.*?)<\/user>/i);
      if (usernameMatch) {
        casId = usernameMatch[1];
      } else {
        // Try to find any user tag
        const anyUserMatch = xmlText.match(/<[^:]*:?user[^>]*>([^<]+)<\/[^:]*:?user>/i);
        if (anyUserMatch) {
          casId = anyUserMatch[1];
        }
      }
    }
    
    if (!casId) {
      return res.redirect(`${env.FRONTEND_URL}/login?error=cas_validation_failed`);
    }

    // Set defaults if not provided by CAS
    if (!email) {
      email = `${casId}@${env.CAS_EMAIL_DOMAIN}`;
    }
    if (!name) {
      name = casId;
    }

    // Create or update user
    let user = await User.findOne({ email });
    
    if (user) {
      if (!user.casId) {
        user.casId = casId;
        user.oauthProvider = "cas";
        await user.save();
      }
    } else {
      user = await User.create({
        name,
        email,
        casId,
        oauthProvider: "cas",
        role: "user",
      });
    }

    // Generate token
    const token = generateToken(user._id, user.role);
    
    // Redirect to frontend with token
    const redirectUrl = `${env.FRONTEND_URL}/auth/cas/success?token=${token}`;
    res.redirect(redirectUrl);
  } catch (error) {
    // Silent error handling - redirect to login with error parameter
    res.redirect(`${env.FRONTEND_URL}/login?error=cas_error`);
  }
});

// CAS Login endpoint for frontend (alternative approach)
router.post("/cas", casLogin);

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/google", googleLogin);
router.post("/refresh", protect, refreshToken);

export default router;
