
import { accessTokenFinder, saveTokens, clearTokens } from './apiHandeler.js';
async function submitContactForm(name, email, subject, message) {
  if (!name || !email || !subject || !message) {
    return { 
      error: "no_params", 
      msg: "لطفاً تمام فیلدها را پر کنید", 
      status: null 
    };
  }
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
    const { accessToken } = accessTokenFinder();
    const headers = {
      "Content-Type": "application/json",
      "Accept": "application/json"
    };
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
    this.createErrorElement();
    if (this.form) {
      this.form.addEventListener('submit', this.handleSubmit.bind(this));
    }
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
    const formData = {
      name: document.getElementById('name').value.trim(),
      email: document.getElementById('email').value.trim(),
      subject: document.getElementById('subject').value.trim(),
      message: document.getElementById('message').value.trim()
    };
    this.setLoadingState(true);
    this.hideMessages();
    const result = await submitContactForm(
      formData.name,
      formData.email,
      formData.subject,
      formData.message
    );
    this.setLoadingState(false);
    if (result.error) {
      this.showError(result.msg || 'خطا در ارسال پیام');
    } else {
      this.showSuccess(result.msg);
      this.form.reset();
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
      setTimeout(() => {
        this.hideMessages();
      }, 5000);
    }
  }
  showError(message) {
    if (this.errorMessage) {
      this.errorMessage.textContent = message;
      this.errorMessage.style.display = 'block';
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
document.addEventListener('DOMContentLoaded', function() {
  const contactForm = new ContactFormUI();
  const inputs = document.querySelectorAll('.contact-form input, .contact-form textarea');
  inputs.forEach(input => {
    input.addEventListener('blur', function() {
      validateField(this);
    });
  });
});
function validateField(field) {
  const fieldName = field.name || field.id;
  const value = field.value.trim();
  let isValid = true;
  let errorMsg = '';
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
export { submitContactForm, ContactFormUI };
document.addEventListener('DOMContentLoaded', function() {
  const selectElements = document.querySelectorAll('.form-group select');
  selectElements.forEach(select => {
      if (!select.parentElement.classList.contains('custom-select-wrapper')) {
          const wrapper = document.createElement('div');
          wrapper.className = 'custom-select-wrapper';
          select.parentNode.insertBefore(wrapper, select);
          wrapper.appendChild(select);
      }
      select.addEventListener('change', function() {
          if (this.value === '') {
              this.style.color = 'var(--text-muted)';
          } else {
              this.style.color = 'var(--text-dark)';
          }
      });
  });
});
document.addEventListener('DOMContentLoaded', function() {
  const selectElements = document.querySelectorAll('.form-group select');
  const isMobile = window.innerWidth <= 768;
  selectElements.forEach(select => {
      if (!isMobile && !select.parentElement.classList.contains('custom-select-wrapper')) {
          const wrapper = document.createElement('div');
          wrapper.className = 'custom-select-wrapper';
          select.parentNode.insertBefore(wrapper, select);
          wrapper.appendChild(select);
      }
      select.addEventListener('change', function() {
          if (this.value === '') {
              this.classList.add('placeholder');
          } else {
              this.classList.remove('placeholder');
          }
      });
      if (select.value === '') {
          select.classList.add('placeholder');
      }
  });
  window.addEventListener('resize', function() {
      const currentIsMobile = window.innerWidth <= 768;
      selectElements.forEach(select => {
          if (currentIsMobile) {
              const wrapper = select.closest('.custom-select-wrapper');
              if (wrapper) {
                  wrapper.parentNode.insertBefore(select, wrapper);
                  wrapper.remove();
              }
          }
      });
  });
});
document.addEventListener('DOMContentLoaded', function() {
  const selectElements = document.querySelectorAll('.form-group select');
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  selectElements.forEach(select => {
      const wrapper = select.closest('.custom-select-wrapper');
      if (wrapper && isMobile) {
          wrapper.parentNode.insertBefore(select, wrapper);
          wrapper.remove();
      }
      if (isMobile) {
          select.classList.add('mobile-select');
      }
      function updatePlaceholder() {
          if (select.value === '' || select.value === 'انتخاب موضوع') {
              select.classList.add('placeholder');
          } else {
              select.classList.remove('placeholder');
          }
      }
      select.addEventListener('change', updatePlaceholder);
      updatePlaceholder();
      if (isIOS) {
          select.style.webkitAppearance = 'menulist';
          select.style.appearance = 'menulist';
          select.style.backgroundImage = 'none';
          select.style.paddingRight = '16px';
      }
      if (isIOS) {
          select.addEventListener('focus', function() {
              this.style.fontSize = '16px';
          });
          select.addEventListener('blur', function() {
              this.style.fontSize = '16px';
          });
      }
  });
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
document.addEventListener('DOMContentLoaded', function() {
  const checkbox = document.getElementById('privacy');
  const checkboxWrapper = checkbox.closest('.checkbox-wrapper');
  checkbox.addEventListener('change', function() {
      if (this.checked) {
          checkboxWrapper.classList.remove('error');
      }
  });
  const form = document.getElementById('contactForm');
  form.addEventListener('submit', function(e) {
      if (!checkbox.checked) {
          e.preventDefault();
          checkboxWrapper.classList.add('error');
          const errorDiv = document.createElement('div');
          errorDiv.className = 'field-error';
          errorDiv.textContent = 'لطفاً قوانین حریم خصوصی را بپذیرید';
          const existingError = checkboxWrapper.querySelector('.field-error');
          if (existingError) {
              existingError.remove();
          }
          checkboxWrapper.appendChild(errorDiv);
          setTimeout(() => {
              errorDiv.remove();
              checkboxWrapper.classList.remove('error');
          }, 5000);
      }
  });
});
document.addEventListener('DOMContentLoaded', function() {
  const messageField = document.getElementById('message');
  const messageCounter = document.getElementById('messageCount');
  const maxLength = 1000;
  if (messageField && messageCounter) {
      function updateCounter() {
          const currentLength = messageField.value.length;
          const remaining = maxLength - currentLength;
          const counterContainer = messageCounter.parentElement;
          messageCounter.textContent = currentLength;
          counterContainer.classList.remove('warning', 'danger', 'success');
          if (remaining < 50) {
              counterContainer.classList.add('danger');
          } else if (remaining < 200) {
              counterContainer.classList.add('warning');
          } else if (currentLength > 0) {
              counterContainer.classList.add('success');
          }
          messageCounter.style.transform = 'scale(1.1)';
          setTimeout(() => {
              messageCounter.style.transform = 'scale(1)';
          }, 150);
      }
      messageField.addEventListener('input', updateCounter);
      messageField.addEventListener('paste', () => setTimeout(updateCounter, 10));
      messageField.addEventListener('keydown', (e) => {
          if (messageField.value.length >= maxLength && 
              !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
              e.preventDefault();
          }
      });
      updateCounter();
  }
});
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
        updateCounter();
    } else {
        console.log('Elements not found!');
        if (!messageField) console.log('message field not found');
        if (!messageCounter) console.log('messageCount not found');
    }
});
document.addEventListener('DOMContentLoaded', function() {
  const mapContainer = document.querySelector('.map-placeholder');
  const iframe = mapContainer.querySelector('iframe');
  mapContainer.classList.add('loading');
  iframe.addEventListener('load', function() {
      setTimeout(() => {
          mapContainer.classList.remove('loading');
      }, 500);
  });
  mapContainer.addEventListener('mouseenter', function() {
      this.style.transform = 'scale(1.02)';
  });
  mapContainer.addEventListener('mouseleave', function() {
      this.style.transform = 'scale(1)';
  });
});