// یافتن Access Token از localStorage یا sessionStorage
function accessTokenFinder() {
  const accesstokenStorage = localStorage.getItem("access_token");
  const accesstokenSession = sessionStorage.getItem("access_token");
  if (accesstokenStorage) {
    return { accessToken: accesstokenStorage, error: null };
  } else if (accesstokenSession) {
    return { accessToken: accesstokenSession, error: null };
  } else {
    return { accessToken: null, error: "no_authenticated".toString() };
  }
}

// ثبت نام کاربر جدید
async function signup(email, phone_number, password, first_name, last_name) {
  const params = [email, phone_number, password, first_name, last_name];
  if (!params.every(param => param)) { // اصلاح every()
    return { error: "no_params", msg: null, status: null };
  }
  
  const body = {
    email: email,
    phone_number: phone_number,
    password: password,
    first_name: first_name,
    last_name: last_name,
  };
  
  const { accessToken, error } = accessTokenFinder();
  if (error) {
    return { error: error, msg: null, status: null, user: null };
  }
  
  const response = await fetch("/api/signup/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + accessToken.toString(),
    },
    body: JSON.stringify(body),
  });

  const result = await response.json(); // اضافه شدن await
  
  if (!response.ok) {
    return { error: result.error, msg: null, status: result.status };
  } else {
    return {
      error: null,
      msg: result.message.toString(),
      user: result.user,
      tokens: result.tokens,
      status: result.status,
    };
  }
}

// ورود خودکار با token
async function login() {
  const { accessToken, error } = accessTokenFinder();
  if (error) {
    return { error: error, msg: null, status: null, user: null };
  }
  
  const response = await fetch("/api/login/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + accessToken.toString(),
    },
  });

  const result = await response.json(); // اضافه شدن await
  
  if (!response.ok) {
    return { error: result.error, msg: null, status: result.status };
  } else {
    return {
      error: null,
      msg: result.success.toString(),
      user: result.user,
      user_type: result.user_type,
      status: result.status,
    };
  }
}

// ورود دستی با ایمیل و پسورد
async function manualLogin(email, password, remember) {
  const params = [email, password];
  if (!params.every(param => param)) { // اصلاح every()
    return {
      error: "no_params",
      msg: null,
      status: null,
      user: null,
      tokens: null,
      user_type: null,
    };
  }
  
  const body = { email: email, password: password, remember: remember };

  const response = await fetch("/api/manual-login/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const result = await response.json(); // اضافه شدن await
  
  if (!response.ok) {
    return {
      error: result.error,
      msg: null,
      status: result.status,
      user: null,
      tokens: null,
      user_type: null,
    };
  } else {
    // ذخیره token در صورت انتخاب remember me
    if (remember === true && result.tokens) {
      localStorage.setItem("access_token", result.tokens.access);
      if (result.tokens.refresh) {
        localStorage.setItem("refresh_token", result.tokens.refresh);
      }
    } else if (remember === false && result.tokens) {
      sessionStorage.setItem("access_token", result.tokens.access);
      if (result.tokens.refresh) {
        sessionStorage.setItem("refresh_token", result.tokens.refresh);
      }
    }
    
    return {
      error: null,
      msg: result.success,
      status: result.status,
      user: result.user,
      tokens: result.tokens,
      user_type: result.user_type,
    };
  }
}

// ایجاد ادمین جدید
async function createAdmin(first_name, last_name, email, password, phone_number) {
  const params = [first_name, last_name, email, password, phone_number];
  if (!params.every(param => param)) { // اصلاح every()
    return { error: "no_params", msg: null, status: null, user: null };
  }

  const body = {
    first_name: first_name,
    last_name: last_name,
    email: email,
    password: password,
    phone_number: phone_number,
  };

  const { accessToken, error } = accessTokenFinder();
  if (error) {
    return { error: error, msg: null, status: null, user: null };
  }

  const response = await fetch("/api/admin/create-admin/", { // اضافه شدن endpoint
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + accessToken.toString(),
    },
    body: JSON.stringify(body),
  });

  const result = await response.json(); // اضافه شدن await

  if (!response.ok) {
    return {
      error: result.error,
      msg: null,
      status: result.status,
      user: null,
    };
  } else {
    return {
      error: null,
      msg: result.msg,
      status: result.status,
      user: result.user,
    };
  }
}

// ثبت سفارش جدید
async function subOrder(orderData) {
  if (!orderData || typeof orderData !== 'object') {
    return { error: "no_params", msg: null, status: null, order: null };
  }
  
  const { accessToken, error } = accessTokenFinder();
  if (error) {
    return { error: error, msg: null, status: null, order: null };
  }

  const response = await fetch("/api/sub-order/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + accessToken.toString(),
    },
    body: JSON.stringify(orderData),
  });
  
  const result = await response.json();

  if (!response.ok) {
    return {
      error: result.error,
      msg: null,
      status: result.status,
      order: null,
    };
  } else {
    return {
      error: null,
      msg: result.msg,
      status: result.status,
      order: result.order,
    };
  }
}

// ========== API های مدیریت کاربران ==========

