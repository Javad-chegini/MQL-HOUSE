// ======= تابع تغییر تم =======
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
}

// ======= بارگذاری تم در ابتدا =======
document.addEventListener('DOMContentLoaded', function() {
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
    }
});

// ======= تابع خروج با استفاده از API =======
function logout() {
    if (confirm('آیا می‌خواهید از حساب کاربری خود خارج شوید؟')) {
        // پاک کردن توکن‌ها با استفاده از تابع apiHandler
        clearTokens();
        
        // پاک کردن اطلاعات کاربر
        localStorage.removeItem('userInfo');
        localStorage.removeItem('userDocuments');
        
        // ریدایرکت به صفحه اصلی
        window.location.href = 'index.html';
    }
}

// ======= مدیریت لینک‌های سایدبار =======
document.querySelectorAll('.sidebar-link').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();

        document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
        this.classList.add('active');

        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });

        const targetId = this.getAttribute('href').substring(1);
        const targetSection = document.getElementById(targetId);
        if (targetSection) {
            targetSection.classList.add('active');
        }
    });
});

// ======= مدیریت مودال افزودن مدرک =======
function showAddDocumentModal() {
    const modal = document.getElementById('addDocumentModal');
    if (modal) {
        modal.classList.add('show');
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        console.log('مودال افزودن مدرک باز شد');
    }
}

function closeAddDocumentModal() {
    const modal = document.getElementById('addDocumentModal');
    if (modal) {
        modal.classList.remove('show');
        modal.style.display = 'none';
        document.body.style.overflow = '';
        console.log('مودال افزودن مدرک بسته شد');
    }
}

// ======= بستن مودال با کلیک بیرون =======
window.onclick = function(event) {
    const modal = document.getElementById('addDocumentModal');
    if (event.target === modal && modal.classList.contains('show')) {
        closeAddDocumentModal();
    }

    const editModal = document.getElementById('editProfileModal');
    if (event.target == editModal) {
        editModal.style.display = 'none';
    }
}

// ======= حذف مدرک =======
function deleteDocument(id) {
    if (confirm('آیا می‌خواهید این مدرک را حذف کنید؟')) {
        const card = document.querySelector(`.document-card[data-id="${id}"]`);
        if (card) {
            card.remove();
            
            // حذف از localStorage
            const documents = JSON.parse(localStorage.getItem('userDocuments') || '[]');
            const updatedDocs = documents.filter(doc => doc.id !== parseInt(id));
            localStorage.setItem('userDocuments', JSON.stringify(updatedDocs));
            
            showNotification('مدرک با موفقیت حذف شد!', 'success');
        }
    }
}

// ======= مدیریت فرم افزودن مدرک =======
const addDocumentForm = document.querySelector('.add-document-form');
if (addDocumentForm) {
    const fileInput = document.querySelector('input[name="file"]');
    if (fileInput) {
        fileInput.addEventListener('change', function(event) {
            const file = event.target.files[0];
            if (file) {
                const preview = document.getElementById('documentPreview');
                if (preview) {
                    preview.src = URL.createObjectURL(file);
                    preview.style.display = 'block';
                }
            }
        });
    }

    addDocumentForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const formData = new FormData(this);
        const title = formData.get('title');
        const description = formData.get('description');
        const issueDate = formData.get('issueDate');
        const file = formData.get('file');

        if (!file) {
            showNotification('لطفاً یک فایل انتخاب کنید.', 'error');
            return;
        }

        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
        const maxSize = 5 * 1024 * 1024;

        if (!allowedTypes.includes(file.type)) {
            showNotification('لطفاً فقط فایل‌های JPG, PNG, JPEG یا PDF انتخاب کنید.', 'error');
            return;
        }

        if (file.size > maxSize) {
            showNotification('حجم فایل نباید بیشتر از ۵ مگابایت باشد.', 'error');
            return;
        }

        // ذخیره مدرک در localStorage (تا زمانی که API endpoint اضافه شود)
        const fileURL = URL.createObjectURL(file);
        const newDocument = {
            id: Date.now(),
            title: title,
            description: description,
            issueDate: issueDate,
            fileUrl: fileURL,
            fileName: file.name,
            uploadDate: new Date().toISOString()
        };

        // ذخیره در localStorage
        const documents = JSON.parse(localStorage.getItem('userDocuments') || '[]');
        documents.push(newDocument);
        localStorage.setItem('userDocuments', JSON.stringify(documents));

        // اضافه کردن به DOM
        const documentsList = document.querySelector('.documents-list');
        if (documentsList) {
            const newCard = document.createElement('div');
            newCard.className = 'document-card';
            newCard.dataset.id = newDocument.id;
            newCard.innerHTML = `
                <img src="${fileURL}" alt="${title}" class="document-image">
                <h3>${title}</h3>
                <p>${description}</p>
                <small>تاریخ صدور: ${issueDate}</small>
                <button onclick="deleteDocument('${newDocument.id}')">حذف</button>
            `;
            documentsList.appendChild(newCard);
        }

        showNotification('مدرک با موفقیت اضافه شد!', 'success');
        closeAddDocumentModal();
        this.reset();
        document.getElementById('documentPreview').style.display = 'none';
    });
}

