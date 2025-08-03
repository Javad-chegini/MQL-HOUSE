
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
}


document.addEventListener('DOMContentLoaded', function() {
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
    }
});


function logout() {
    if (confirm('آیا می‌خواهید از حساب کاربری خود خارج شوید؟')) {
        
        localStorage.removeItem('userToken');
        localStorage.removeItem('userInfo');
        window.location.href = 'index.html';

        
        
    }
}


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


function deleteDocument(id) {
    if (confirm('آیا می‌خواهید این مدرک را حذف کنید؟')) {
        const card = document.querySelector(`.document-card[data-id="${id}"]`);
        if (card) {
            card.remove();
            showNotification('مدرک با موفقیت حذف شد!', 'success');
        }

        
        
    }
}


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

    addDocumentForm.addEventListener('submit', function(e) {
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

        
        const userName = 'ali_ahmadi'; 
        const extension = file.name.split('.').pop();
        const newFileName = `${userName}_${title.replace(/\s/g, '_')}.${extension}`;
        

        
        const fileURL = URL.createObjectURL(file);

        
        const documentsList = document.querySelector('.documents-list');
        if (documentsList) {
            const newCard = document.createElement('div');
            newCard.className = 'document-card';
            newCard.dataset.id = Date.now();
            newCard.innerHTML = `
                <img src="${fileURL}" alt="${title}" class="document-image">
                <h3>${title}</h3>
                <p>${description}</p>
                <small>تاریخ صدور: ${issueDate}</small>
                <button onclick="deleteDocument('${newCard.dataset.id}')">حذف</button>
            `;
            documentsList.appendChild(newCard);
        }

        showNotification('مدرک با موفقیت اضافه شد!', 'success');
        closeAddDocumentModal();
        this.reset();
        document.getElementById('documentPreview').style.display = 'none'; 

        
        
    });
}


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

function populateProfileForm() {
    const currentUser = {
        name: 'علی',
        surname: 'احمدی',
        email: 'ali.ahmadi@example.com',
        phone: '09123456789',
        bio: 'توسعه‌دهنده فرانت‌اند'
    };
    document.getElementById('editName').value = currentUser.name || '';
    document.getElementById('editSurname').value = currentUser.surname || '';
    document.getElementById('editEmail').value = currentUser.email || '';
    document.getElementById('editPhone').value = currentUser.phone || '';
    document.getElementById('editBio').value = currentUser.bio || '';
}


function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        console.log(`مودال ${modalId} بسته شد`);
    }
}





function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        console.log(`مودال ${modalId} بسته شد`);
    }
}


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


function saveChanges(formId) {
    const form = document.getElementById(formId);
    if (form) {
        const formData = new FormData(form);

        
        console.log('ذخیره تغییرات...', Object.fromEntries(formData));

        
        showNotification('تغییرات با موفقیت ذخیره شد!', 'success');

        
        const modalId = formId.replace('Form', 'Modal');
        closeModal(modalId);

        
        
    }
}


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


document.addEventListener('DOMContentLoaded', () => {
    new UserDashboardHandler();
    
    document.documentElement.style.visibility = 'visible';
    console.log('UserDashboardHandler راه‌اندازی شد');
});


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

document.addEventListener('DOMContentLoaded', function() {
    const editProfileForm = document.getElementById('editProfileForm');
    if (editProfileForm) {
        editProfileForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveChanges('editProfileForm');
        });
    }
});


let currentPage = 1;
let notificationsPerPage = 10;
let allNotifications = [];
let filteredNotifications = [];


const sampleNotifications = [
    {
        id: 1,
        title: 'سفارش جدید دریافت شد',
        text: 'سفارش EA جدید از طرف علی احمدی دریافت شده است',
        time: '۱۰ دقیقه پیش',
        timestamp: new Date(Date.now() - 10 * 60 * 1000),
        type: 'سفارش',
        unread: true
    },
    {
        id: 2,
        title: 'پروژه تکمیل شد',
        text: 'پروژه اکسپرت ادوایزر شما آماده تحویل است',
        time: '۲ ساعت پیش',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        type: 'پروژه',
        unread: true
    },
    {
        id: 3,
        title: 'پیام جدید',
        text: 'پیام جدید در بخش پشتیبانی دریافت شده',
        time: '۱ روز پیش',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
        type: 'پیام',
        unread: false
    },
    
    {
        id: 4,
        title: 'بروزرسانی سیستم',
        text: 'سیستم مدیریت پروژه بروزرسانی شد',
        time: '۲ روز پیش',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        type: 'سیستم',
        unread: false
    },
    {
        id: 5,
        title: 'تراکنش مالی',
        text: 'مبلغ ۵۰۰ هزار تومان به حساب شما واریز شد',
        time: '۳ روز پیش',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        type: 'مالی',
        unread: false
    }
];


function openAllNotifications() {
    const modal = document.getElementById('allNotificationsModal');
    if (modal) {
        loadAllNotifications();
        modal.style.display = 'block';
        setupNotificationFilters();
        console.log('مودال همه اعلانات باز شد');
    }
}


function loadAllNotifications() {
    
    allNotifications = [...sampleNotifications];
    filteredNotifications = [...allNotifications];
    currentPage = 1;
    renderNotifications();
    
    
    
}


