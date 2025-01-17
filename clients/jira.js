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

      const withoutProtected = response.data.filter(
        (el) => el.id != PROTECTED_CLOUD_ID
      );

      if (!response.data || response.data.length === 0) {
        throw new Error("No Jira cloud instances found");
      }

      if (withoutProtected[0].id === PROTECTED_CLOUD_ID)
        throw new Error("Permission denied for safety :) (Acowebs Jira Cloud)");

      return withoutProtected[0].id;
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
        throw new Error("Permission denied for safety :) (Acowebs Jira Cloud)");
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
    console.log("Creating webhook at url:", url);

    return axios.post(url, webhookData, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });
  },
  async listWebhooks(accessToken, cloudId) {
    const url = `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/webhook`;

    try {
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      });

      return response;
    } catch (error) {
      console.error("Webhook listing failed:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      throw error;
    }
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
  async getEmployeeDetails(accessToken, cloudId) {
    const url = `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/users/search`;

    return axios.get(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });
  },
  async getProjectDetails(accessToken, cloudId, hostname) {
    const url = `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/project`;
    const test_url = `https://${hostname}.atlassian.net/rest/api/3/project`;

    return axios.get(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });
  },
  async getProject(self, accessToken) {
    try {
      const response = axios.get(self, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      });

      return response;
    } catch (error) {}
  },
  async getBulkIssues(accessToken, cloudId, key) {
    const url = `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/search?jql=project="${encodeURIComponent(
      key
    )}"`;

    return axios.get(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });
  },
};

const getAuthorizationUrl = async (req, res) => {
  const temp_scopes = (process.env.SCOPES &&
    JSON.parse(process.env.SCOPES)) || [
    "write:webhook:jira",
    "delete:webhook:jira",
    "read:webhook:jira",
    "read:jql:jira",
    "read:jira-work",
    "read:field:jira",
    "read:project:jira",
    "read:jira-user",
    "read:application-role:jira",
    "read:group:jira",
    "read:user:jira",
    "read:avatar:jira",
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
    if (!cloudId) throw new Error("No cloud Id found");
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

    console.log("Authentication successful, redirecting to organization");

    const url = `/jira/organization/${cloudId}`;

    res.on("finish", (data) => {
      console.log(`Redirecting to ${url}`);
    });

    return res.redirect(url);
  } catch (error) {
    console.log("Authentication error", error.response?.data || error.message);
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
