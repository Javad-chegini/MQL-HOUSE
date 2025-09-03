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

// بهبود عملکرد dropdown
document.addEventListener('DOMContentLoaded', function() {
  const selectElements = document.querySelectorAll('.form-group select');
  
  selectElements.forEach(select => {
      // اضافه کردن wrapper برای کاستوم استایل
      if (!select.parentElement.classList.contains('custom-select-wrapper')) {
          const wrapper = document.createElement('div');
          wrapper.className = 'custom-select-wrapper';
          select.parentNode.insertBefore(wrapper, select);
          wrapper.appendChild(select);
      }
      
      // تغییر رنگ بر اساس انتخاب
      select.addEventListener('change', function() {
          if (this.value === '') {
              this.style.color = 'var(--text-muted)';
          } else {
              this.style.color = 'var(--text-dark)';
          }
      });
  });
});

// فیکس مشکلات موبایل
document.addEventListener('DOMContentLoaded', function() {
  const selectElements = document.querySelectorAll('.form-group select');
  
  // تشخیص موبایل
  const isMobile = window.innerWidth <= 768;
  
  selectElements.forEach(select => {
      // در موبایل custom wrapper نداشته باشیم
      if (!isMobile && !select.parentElement.classList.contains('custom-select-wrapper')) {
          const wrapper = document.createElement('div');
          wrapper.className = 'custom-select-wrapper';
          select.parentNode.insertBefore(wrapper, select);
          wrapper.appendChild(select);
      }
      
      // فیکس رنگ placeholder
      select.addEventListener('change', function() {
          if (this.value === '') {
              this.classList.add('placeholder');
          } else {
              this.classList.remove('placeholder');
          }
      });
      
      // اولین بار چک کن
      if (select.value === '') {
          select.classList.add('placeholder');
      }
  });
  
  // فیکس resize
  window.addEventListener('resize', function() {
      const currentIsMobile = window.innerWidth <= 768;
      
      selectElements.forEach(select => {
          if (currentIsMobile) {
              // حذف wrapper در موبایل
              const wrapper = select.closest('.custom-select-wrapper');
              if (wrapper) {
                  wrapper.parentNode.insertBefore(select, wrapper);
                  wrapper.remove();
              }
          }
      });
  });
});

// فیکس مشکلات dropdown موبایل
document.addEventListener('DOMContentLoaded', function() {
  const selectElements = document.querySelectorAll('.form-group select');
  
  // تشخیص دستگاه موبایل
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  
  selectElements.forEach(select => {
      // حذف wrapper در موبایل
      
      const wrapper = select.closest('.custom-select-wrapper');
      if (wrapper && isMobile) {
          wrapper.parentNode.insertBefore(select, wrapper);
          wrapper.remove();
      }
      
      // اضافه کردن کلاس موبایل
      if (isMobile) {
          select.classList.add('mobile-select');
      }
      
      // فیکس placeholder
      function updatePlaceholder() {
          if (select.value === '' || select.value === 'انتخاب موضوع') {
              select.classList.add('placeholder');
          } else {
              select.classList.remove('placeholder');
          }
      }
      
      select.addEventListener('change', updatePlaceholder);
      updatePlaceholder();
      
      // فیکس برای iOS
      if (isIOS) {
          select.style.webkitAppearance = 'menulist';
          select.style.appearance = 'menulist';
          select.style.backgroundImage = 'none';
          select.style.paddingRight = '16px';
      }
      
      // جلوگیری از zoom در iOS
      if (isIOS) {
          select.addEventListener('focus', function() {
              this.style.fontSize = '16px';
          });
          
          select.addEventListener('blur', function() {
              this.style.fontSize = '16px';
          });
      }
  });
  
  // فیکس resize
  window.addEventListener('resize', function() {
      const currentWidth = window.innerWidth;
      
      selectElements.forEach(select => {
          if (currentWidth <= 768) {
              const wrapper = select.closest('.custom-select-wrapper');
              if (wrapper) {
                  wrapper.parentNode.insertBefore(select, wrapper);
                  wrapper.remove();
              }
              select.classList.add('mobile-select');
          } else {
              select.classList.remove('mobile-select');
          }
      });
  });
});