function renderNotifications() {
    const container = document.getElementById('allNotificationsList');
    if (!container) return;

    const startIndex = (currentPage - 1) * notificationsPerPage;
    const endIndex = startIndex + notificationsPerPage;
    const pageNotifications = filteredNotifications.slice(startIndex, endIndex);

    if (pageNotifications.length === 0) {
        container.innerHTML = `
            <div class="no-notifications">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-5 5l-5-5h5V7a3 3 0 013-3h5a3 3 0 013 3v10z"/>
                </svg>
                <h3>اعلانی موجود نیست</h3>
                <p>هیچ اعلانی برای نمایش وجود ندارد</p>
            </div>
        `;
    } else {
        container.innerHTML = pageNotifications.map(notification => `
            <div class="notification-item-full ${notification.unread ? 'unread' : ''}" data-id="${notification.id}">
                <div class="notification-header-full">
                    <h3 class="notification-title-full">${notification.title}</h3>
                    <div class="notification-meta">
                        <span class="notification-type">${notification.type}</span>
                        <span class="notification-time">${notification.time}</span>
                    </div>
                </div>
                <p class="notification-text-full">${notification.text}</p>
                <div class="notification-actions">
                    ${notification.unread ? 
                        '<button class="btn-mark-read" onclick="markAsRead(' + notification.id + ')">علامت زدن به عنوان خوانده شده</button>' : 
                        '<span style="color: #10b981; font-size: 12px;">✓ خوانده شده</span>'
                    }
                    <button class="btn-delete-notification" onclick="deleteNotification(${notification.id})">حذف</button>
                </div>
            </div>
        `).join('');
    }

    updatePagination();
}


function setupNotificationFilters() {
    const searchInput = document.getElementById('notificationSearch');
    const filterSelect = document.getElementById('notificationFilter');

    if (searchInput) {
        searchInput.addEventListener('input', filterNotifications);
    }

    if (filterSelect) {
        filterSelect.addEventListener('change', filterNotifications);
    }
}


function filterNotifications() {
    const searchTerm = document.getElementById('notificationSearch')?.value.toLowerCase() || '';
    const filterType = document.getElementById('notificationFilter')?.value || 'all';

    filteredNotifications = allNotifications.filter(notification => {
        
        const matchesSearch = notification.title.toLowerCase().includes(searchTerm) ||
                            notification.text.toLowerCase().includes(searchTerm);

        
        let matchesFilter = true;
        const now = new Date();

        switch (filterType) {
            case 'unread':
                matchesFilter = notification.unread;
                break;
            case 'read':
                matchesFilter = !notification.unread;
                break;
            case 'today':
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                matchesFilter = notification.timestamp >= today;
                break;
            case 'week':
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                matchesFilter = notification.timestamp >= weekAgo;
                break;
            case 'month':
                const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                matchesFilter = notification.timestamp >= monthAgo;
                break;
        }

        return matchesSearch && matchesFilter;
    });

    currentPage = 1;
    renderNotifications();
}


function markAsRead(notificationId) {
    const notification = allNotifications.find(n => n.id === notificationId);
    if (notification) {
        notification.unread = false;
        renderNotifications();
        updateMainNotificationBadge();
        showNotification('اعلان به عنوان خوانده شده علامت‌گذاری شد', 'success');

        
        
    }
}


function markAllAsRead() {
    if (confirm('آیا می‌خواهید همه اعلانات را به عنوان خوانده شده علامت‌گذاری کنید؟')) {
        allNotifications.forEach(notification => {
            notification.unread = false;
        });
        renderNotifications();
        updateMainNotificationBadge();
        showNotification('همه اعلانات به عنوان خوانده شده علامت‌گذاری شدند', 'success');

        
        
    }
}


function deleteNotification(notificationId) {
    if (confirm('آیا می‌خواهید این اعلان را حذف کنید؟')) {
        allNotifications = allNotifications.filter(n => n.id !== notificationId);
        filteredNotifications = filteredNotifications.filter(n => n.id !== notificationId);
        renderNotifications();
        updateMainNotificationBadge();
        showNotification('اعلان حذف شد', 'success');

        
        
    }
}


function clearAllNotifications() {
    if (confirm('آیا می‌خواهید همه اعلانات را پاک کنید؟ این عمل قابل بازگشت نیست.')) {
        allNotifications = [];
        filteredNotifications = [];
        renderNotifications();
        updateMainNotificationBadge();
        showNotification('همه اعلانات پاک شدند', 'success');

        
        
    }
}


function changePage(direction) {
    const totalPages = Math.ceil(filteredNotifications.length / notificationsPerPage);
    const newPage = currentPage + direction;

    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        renderNotifications();
    }
}


function updatePagination() {
    const totalPages = Math.ceil(filteredNotifications.length / notificationsPerPage);
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    const pageInfo = document.getElementById('pageInfo');

    if (prevBtn) prevBtn.disabled = currentPage <= 1;
    if (nextBtn) nextBtn.disabled = currentPage >= totalPages;
    if (pageInfo) pageInfo.textContent = `صفحه ${currentPage} از ${totalPages}`;
}


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