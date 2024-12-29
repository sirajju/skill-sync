const { getPrismaClient } = require("../config/prisma");
const Prisma = getPrismaClient();
const axios = require("axios");

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI =
  process.env.AUTH_REDIRECT_URI || "http://localhost:5000/jira/authenticate";
const PROTECTED_CLOUD_ID = process.env.PROTECTED_CLOUD_ID;

const TokenManager = {
  async readToken(cloudId) {
    try {
      const data = await Prisma.token.findFirst({
        where: {
          cloudId,
        },
      });
      return data.access_token;
    } catch (error) {
      console.error("Error reading token:", error);
      return null;
    }
  },

  async refreshToken(cloudId, refreshToken) {
    try {
      const response = await axios.post(
        "https://auth.atlassian.com/oauth/token",
        {
          grant_type: "refresh_token",
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          refresh_token: refreshToken,
        }
      );

      const tokenData = {
        access_token: response.data.access_token,
        scope: response.data.scope,
        type: response.data.token_type,
        expires_at: Date.now() + response.data.expires_in * 1000,
        expires_in: response.data.expires_in,
        ...(response.data.refresh_token && {
          refresh_token: response.data.refresh_token,
        }),
      };

      return await Prisma.token.update({
        where: {
          cloudId,
        },
        data: tokenData,
      });
    } catch (error) {
      console.error("Error refreshing token:", error);
      throw error;
    }
  },

  isTokenExpired(tokenData) {
    return !tokenData.expires_at || tokenData.expires_at < Date.now();
  },
};

const verifyToken = async (req, res, next) => {
  try {
    const cloudId = req.auth?.orgId || req.headers["x-cloud-id"];
    const tokenData = await TokenManager.readToken(cloudId);

    if (!tokenData || !tokenData.access_token) {
      console.log("No token found, redirecting to login");
      return res.redirect("/jira/login");
    }

    if (TokenManager.isTokenExpired(tokenData)) {
      console.log("Token expired, attempting refresh");
      if (tokenData.refresh_token) {
        const newTokenData = await TokenManager.refreshToken(
          tokenData.refresh_token
        );
        req.tokenData = newTokenData;
      } else {
        console.log("No refresh token, redirecting to login");
        return res.redirect("/jira/login");
      }
    } else {
      req.tokenData = tokenData;
    }

    // Debug log token status
    console.log("Token verified:", {
      expires_at: req.tokenData.expires_at,
      expired: TokenManager.isTokenExpired(req.tokenData),
    });

    next();
  } catch (error) {
    console.error("Token verification error:", error);
    res.redirect("/jira/login");
  }
};

const getBasicAuthCredentials = () => {
  const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString(
    "base64"
  );
  return `Basic ${credentials}`;
};

const JiraClient = {
  async getCloudId(accessToken) {
    try {
      const response = await axios.get(
        "https://api.atlassian.com/oauth/token/accessible-resources",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/json",
          },
        }
      );

      console.log(response.data);

      if (!response.data || response.data.length === 0) {
        throw new Error("No Jira cloud instances found");
      }

      if (response.data[0].id === PROTECTED_CLOUD_ID)
        throw new Error("Permission denied (Acowebs Jira Cloud)");

      return response.data[0].id;
    } catch (error) {
      console.error(
        "Error getting cloud ID:",
        error.response?.data || error.message
      );
      throw error;
    }
  },
  async getOrganizationDetails(accessToken, cloudId) {
    try {
      const response = await axios.get(
        "https://api.atlassian.com/oauth/token/accessible-resources",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/json",
          },
        }
      );

      const accessibleOrganizations = response.data;
      const currentResource = accessibleOrganizations.find(
        (el) => el.id == cloudId
      );

      if (!accessibleOrganizations || accessibleOrganizations.length === 0) {
        throw new Error("No Jira cloud instances found");
      }

      if (currentResource.id === PROTECTED_CLOUD_ID)
        throw new Error("Permission denied (Acowebs Jira Cloud)");
      return currentResource;
    } catch (error) {
      console.error(
        "Error getting org :",
        error.response?.data || error.message
      );
      throw error;
    }
  },
  async createWebhook(accessToken, cloudId, webhookData) {
    const url = `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/webhook`;
    // const url =
    // "https://hackathon-webhook-test/rest/webhooks/1.0/webhook";
    console.log("Creating webhook at URL:", url);

    return axios.post(url, webhookData, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });
  },
  async extendLifecycle(accessToken, cloudId, webhookIds) {
    const url = `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/webhook/refresh`;

    return axios.post(url, webhookIds, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });
  },
  async getAccountDetails(accessToken, accountId) {
    const url = `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/user?accountId=${accountId}`;

    return axios.get(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });
  },
};

const getAuthorizationUrl = async (req, res) => {
  const temp_scopes = [
    "write:webhook:jira",
    "delete:webhook:jira",
    "read:webhook:jira",
    "read:jql:jira",
    "read:jira-work",
    "read:field:jira",
    "read:project:jira",
  ];

  const scopes = encodeURIComponent(temp_scopes.join(" "));
  const url =
    `https://auth.atlassian.com/authorize?` +
    `audience=api.atlassian.com&` +
    `client_id=${CLIENT_ID}&` +
    `scope=${scopes}&` +
    `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
    `response_type=code&` +
    `prompt=consent&` +
    `state=${encodeURIComponent("abc123")}`;

  res.redirect(url);
};

const authenticate = async (req, res, next) => {
  try {
    const { code, error } = req.query;
    if (error) {
      console.error("OAuth error:", error);
      return res.status(400).json({ error: error });
    }
    if (!code) {
      return res.redirect(await getAuthorizationUrl());
    }
    // Exchange code for token
    const response = await axios.post(
      "https://auth.atlassian.com/oauth/token",
      {
        grant_type: "authorization_code",
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code: code,
        redirect_uri: REDIRECT_URI,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const cloudId = await JiraClient.getCloudId(response.data.access_token);

    const data = {
      access_token: response.data.access_token,
      cloudId,
      expires_at: new Date(Date.now() + response.data.expires_in * 1000),
      expires_in: response.data.expires_in,
      scope: response.data.scope,
      ...(response.data.refresh_token && {
        refresh_token: response.data.refresh_token,
      }),
      type: response.data.token_type,
    };

    await Prisma.token.create({
      data,
    });

    return res.redirect(`/jira/organization/${cloudId}`);
  } catch (error) {
    console.error(
      "Authentication error:",
      error.response?.data || error.message
    );
    next(error);
  }
};

module.exports = {
  TokenManager,
  verifyToken,
  getBasicAuthCredentials,
  JiraClient,
  authenticate,
  CLIENT_ID,
  CLIENT_SECRET,
  getAuthorizationUrl,
};