// ======= ویرایش پروفایل =======
function editProfile() {
    const editModal = document.getElementById('editProfileModal');
    if (editModal) {
        populateProfileForm();
        editModal.style.display = 'block';
        console.log('مودال ویرایش پروفایل باز شد');
    } else {
        console.error('مودال ویرایش پروفایل پیدا نشد');
        showNotification('خطا در باز کردن فرم ویرایش', 'error');
    }
}

// ======= پر کردن فرم پروفایل با اطلاعات API =======
async function populateProfileForm() {
    try {
        // دریافت اطلاعات از localStorage یا API
        const storedUser = localStorage.getItem('userInfo');
        let user = storedUser ? JSON.parse(storedUser) : null;
        
        // اگر اطلاعات کاربر در localStorage نبود، از API دریافت کن
        if (!user) {
            const loginResult = await login();
            
            if (loginResult.error) {
                showNotification('خطا در دریافت اطلاعات کاربر', 'error');
                if (loginResult.error === 'no_authenticated' || loginResult.error === 'jwt_invalid') {
                    clearTokens();
                    window.location.href = 'index.html';
                }
                return;
            }
            
            user = loginResult.user;
            if (user) {
                localStorage.setItem('userInfo', JSON.stringify(user));
            }
        }
        
        // پر کردن فرم با اطلاعات کاربر
        if (user) {
            document.getElementById('editName').value = user.first_name || '';
            document.getElementById('editSurname').value = user.last_name || '';
            document.getElementById('editEmail').value = user.email || '';
            document.getElementById('editPhone').value = user.phone_number || '';
            document.getElementById('editBio').value = user.bio || '';
            
            updateProfileDisplay(user);
        }
        
    } catch (error) {
        console.error('خطا در دریافت اطلاعات پروفایل:', error);
        showNotification('خطا در ارتباط با سرور', 'error');
    }
}

// ======= بروزرسانی نمایش پروفایل =======
function updateProfileDisplay(user) {
    // بروزرسانی نام در هدر
    const userNameElement = document.querySelector('.user-info h3');
    if (userNameElement && user) {
        userNameElement.textContent = `${user.first_name || ''} ${user.last_name || ''}`;
    }
    
    // بروزرسانی تخصص
    const userRoleElement = document.querySelector('.user-info p');
    if (userRoleElement && user) {
        userRoleElement.textContent = user.user_type || 'کاربر';
    }
    
    // بروزرسانی اطلاعات در بخش پروفایل
    const profileFields = {
        'profile-name': user.first_name,
        'profile-surname': user.last_name,
        'profile-email': user.email,
        'profile-phone': user.phone_number,
        'profile-specialty': user.user_type || 'کاربر'
    };
    
    for (const [id, value] of Object.entries(profileFields)) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value || '-';
        }
    }
}

// ======= بستن مودال =======
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        console.log(`مودال ${modalId} بسته شد`);
    }
}

// ======= کلاس مدیریت داشبورد =======
class UserDashboardHandler {
    constructor() {
        this.header = document.getElementById('header');
        this.hamburger = document.getElementById('hamburger');
        this.mobileMenu = document.getElementById('mobileMenu');
        this.navLinks = document.querySelectorAll('.nav-link[data-nav]');
        this.themeToggle = document.getElementById('themeToggle');
        this.mobileThemeToggle = document.getElementById('mobileThemeToggle');

        this.init();
    }

