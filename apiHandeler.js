// ======= keys =======
const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

// ======= helpers =======
function accessTokenFinder() {
  const accessTokenStorage = localStorage.getItem(ACCESS_TOKEN_KEY);
  const refreshTokenStorage = localStorage.getItem(REFRESH_TOKEN_KEY);
  const accessTokenSession = sessionStorage.getItem(ACCESS_TOKEN_KEY);
  const refreshTokenSession = sessionStorage.getItem(REFRESH_TOKEN_KEY);

  if (accessTokenStorage) {
    return {
      accessToken: accessTokenStorage,
      refreshToken: refreshTokenStorage || null,
      error: null,
      storage: "local",
    };
  } else if (accessTokenSession) {
    return {
      accessToken: accessTokenSession,
      refreshToken: refreshTokenSession || null,
      error: null,
      storage: "session",
    };
  } else {
    return { accessToken: null, refreshToken: null, error: "no_authenticated", storage: null };
  }
}

function saveTokens(tokens = {}, remember = false) {
  // tokens expected shape: { access: "...", refresh: "..." }
  if (!tokens || !tokens.access) return;
  // clear existing tokens first
  clearTokens();

  if (remember) {
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access);
    if (tokens.refresh) localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh);
  } else {
    sessionStorage.setItem(ACCESS_TOKEN_KEY, tokens.access);
    if (tokens.refresh) sessionStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh);
  }
}

function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
}

function _checkParams(arr) {
  return Array.isArray(arr) && arr.every(v => v !== undefined && v !== null && v !== "");
}

async function _safeJson(response) {
  try {
    return await response.json();
  } catch (e) {
    return null;
  }
}

function _authHeaderMaybe() {
  const { accessToken, error } = accessTokenFinder();
  if (error || !accessToken) return {};
  return { Authorization: "Bearer " + accessToken };
}

// ======= API functions =======
async function signup(email, phone_number, password, first_name, last_name) {
  if (!_checkParams([email, phone_number, password, first_name, last_name])) {
    return { error: "no_params", msg: null, user: null, tokens: null, status: null };
  }

  const body = { email, phone_number, password, first_name, last_name };

  try {
    const response = await fetch("/api/signup/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const result = await _safeJson(response);

    if (!response.ok) {
      return {
        error: (result && result.error) || "unknown_error",
        msg: null,
        user: null,
        tokens: null,
        status: response.status,
      };
    }

    // اگر بک‌اند توکن برگردوند، ما پیش‌فرض آنها را در session ذخیره می‌کنیم (تا کاربر بلافاصله وارد باشد)
    // اگر می‌خواهی این رفتار را تغییر بدی (مثلاً ذخیره در local یا عدم ذخیره)، بگو تا تغییر دهم.
    if (result && result.tokens) {
      // signup معمولاً بدون remember فراخوانده می‌شود -> sessionStorage منطقی است
      saveTokens(result.tokens, false);
    }

    return {
      error: null,
      msg: (result && (result.msg || result.message)) || null,
      user: (result && result.user) || null,
      tokens: (result && result.tokens) || null,
      status: response.status,
    };
  } catch (err) {
    return { error: "network_error", msg: null, user: null, tokens: null, status: null };
  }
}

async function login() {
  const { accessToken, error } = accessTokenFinder();
  if (error) {
    return { error: error, msg: null, user: null, user_type: null, status: null };
  }

  try {
    const response = await fetch("/api/login/", {
      method: "POST",
      headers: Object.assign({ "Content-Type": "application/json" }, _authHeaderMaybe()),
      // Note: backend login expects JWT in Authorization header, no body required.
    });

    const result = await _safeJson(response);

    if (!response.ok) {
      return {
        error: (result && result.error) || "jwt_invalid",
        msg: null,
        user: null,
        user_type: null,
        status: response.status,
      };
    }

    return {
      error: null,
      msg: (result && (result.success || result.msg)) || null,
      user: (result && result.user) || null,
      user_type: (result && result.user_type) || null,
      status: response.status,
    };
  } catch (err) {
    return { error: "network_error", msg: null, user: null, user_type: null, status: null };
  }
}

async function manualLogin(email, password, remember = false) {
  if (!_checkParams([email, password])) {
    return { error: "no_params", msg: null, status: null, user: null, tokens: null, user_type: null };
  }

  // enforce boolean
  remember = Boolean(remember);

  const body = { email, password, remember };

  try {
    const response = await fetch(`/api/manual-login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body), // remember only in body
    });

    const result = await _safeJson(response);

    if (!response.ok) {
      return {
        error: (result && result.error) || "auth_failed",
        msg: null,
        status: response.status,
        user: null,
        tokens: null,
        user_type: null,
      };
    }

    // اگر سرور توکن فرستاد، براساس remember آن را ذخیره کن
    const serverTokens = (result && result.tokens) ? result.tokens : null;
    if (serverTokens) {
      saveTokens(serverTokens, remember);
    }

    return {
      error: null,
      msg: (result && (result.success || result.msg)) || null,
      status: response.status,
      user: (result && result.user) || null,
      // مطابق منطق قبلی: فقط زمانی tokens را برمی‌گردانیم که remember===true و سرور tokens داده باشد
      tokens: (remember && serverTokens) ? serverTokens : null,
      user_type: (result && result.user_type) || null,
    };
  } catch (err) {
    return { error: "network_error", msg: null, status: null, user: null, tokens: null, user_type: null };
  }
}

async function createAdmin(first_name, last_name, email, password, phone_number) {
  if (!_checkParams([first_name, last_name, email, password, phone_number])) {
    return { error: "no_params", msg: null, status: null, user: null };
  }

  const { accessToken, error } = accessTokenFinder();
  if (error) {
    return { error: error, msg: null, status: null, user: null };
  }

  const body = { first_name, last_name, email, password, phone_number };

  try {
    const response = await fetch("/api/create-admin/", {
      method: "POST",
      headers: Object.assign({ "Content-Type": "application/json" }, _authHeaderMaybe()),
      body: JSON.stringify(body),
    });

    const result = await _safeJson(response);

    if (!response.ok) {
      return {
        error: (result && result.error) || "error",
        msg: null,
        status: response.status,
        user: null,
      };
    }

    return {
      error: null,
      msg: (result && (result.msg || result.message)) || null,
      status: response.status,
      user: (result && result.user) || null,
    };
  } catch (err) {
    return { error: "network_error", msg: null, status: null, user: null };
  }
}

async function subOrder(title, description, tools_description) {
  if (!_checkParams([title, description, tools_description])) {
    return { error: "no_params", msg: null, status: null, order: null };
  }

  const { accessToken, error } = accessTokenFinder();
  if (error) {
    return { error: error, msg: null, status: null, order: null };
  }

  const body = { title, description, tools_description };

  try {
    const response = await fetch("/api/sub-order/", {
      method: "POST",
      headers: Object.assign({ "Content-Type": "application/json" }, _authHeaderMaybe()),
      body: JSON.stringify(body),
    });

    const result = await _safeJson(response);

    if (!response.ok) {
      return {
        error: (result && result.error) || "error",
        msg: null,
        status: response.status,
        order: null,
      };
    }

    return {
      error: null,
      msg: (result && (result.msg || result.message)) || null,
      status: response.status,
      order: (result && result.order) || null,
    };
  } catch (err) {
    return { error: "network_error", msg: null, status: null, order: null };
  }
}
