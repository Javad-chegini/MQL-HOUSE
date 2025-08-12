// ======= Contact Form Handler =======
import { accessTokenFinder, saveTokens, clearTokens } from './apiHandeler.js';

// ======= Contact API Functions =======
async function submitContactForm(name, email, subject, message) {
  // بررسی پارامترها
  if (!name || !email || !subject || !message) {
    return { 
      error: "no_params", 
      msg: "لطفاً تمام فیلدها را پر کنید", 
      status: null 
    };
  }

  // بررسی فرمت ایمیل
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { 
      error: "invalid_email", 
      msg: "لطفاً یک ایمیل معتبر وارد کنید", 
      status: null 
    };
  }

  const body = {
    name,
    email,
    subject,
    message,
    timestamp: new Date().toISOString()
  };

  try {
    // بررسی وضعیت احراز هویت (اختیاری)
    const { accessToken } = accessTokenFinder();
    
    const headers = {
      "Content-Type": "application/json",
      "Accept": "application/json"
    };
    
    // اگر کاربر لاگین کرده، توکن رو اضافه کن
    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }

    const response = await fetch("/api/contact/", {
      method: "POST",
      headers: headers,
      body: JSON.stringify(body),
    });

    const result = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        error: (result && result.error) || "server_error",
        msg: (result && result.message) || "خطا در ارسال پیام",
        status: response.status,
      };
    }

    return {
      error: null,
      msg: (result && result.message) || "پیام شما با موفقیت ارسال شد",
      status: response.status,
      data: result
    };

  } catch (err) {
    console.error("Contact form error:", err);
    return { 
      error: "network_error", 
      msg: "خطا در اتصال به سرور. لطفاً دوباره تلاش کنید", 
      status: null 
    };
  }
}

// ======= UI Handler Functions =======
class ContactFormUI {
  constructor() {
    this.form = document.querySelector('.contact-form');
    this.submitBtn = document.querySelector('.btn-submit');
    this.successMessage = document.querySelector('.form-success');
    this.errorMessage = null;
    this.loadingState = false;
    
    this.init();
  }

  init() {
    // ایجاد المان خطا
    this.createErrorElement();
    
    // اضافه کردن event listener
    if (this.form) {
      this.form.addEventListener('submit', this.handleSubmit.bind(this));
    }
    
    // بررسی وضعیت لاگین کاربر
    this.checkUserStatus();
  }

  createErrorElement() {
    this.errorMessage = document.createElement('div');
    this.errorMessage.className = 'form-error';
    this.errorMessage.style.display = 'none';
    
    if (this.form) {
      this.form.appendChild(this.errorMessage);
    }
  }

  async checkUserStatus() {
    const { accessToken } = accessTokenFinder();
    
    if (accessToken) {
      // اگر کاربر لاگین کرده، می‌تونیم اطلاعاتش رو پیش‌فرض قرار بدیم
      try {
        const response = await fetch("/api/user/profile/", {
          headers: {
            "Authorization": `Bearer ${accessToken}`
          }
        });
        
        if (response.ok) {
          const userData = await response.json();
          this.prefillForm(userData);
        }
      } catch (err) {
        console.log("Could not fetch user data");
      }
    }
  }

  prefillForm(userData) {
    if (userData && userData.user) {
      const nameInput = document.getElementById('name');
      const emailInput = document.getElementById('email');
      
      if (nameInput && userData.user.first_name && userData.user.last_name) {
        nameInput.value = `${userData.user.first_name} ${userData.user.last_name}`;
      }
      
      if (emailInput && userData.user.email) {
        emailInput.value = userData.user.email;
      }
    }
  }