    init() {
        this.initNavigation();
        this.initMobileMenu();
        this.initThemeToggle();
        this.initNotifications();
    }

    initNavigation() {
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                const isHash = href.startsWith('#');
                const section = document.querySelector(href);

                if (isHash && section) {
                    e.preventDefault();
                    this.navLinks.forEach(l => l.classList.remove('active'));
                    link.classList.add('active');
                    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });
    }

    initMobileMenu() {
        if (this.hamburger && this.mobileMenu) {
            this.hamburger.addEventListener('click', (e) => {
                e.stopPropagation();
                const isActive = this.hamburger.classList.toggle('active');
                this.mobileMenu.classList.toggle('active');
                document.body.style.overflow = isActive ? 'hidden' : '';
                console.log('منوی موبایل:', isActive ? 'باز شد' : 'بسته شد');
            });

            this.mobileMenu.querySelectorAll('.nav-link').forEach(link => {
                link.addEventListener('click', () => {
                    this.hamburger.classList.remove('active');
                    this.mobileMenu.classList.remove('active');
                    document.body.style.overflow = '';
                });
            });

            document.addEventListener('click', (e) => {
                if (!this.hamburger.contains(e.target) &&
                    !this.mobileMenu.contains(e.target) &&
                    this.mobileMenu.classList.contains('active')) {
                    this.hamburger.classList.remove('active');
                    this.mobileMenu.classList.remove('active');
                    document.body.style.overflow = '';
                }
            });
        } else {
            console.warn('المنت‌های منوی موبایل پیدا نشدند');
        }
    }

    initThemeToggle() {
        const saved = localStorage.getItem('theme');
        if (saved === 'dark') {
            document.body.classList.add('dark-mode');
            this.updateThemeIcon(true);
        }

        const toggle = () => {
            const isDark = document.body.classList.toggle('dark-mode');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            this.updateThemeIcon(isDark);
        };

        if (this.themeToggle) {
            this.themeToggle.addEventListener('click', toggle);
        }
        if (this.mobileThemeToggle) {
            this.mobileThemeToggle.addEventListener('click', toggle);
        }
    }

    updateThemeIcon(isDark) {
        const icons = [];
        if (this.themeToggle) icons.push(this.themeToggle.querySelector('svg'));
        if (this.mobileThemeToggle) icons.push(this.mobileThemeToggle.querySelector('svg'));

        icons.forEach(icon => {
            if (icon) {
                icon.setAttribute('viewBox', '0 0 24 24');
                icon.setAttribute('fill', 'none');
                icon.setAttribute('stroke', 'currentColor');
                icon.setAttribute('stroke-width', '2');
                icon.setAttribute('stroke-linecap', 'round');
                icon.setAttribute('stroke-linejoin', 'round');
                if (isDark) {
                    icon.innerHTML = `
                        <circle cx="12" cy="12" r="4"></circle>
                        <path d="M12 2v2"></path>
                        <path d="M12 20v2"></path>
                        <path d="m4.93 4.93 1.41 1.41"></path>
                        <path d="m17.66 17.66 1.41 1.41"></path>
                        <path d="M2 12h2"></path>
                        <path d="M20 12h2"></path>
                        <path d="m6.34 17.66-1.41 1.41"></path>
                        <path d="m19.07 4.93-1.41 1.41"></path>
                    `;
                } else {
                    icon.innerHTML = `
                        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
                    `;
                }
            }
        });
    }

    initNotifications() {
        const notificationsBtn = document.getElementById('notificationsBtn');
        const notificationsDropdown = document.getElementById('notificationsDropdown');
        const notificationBadge = document.getElementById('notificationBadge');

        if (notificationsBtn && notificationsDropdown) {
            notificationsBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const isShowing = notificationsDropdown.classList.contains('show');
                notificationsDropdown.classList.toggle('show');
                console.log('نوتیفیکیشن:', !isShowing ? 'باز شد' : 'بسته شد');
            });

            document.addEventListener('click', (e) => {
                if (!notificationsBtn.contains(e.target) &&
                    !notificationsDropdown.contains(e.target)) {
                    notificationsDropdown.classList.remove('show');
                }
            });

            const notificationItems = document.querySelectorAll('.notification-item');
            notificationItems.forEach(item => {
                item.addEventListener('click', () => {
                    item.classList.remove('unread');
                    this.updateBadgeCount();
                });
            });

            this.updateBadgeCount();

        } else {
            console.warn('المنت‌های نوتیفیکیشن پیدا نشدند');
        }

        const mobileNotificationsBtn = document.getElementById('mobileNotificationsBtn');
        if (mobileNotificationsBtn) {
            mobileNotificationsBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                notificationsDropdown.classList.toggle('show');
            });
        }
    }

    updateBadgeCount() {
        const notificationBadge = document.getElementById('notificationBadge');
        if (notificationBadge) {
            const unreadCount = document.querySelectorAll('.notification-item.unread').length;
            if (unreadCount > 0) {
                notificationBadge.textContent = unreadCount;
                notificationBadge.classList.remove('hidden');
            } else {
                notificationBadge.classList.add('hidden');
            }
        }
    }
}