// دریافت لیست کاربران
async function getUsers(page = 1, limit = 10, status = '', search = '') {
  const { accessToken, error } = accessTokenFinder();
  if (error) {
    return { error: error, msg: null, status: null, users: null, total: 0 };
  }

  const params = new URLSearchParams({
    page: page,
    limit: limit,
    ...(status && { status }),
    ...(search && { search })
  });

  const response = await fetch(`/api/admin/users/?${params}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + accessToken.toString(),
    }
  });

  const result = await response.json();
  
  if (!response.ok) {
    return { 
      error: result.error, 
      msg: null, 
      status: result.status, 
      users: null, 
      total: 0 
    };
  } else {
    return {
      error: null,
      msg: result.message,
      status: result.status,
      users: result.users || result.data,
      total: result.total || result.count || 0
    };
  }
}

// دریافت اطلاعات یک کاربر
async function getUser(userId) {
  const { accessToken, error } = accessTokenFinder();
  if (error) {
    return { error: error, msg: null, status: null, user: null };
  }

  const response = await fetch(`/api/admin/users/${userId}/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + accessToken.toString(),
    }
  });

  const result = await response.json();
  
  if (!response.ok) {
    return { error: result.error, msg: null, status: result.status, user: null };
  } else {
    return {
      error: null,
      msg: result.message,
      status: result.status,
      user: result.user
    };
  }
}

// ایجاد کاربر جدید توسط ادمین
async function createUser(userData) {
  if (!userData || typeof userData !== 'object') {
    return { error: "no_params", msg: null, status: null, user: null };
  }

  const { accessToken, error } = accessTokenFinder();
  if (error) {
    return { error: error, msg: null, status: null, user: null };
  }

  const response = await fetch("/api/admin/users/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + accessToken.toString(),
    },
    body: JSON.stringify(userData)
  });

  const result = await response.json();
  
  if (!response.ok) {
    return { error: result.error, msg: null, status: result.status, user: null };
  } else {
    return {
      error: null,
      msg: result.message,
      status: result.status,
      user: result.user
    };
  }
}

// به‌روزرسانی کاربر
async function updateUser(userId, userData) {
  if (!userId || !userData || typeof userData !== 'object') {
    return { error: "no_params", msg: null, status: null, user: null };
  }

  const { accessToken, error } = accessTokenFinder();
  if (error) {
    return { error: error, msg: null, status: null, user: null };
  }

  const response = await fetch(`/api/admin/users/${userId}/`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + accessToken.toString(),
    },
    body: JSON.stringify(userData)
  });

  const result = await response.json();
  
  if (!response.ok) {
    return { error: result.error, msg: null, status: result.status, user: null };
  } else {
    return {
      error: null,
      msg: result.message,
      status: result.status,
      user: result.user
    };
  }
}

// حذف کاربر
async function deleteUser(userId) {
  if (!userId) {
    return { error: "no_params", msg: null, status: null };
  }

  const { accessToken, error } = accessTokenFinder();
  if (error) {
    return { error: error, msg: null, status: null };
  }

  const response = await fetch(`/api/admin/users/${userId}/`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + accessToken.toString(),
    }
  });

  const result = await response.json();
  
  if (!response.ok) {
    return { error: result.error, msg: null, status: result.status };
  } else {
    return {
      error: null,
      msg: result.message,
      status: result.status
    };
  }
}

// تغییر وضعیت کاربر
async function updateUserStatus(userId, newStatus) {
  if (!userId || !newStatus) {
    return { error: "no_params", msg: null, status: null, user: null };
  }

  const { accessToken, error } = accessTokenFinder();
  if (error) {
    return { error: error, msg: null, status: null, user: null };
  }

  const response = await fetch(`/api/admin/users/${userId}/status/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + accessToken.toString(),
    },
    body: JSON.stringify({ status: newStatus })
  });

  const result = await response.json();
  
  if (!response.ok) {
    return { error: result.error, msg: null, status: result.status, user: null };
  } else {
    return {
      error: null,
      msg: result.message,
      status: result.status,
      user: result.user
    };
  }
}

// ========== API های مدیریت سفارش‌ها ==========

// دریافت لیست سفارش‌ها
async function getOrders(page = 1, limit = 10, status = '', search = '') {
  const { accessToken, error } = accessTokenFinder();
  if (error) {
    return { error: error, msg: null, status: null, orders: null, total: 0 };
  }

  const params = new URLSearchParams({
    page: page,
    limit: limit,
    ...(status && { status }),
    ...(search && { search })
  });

  const response = await fetch(`/api/admin/orders/?${params}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + accessToken.toString(),
    }
  });

  const result = await response.json();
  
  if (!response.ok) {
    return { 
      error: result.error, 
      msg: null, 
      status: result.status, 
      orders: null, 
      total: 0 
    };
  } else {
    return {
      error: null,
      msg: result.message,
      status: result.status,
      orders: result.orders || result.data,
      total: result.total || result.count || 0
    };
  }
}