  async handleSubmit(e) {
    e.preventDefault();
    
    if (this.loadingState) return;
    
    // جمع‌آوری داده‌ها
    const formData = {
      name: document.getElementById('name').value.trim(),
      email: document.getElementById('email').value.trim(),
      subject: document.getElementById('subject').value.trim(),
      message: document.getElementById('message').value.trim()
    };
    
    // نمایش حالت loading
    this.setLoadingState(true);
    this.hideMessages();
    
    // ارسال فرم
    const result = await submitContactForm(
      formData.name,
      formData.email,
      formData.subject,
      formData.message
    );
    
    // مدیریت نتیجه
    this.setLoadingState(false);
    
    if (result.error) {
      this.showError(result.msg || 'خطا در ارسال پیام');
    } else {
      this.showSuccess(result.msg);
      this.form.reset();
      
      // اسکرول به بالای فرم
      this.form.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  setLoadingState(loading) {
    this.loadingState = loading;
    
    if (this.submitBtn) {
      if (loading) {
        this.submitBtn.classList.add('loading');
        this.submitBtn.disabled = true;
        this.submitBtn.innerHTML = `
          <span>در حال ارسال...</span>
          <svg class="spinner" viewBox="0 0 50 50">
            <circle cx="25" cy="25" r="20" fill="none" stroke-width="5"></circle>
          </svg>
        `;
      } else {
        this.submitBtn.classList.remove('loading');
        this.submitBtn.disabled = false;
        this.submitBtn.textContent = 'ارسال پیام';
      }
    }
  }

  showSuccess(message) {
    if (this.successMessage) {
      this.successMessage.querySelector('p').textContent = message;
      this.successMessage.style.display = 'block';
      
      // مخفی کردن بعد از 5 ثانیه
      setTimeout(() => {
        this.hideMessages();
      }, 5000);
    }
  }

  showError(message) {
    if (this.errorMessage) {
      this.errorMessage.textContent = message;
      this.errorMessage.style.display = 'block';
      
      // مخفی کردن بعد از 5 ثانیه
      setTimeout(() => {
        this.hideMessages();
      }, 5000);
    }
  }

  hideMessages() {
    if (this.successMessage) {
      this.successMessage.style.display = 'none';
    }
    if (this.errorMessage) {
      this.errorMessage.style.display = 'none';
    }
  }
}

// ======= Initialize on DOM Load =======
document.addEventListener('DOMContentLoaded', function() {
  // ایجاد instance از ContactFormUI
  const contactForm = new ContactFormUI();
  
  // اضافه کردن validation real-time
  const inputs = document.querySelectorAll('.contact-form input, .contact-form textarea');
  inputs.forEach(input => {
    input.addEventListener('blur', function() {
      validateField(this);
    });
  });
});

// ======= Field Validation =======
function validateField(field) {
  const fieldName = field.name || field.id;
  const value = field.value.trim();
  let isValid = true;
  let errorMsg = '';
  
  // حذف کلاس‌های قبلی
  field.classList.remove('error', 'success');
  
  switch(fieldName) {
    case 'name':
      if (value.length < 3) {
        isValid = false;
        errorMsg = 'نام باید حداقل 3 کاراکتر باشد';
      }
      break;
      
    case 'email':
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        isValid = false;
        errorMsg = 'ایمیل معتبر نیست';
      }
      break;
      
    case 'subject':
      if (value.length < 5) {
        isValid = false;
        errorMsg = 'موضوع باید حداقل 5 کاراکتر باشد';
      }
      break;
      
    case 'message':
      if (value.length < 10) {
        isValid = false;
        errorMsg = 'پیام باید حداقل 10 کاراکتر باشد';
      }
      break;
  }
  
  // نمایش یا مخفی کردن پیام خطا
  let errorElement = field.parentElement.querySelector('.field-error');
  
  if (!isValid) {
    field.classList.add('error');
    
    if (!errorElement) {
      errorElement = document.createElement('span');
      errorElement.className = 'field-error';
      field.parentElement.appendChild(errorElement);
    }
    errorElement.textContent = errorMsg;
  } else {
    field.classList.add('success');
    
    if (errorElement) {
      errorElement.remove();
    }
  }
  
  return isValid;
}

// ======= Export Functions =======
export { submitContactForm, ContactFormUI };