// ======= مدیریت آپلود فایل =======
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        if (allowedTypes.includes(file.type)) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const preview = document.getElementById('imagePreview');
                if (preview) {
                    preview.src = e.target.result;
                    preview.style.display = 'block';
                }
            };
            reader.readAsDataURL(file);
            showNotification('تصویر بارگذاری شد', 'success');
        } else {
            showNotification('لطفاً فقط فایل‌های تصویری (JPG, PNG) انتخاب کنید.', 'error');
        }
    }
}

// ======= ذخیره تغییرات با API =======
async function saveChanges(formId) {
    const form = document.getElementById(formId);
    if (!form) return;
    
    try {
        const formData = new FormData(form);
        
        if (formId === 'editProfileForm') {
            // بروزرسانی اطلاعات کاربر
            const updatedUser = {
                first_name: formData.get('name'),
                last_name: formData.get('surname'),
                email: formData.get('email'),
                phone_number: formData.get('phone'),
                bio: formData.get('bio')
            };
            
            // ذخیره در localStorage
            const currentUser = JSON.parse(localStorage.getItem('userInfo') || '{}');
            const mergedUser = { ...currentUser, ...updatedUser };
            localStorage.setItem('userInfo', JSON.stringify(mergedUser));
            
            // بروزرسانی نمایش
            updateProfileDisplay(mergedUser);
            
            showNotification('تغییرات با موفقیت ذخیره شد!', 'success');
            closeModal('editProfileModal');
            
            // TODO: ارسال به API وقتی endpoint آماده شد
            // const result = await updateProfile(updatedUser);
        }
        
    } catch (error) {
        console.error('خطا در ذخیره تغییرات:', error);
        showNotification('خطا در ذخیره تغییرات', 'error');
    }
}