// دریافت جزئیات یک سفارش
async function getOrder(orderId) {
  if (!orderId) {
    return { error: "no_params", msg: null, status: null, order: null };
  }

  const { accessToken, error } = accessTokenFinder();
  if (error) {
    return { error: error, msg: null, status: null, order: null };
  }

  const response = await fetch(`/api/admin/orders/${orderId}/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + accessToken.toString(),
    }
  });

  const result = await response.json();
  
  if (!response.ok) {
    return { error: result.error, msg: null, status: result.status, order: null };
  } else {
    return {
      error: null,
      msg: result.message,
      status: result.status,
      order: result.order
    };
  }
}

// تغییر وضعیت سفارش
async function updateOrderStatus(orderId, newStatus) {
  if (!orderId || !newStatus) {
    return { error: "no_params", msg: null, status: null, order: null };
  }

  const { accessToken, error } = accessTokenFinder();
  if (error) {
    return { error: error, msg: null, status: null, order: null };
  }

  const response = await fetch(`/api/admin/orders/${orderId}/status/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + accessToken.toString(),
    },
    body: JSON.stringify({ status: newStatus })
  });

  const result = await response.json();
  
  if (!response.ok) {
    return { error: result.error, msg: null, status: result.status, order: null };
  } else {
    return {
      error: null,
      msg: result.message,
      status: result.status,
      order: result.order
    };
  }
}

// حذف سفارش
async function deleteOrder(orderId) {
  if (!orderId) {
    return { error: "no_params", msg: null, status: null };
  }

  const { accessToken, error } = accessTokenFinder();
  if (error) {
    return { error: error, msg: null, status: null };
  }

  const response = await fetch(`/api/admin/orders/${orderId}/`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + accessToken.toString(),
    }
  });

  const result = await response.json();
  
  if (!response.ok) {
    return { error: result.error, msg: null, status: result.status };
  } else {
    return {
      error: null,
      msg: result.message,
      status: result.status
    };
  }
}

// ========== API های داشبورد ==========

// دریافت آمار داشبورد
async function getDashboardStats() {
  const { accessToken, error } = accessTokenFinder();
  if (error) {
    return { error: error, msg: null, status: null, stats: null };
  }

  const response = await fetch("/api/admin/dashboard/stats/", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + accessToken.toString(),
    }
  });

  const result = await response.json();
  
  if (!response.ok) {
    return { error: result.error, msg: null, status: result.status, stats: null };
  } else {
    return {
      error: null,
      msg: result.message,
      status: result.status,
      stats: result.stats || result.data
    };
  }
}

// دریافت نمودار فروش
async function getSalesChart(period = 'month') {
  const { accessToken, error } = accessTokenFinder();
  if (error) {
    return { error: error, msg: null, status: null, chartData: null };
  }

  const response = await fetch(`/api/admin/dashboard/sales-chart/?period=${period}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + accessToken.toString(),
    }
  });

  const result = await response.json();
  
  if (!response.ok) {
    return { error: result.error, msg: null, status: result.status, chartData: null };
  } else {
    return {
      error: null,
      msg: result.message,
      status: result.status,
      chartData: result.chartData || result.data
    };
  }
}

// ========== توابع کمکی ==========

// خروج از سیستم
async function logout() {
  const { accessToken, error } = accessTokenFinder();
  
  if (!error) {
    try {
      await fetch("/api/logout/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + accessToken.toString(),
        }
      });
    } catch (err) {
      console.log("خطا در خروج از سرور:", err);
    }
  }

  // پاک کردن token ها از storage
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  sessionStorage.removeItem("access_token");
  sessionStorage.removeItem("refresh_token");
  
  return { error: null, msg: "خروج موفقیت‌آمیز بود", status: 200 };
}

// تجدید Access Token
async function refreshAccessToken() {
  const refreshToken = localStorage.getItem("refresh_token") || sessionStorage.getItem("refresh_token");
  
  if (!refreshToken) {
    return { error: "no_refresh_token", accessToken: null };
  }

  const response = await fetch("/api/token/refresh/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refresh: refreshToken })
  });

  const result = await response.json();
  
  if (!response.ok) {
    return { error: result.error, accessToken: null };
  } else {
    // ذخیره token جدید
    if (localStorage.getItem("refresh_token")) {
      localStorage.setItem("access_token", result.access);
    } else {
      sessionStorage.setItem("access_token", result.access);
    }
    
    return {
      error: null,
      accessToken: result.access
    };
  }
}

// تابع کمکی برای retry کردن درخواست‌ها در صورت انقضای token
async function apiCall(url, options = {}) {
  let { accessToken, error } = accessTokenFinder();
  
  if (error) {
    return { error: error, data: null };
  }

  // اولین تلاش
  let response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
      Authorization: "Bearer " + accessToken,
    }
  });

  // اگر 401 دریافت کردیم، تلاش برای تجدید token
  if (response.status === 401) {
    const refreshResult = await refreshAccessToken();
    
    if (refreshResult.error) {
      return { error: "token_refresh_failed", data: null };
    }

    // تلاش مجدد با token جدید
    response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
        Authorization: "Bearer " + refreshResult.accessToken,
      }
    });
  }

  const result = await response.json();
  
  if (!response.ok) {
    return { error: result.error || "unknown_error", data: null };
  } else {
    return { error: null, data: result };
  }
}