// Checkbox validation and interaction
document.addEventListener('DOMContentLoaded', function() {
  const checkbox = document.getElementById('privacy');
  const checkboxWrapper = checkbox.closest('.checkbox-wrapper');
  
  // Add click animation
  checkbox.addEventListener('change', function() {
      if (this.checked) {
          checkboxWrapper.classList.remove('error');
      }
  });
  
  // Validation on form submit
  const form = document.getElementById('contactForm');
  form.addEventListener('submit', function(e) {
      if (!checkbox.checked) {
          e.preventDefault();
          checkboxWrapper.classList.add('error');
          
          // Show error message
          const errorDiv = document.createElement('div');
          errorDiv.className = 'field-error';
          errorDiv.textContent = 'لطفاً قوانین حریم خصوصی را بپذیرید';
          
          // Remove existing error
          const existingError = checkboxWrapper.querySelector('.field-error');
          if (existingError) {
              existingError.remove();
          }
          
          checkboxWrapper.appendChild(errorDiv);
          
          // Remove error after 5 seconds
          setTimeout(() => {
              errorDiv.remove();
              checkboxWrapper.classList.remove('error');
          }, 5000);
      }
  });
});

// ======= Enhanced Character Counter =======
document.addEventListener('DOMContentLoaded', function() {
  const messageField = document.getElementById('message');
  const messageCounter = document.getElementById('messageCount');
  const maxLength = 1000;

  if (messageField && messageCounter) {
      function updateCounter() {
          const currentLength = messageField.value.length;
          const remaining = maxLength - currentLength;
          const counterContainer = messageCounter.parentElement;
          
          // به‌روزرسانی عدد با انیمیشن
          messageCounter.textContent = currentLength;
          
          // حذف کلاس‌های قبلی
          counterContainer.classList.remove('warning', 'danger', 'success');
          
          // اضافه کردن کلاس بر اساس تعداد
          if (remaining < 50) {
              counterContainer.classList.add('danger');
          } else if (remaining < 200) {
              counterContainer.classList.add('warning');
          } else if (currentLength > 0) {
              counterContainer.classList.add('success');
          }
          
          // انیمیشن برای تغییرات
          messageCounter.style.transform = 'scale(1.1)';
          setTimeout(() => {
              messageCounter.style.transform = 'scale(1)';
          }, 150);
      }

      // Event listeners
      messageField.addEventListener('input', updateCounter);
      messageField.addEventListener('paste', () => setTimeout(updateCounter, 10));
      messageField.addEventListener('keydown', (e) => {
          // جلوگیری از تایپ بیش از حد مجاز
          if (messageField.value.length >= maxLength && 
              !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
              e.preventDefault();
          }
      });

      // شمارش اولیه
      updateCounter();
  }
});
// اضافه کردن به انتهای فایل contact.js
console.log('Testing character counter...');

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded');
    
    const messageField = document.getElementById('message');
    const messageCounter = document.getElementById('messageCount');
    
    console.log('Message field:', messageField);
    console.log('Message counter:', messageCounter);
    
    if (messageField && messageCounter) {
        console.log('Both elements found!');
        
        function updateCounter() {
            const currentLength = messageField.value.length;
            console.log('Current length:', currentLength);
            messageCounter.textContent = currentLength;
        }
        
        messageField.addEventListener('input', function() {
            console.log('Input event triggered');
            updateCounter();
        });
        
        // تست اولیه
        updateCounter();
    } else {
        console.log('Elements not found!');
        if (!messageField) console.log('message field not found');
        if (!messageCounter) console.log('messageCount not found');
    }
});

// Map interaction effects
document.addEventListener('DOMContentLoaded', function() {
  const mapContainer = document.querySelector('.map-placeholder');
  const iframe = mapContainer.querySelector('iframe');
  
  // Add loading state initially
  mapContainer.classList.add('loading');
  
  // Remove loading state when iframe loads
  iframe.addEventListener('load', function() {
      setTimeout(() => {
          mapContainer.classList.remove('loading');
      }, 500);
  });
  
  // Add hover effects for better interaction
  mapContainer.addEventListener('mouseenter', function() {
      this.style.transform = 'scale(1.02)';
  });
  
  mapContainer.addEventListener('mouseleave', function() {
      this.style.transform = 'scale(1)';
  });
});