// ======= نمایش نوتیفیکیشن =======
function showNotification(message, type = 'info') {
    const existingNotifications = document.querySelectorAll('.custom-notification');
    existingNotifications.forEach(notif => notif.remove());

    const notification = document.createElement('div');
    notification.className = `custom-notification notification-${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()" style="background: none; border: none; color: inherit; margin-right: 10px; cursor: pointer; font-size: 18px;">&times;</button>
    `;

    notification.style.cssText = `
        position: fixed;
        top: 100px;
        left: 50%;
        transform: translateX(-50%);
        background: ${type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        font-family: 'Vazirmatn', sans-serif;
        font-weight: 500;
        display: flex;
        align-items: center;
        animation: slideDown 0.3s ease;
        max-width: 90%;
        min-width: 200px;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 4000);

    console.log(`نوتیفیکیشن نمایش داده شد: ${message} (نوع: ${type})`);
}

// ======= اضافه کردن استایل انیمیشن =======
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from {
            transform: translateX(-50%) translateY(-100%);
            opacity: 0;
        }
        to {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);

// ======= مدیریت دکمه‌های ویرایش =======
document.addEventListener('DOMContentLoaded', function() {
    const editButtons = document.querySelectorAll('.btn-edit, [onclick="editProfile()"]');
    editButtons.forEach(btn => {
        btn.removeAttribute('onclick');
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('دکمه ویرایش کلیک شد');
            editProfile();
        });
    });
    console.log(`${editButtons.length} دکمه ویرایش پیدا شد`);
});

// ======= مدیریت فرم ویرایش پروفایل =======
document.addEventListener('DOMContentLoaded', function() {
    const editProfileForm = document.getElementById('editProfileForm');
    if (editProfileForm) {
        editProfileForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveChanges('editProfileForm');
        });
    }
});

// ======= متغیرهای نوتیفیکیشن =======
let currentPage = 1;
let notificationsPerPage = 10;
let allNotifications = [];
let filteredNotifications = [];

// ======= مدیریت صفحه‌بندی نوتیفیکیشن =======
function changePage(direction) {
    const totalPages = Math.ceil(filteredNotifications.length / notificationsPerPage);
    
    if (direction === 'next' && currentPage < totalPages) {
        currentPage++;
    } else if (direction === 'prev' && currentPage > 1) {
        currentPage--;
    }
    
    displayNotifications();
    updatePagination();
}

// ======= نمایش نوتیفیکیشن‌ها =======
function displayNotifications() {
    const start = (currentPage - 1) * notificationsPerPage;
    const end = start + notificationsPerPage;
    const pageNotifications = filteredNotifications.slice(start, end);
    
    const notificationsList = document.getElementById('allNotificationsList');
    if (!notificationsList) return;
    
    notificationsList.innerHTML = pageNotifications.map(notification => `
        <div class="notification-item ${notification.unread ? 'unread' : ''}" data-id="${notification.id}">
            <div class="notification-content">
                <h4>${notification.title}</h4>
                <p>${notification.text}</p>
                <small>${notification.time}</small>
            </div>
            <div class="notification-actions">
                ${notification.unread ? 
                    `<button onclick="markAsRead(${notification.id})" class="btn-sm">خوانده شد</button>` : 
                    ''
                }
                <button onclick="deleteNotification(${notification.id})" class="btn-sm btn-danger">حذف</button>
            </div>
        </div>
    `).join('');
}

// ======= بروزرسانی صفحه‌بندی =======
function updatePagination() {
    const totalPages = Math.ceil(filteredNotifications.length / notificationsPerPage);
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    const pageInfo = document.getElementById('pageInfo');

    if (prevBtn) prevBtn.disabled = currentPage <= 1;
    if (nextBtn) nextBtn.disabled = currentPage >= totalPages;
    if (pageInfo) pageInfo.textContent = `صفحه ${currentPage} از ${totalPages}`;
}

// ======= بروزرسانی badge نوتیفیکیشن =======
function updateMainNotificationBadge() {
    const badge = document.getElementById('notificationBadge');
    if (badge) {
        const unreadCount = allNotifications.filter(n => n.unread).length;
        if (unreadCount > 0) {
            badge.textContent = unreadCount;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }
}

// ======= باز کردن مودال همه نوتیفیکیشن‌ها =======
function openAllNotifications() {
    const modal = document.getElementById('allNotificationsModal');
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        // بارگذاری نوتیفیکیشن‌ها از localStorage یا API
        loadNotifications();
        displayNotifications();
        updatePagination();
    }
}

// ======= بارگذاری نوتیفیکیشن‌ها =======
function loadNotifications() {
    // فعلاً از داده‌های نمونه استفاده می‌کنیم
    // TODO: از API دریافت شود
    allNotifications = [
        {
            id: 1,
            title: 'سفارش جدید دریافت شد',
            text: 'یک سفارش EA جدید از طرف علی احمدی دریافت شد',
            time: '10 دقیقه پیش',
            timestamp: new Date(),
            type: 'سفارش',
            unread: true
        },
        {
            id: 2,
            title: 'پروژه تکمیل شد',
            text: 'Expert Advisor شما آماده تحویل است',
            time: '2 ساعت پیش',
            timestamp: new Date(),
            type: 'پروژه',
            unread: true
        },
        {
            id: 3,
            title: 'پیام جدید',
            text: 'یک پیام جدید از بخش پشتیبانی دارید',
            time: '1 روز پیش',
            timestamp: new Date(),
            type: 'پیام',
            unread: false
        }
    ];
    
    filteredNotifications = [...allNotifications];
}

// ======= اضافه کردن نوتیفیکیشن جدید =======
function addNewNotification(notification) {
    const newNotif = {
        id: Date.now(),
        title: notification.title,
        text: notification.text,
        time: 'همین الان',
        timestamp: notification.timestamp || new Date(),
        type: notification.type || 'سیستم',
        unread: true
    };
    
    allNotifications.unshift(newNotif);
    filteredNotifications = [...allNotifications];
    
    updateMainNotificationBadge();
    
    const dropdown = document.getElementById('notificationsDropdown');
    if (dropdown && dropdown.classList.contains('show')) {
        renderNotificationDropdown();
    }
}

// ======= مدیریت لینک مشاهده همه نوتیفیکیشن‌ها =======
document.addEventListener('DOMContentLoaded', function() {
    const viewAllLink = document.querySelector('.view-all-notifications');
    if (viewAllLink) {
        viewAllLink.addEventListener('click', function(e) {
            e.preventDefault();
            openAllNotifications();

            const dropdown = document.getElementById('notificationsDropdown');
            if (dropdown) {
                dropdown.classList.remove('show');
            }
        });
    }
});

// ======= بررسی احراز هویت و بارگذاری اولیه =======
document.addEventListener('DOMContentLoaded', async function() {
    // بررسی وجود توکن
    const { accessToken, error } = accessTokenFinder();
    
    if (error === 'no_authenticated' || !accessToken) {
        // اگر کاربر در صفحه داشبورد است و لاگین نیست
        if (window.location.pathname.includes('dashboard') || 
            window.location.pathname.includes('user-panel')) {
            showNotification('لطفاً ابتدا وارد حساب کاربری خود شوید', 'error');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
            return;
        }
    } else {
        // اگر توکن دارد، بررسی اعتبار آن
        try {
            const loginResult = await login();
            
            if (loginResult.error) {
                if (loginResult.error === 'jwt_invalid') {
                    showNotification('نشست شما منقضی شده است. لطفاً دوباره وارد شوید', 'error');
                    clearTokens();
                    localStorage.removeItem('userInfo');
                    
                    if (window.location.pathname.includes('dashboard') || 
                        window.location.pathname.includes('user-panel')) {
                        setTimeout(() => {
                            window.location.href = 'index.html';
                        }, 2000);
                        return;
                    }
                }
            } else if (loginResult.user) {
                // ذخیره و نمایش اطلاعات کاربر
                localStorage.setItem('userInfo', JSON.stringify(loginResult.user));
                updateProfileDisplay(loginResult.user);
                
                // بارگذاری مدارک از localStorage
                const savedDocuments = JSON.parse(localStorage.getItem('userDocuments') || '[]');
                const documentsList = document.querySelector('.documents-list');
                if (documentsList && savedDocuments.length > 0) {
                    savedDocuments.forEach(doc => {
                        const card = document.createElement('div');
                        card.className = 'document-card';
                        card.dataset.id = doc.id;
                        card.innerHTML = `
                            <img src="${doc.fileUrl}" alt="${doc.title}" class="document-image">
                            <h3>${doc.title}</h3>
                            <p>${doc.description}</p>
                            <small>تاریخ صدور: ${doc.issueDate}</small>
                            <button onclick="deleteDocument('${doc.id}')">حذف</button>
                        `;
                        documentsList.appendChild(card);
                    });
                }
            }
        } catch (error) {
            console.error('خطا در بررسی احراز هویت:', error);
        }
    }
    
    // ادامه بارگذاری صفحه
    new UserDashboardHandler();
    document.documentElement.style.visibility = 'visible';
    console.log('صفحه بارگذاری شد');
});

// ======= تابع ثبت سفارش جدید =======
async function submitNewOrder(title, description, toolsDescription) {
    try {
        showNotification('در حال ارسال سفارش...', 'info');
        
        const result = await subOrder(title, description, toolsDescription);
        
        if (result.error) {
            if (result.error === 'no_authenticated') {
                showNotification('لطفاً ابتدا وارد حساب کاربری خود شوید', 'error');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
                return;
            }
            showNotification('خطا در ثبت سفارش: ' + (result.msg || result.error), 'error');
            return;
        }
        
        showNotification('سفارش شما با موفقیت ثبت شد!', 'success');
        
        // اضافه کردن نوتیفیکیشن
        if (result.order) {
            addNewNotification({
                title: 'سفارش جدید ثبت شد',
                text: `سفارش "${title}" با موفقیت ثبت شد`,
                type: 'سفارش',
                timestamp: new Date()
            });
        }
        
        return result.order;
        
    } catch (error) {
        console.error('خطا در ثبت سفارش:', error);
        showNotification('خطا در ارتباط با سرور', 'error');
    }
}
