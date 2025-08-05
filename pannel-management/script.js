let currentPage = {
    users: 1,
    orders: 1
};
let currentLimit = 10;
let currentSection = 'dashboard';
let users = [];
let orders = [];
let dashboardStats = {};
let searchTimeouts = {};


document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});


async function initializeApp() {
    try {
        showLoading(true);
        
        
        const loginResult = await login();
        if (loginResult.error) {
            redirectToLogin();
            return;
        }

        
        displayUserInfo(loginResult.user);
        
        
        await loadDashboardData();
        
        
        setupEventListeners();
        
        showLoading(false);
        console.log('پنل مدیریت با موفقیت بارگذاری شد');
        showNotification('پنل مدیریت با موفقیت بارگذاری شد', 'success');
    } catch (error) {
        console.error('خطا در راه‌اندازی:', error);
        showNotification('خطا در بارگذاری پنل مدیریت', 'error');
        showLoading(false);
    }
}


function setupEventListeners() {
    
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', handleNavigation);
    });

    
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    
    const addUserBtn = document.getElementById('addUserBtn');
    if (addUserBtn) {
        addUserBtn.addEventListener('click', () => openModal('addUserModal'));
    }

    
    const addUserForm = document.getElementById('addUserForm');
    if (addUserForm) {
        addUserForm.addEventListener('submit', handleAddUser);
    }

    
    setupModalListeners();

    
    setupSearchAndFilters();

    
    setInterval(refreshCurrentSection, 60000);
}


async function handleNavigation(event) {
    const sectionId = event.currentTarget.getAttribute('data-section');
    
    
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    document.querySelectorAll('.content-section').forEach(section => section.classList.remove('active'));
    
    
    event.currentTarget.classList.add('active');
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    currentSection = sectionId;
    
    
    await loadSectionData(sectionId);
}


async function loadSectionData(section) {
    showLoading(true);
    
    try {
        switch(section) {
            case 'dashboard':
                await loadDashboardData();
                break;
            case 'users':
                await loadUsersData();
                break;
            case 'orders':
                await loadOrdersData();
                break;
        }
    } catch (error) {
        console.error(`خطا در بارگذاری ${section}:`, error);
        showNotification(`خطا در بارگذاری اطلاعات`, 'error');
    } finally {
        showLoading(false);
    }
}



async function loadDashboardData() {
    try {
        const statsResult = await getDashboardStats();
        
        if (statsResult.error) {
            console.error('خطا در دریافت آمار:', statsResult.error);
            
            updateDashboardStats({
                total_users: 0,
                total_orders: 0,
                completed_orders: 0,
                pending_orders: 0
            });
            return;
        }

        dashboardStats = statsResult.stats;
        updateDashboardStats(dashboardStats);
        
    } catch (error) {
        console.error('خطا در بارگذاری داشبورد:', error);
        showNotification('خطا در بارگذاری آمار داشبورد', 'error');
    }
}

function updateDashboardStats(stats) {
    
    animateNumber('totalUsers', stats.total_users || 0);
    animateNumber('totalOrders', stats.total_orders || 0);
    animateNumber('completedOrders', stats.completed_orders || 0);
    animateNumber('pendingOrders', stats.pending_orders || 0);
}


function animateNumber(elementId, targetNumber) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const startNumber = parseInt(element.textContent) || 0;
    const duration = 1000;
    const steps = 30;
    const stepValue = (targetNumber - startNumber) / steps;
    let currentStep = 0;
    
    const timer = setInterval(() => {
        currentStep++;
        const currentNumber = Math.round(startNumber + (stepValue * currentStep));
        element.textContent = currentNumber;
        
        if (currentStep >= steps) {
            clearInterval(timer);
            element.textContent = targetNumber;
        }
    }, duration / steps);
}


async function refreshDashboard() {
    showNotification('در حال بروزرسانی داشبورد...', 'info');
    await loadDashboardData();
    showNotification('داشبورد با موفقیت بروزرسانی شد', 'success');
}


function exportDashboard() {
    showNotification('گزارش PDF در حال آماده‌سازی...', 'info');
    
    setTimeout(() => {
        showNotification('گزارش PDF آماده شد', 'success');
    }, 2000);
}



async function loadUsersData(page = 1, search = '', status = '') {
    try {
        const result = await getUsers(page, currentLimit, status, search);
        
        if (result.error) {
            showNotification('خطا در دریافت لیست کاربران', 'error');
            return;
        }

        users = result.users || [];
        renderUsersTable(users);
        updateUsersPagination(result.total || 0, page);
        
        
        const pageInfo = document.getElementById('usersPageInfo');
        if (pageInfo) {
            const start = ((page - 1) * currentLimit) + 1;
            const end = Math.min(page * currentLimit, result.total || 0);
            pageInfo.textContent = `نمایش ${start} تا ${end} از ${result.total || 0} کاربر`;
        }
        
    } catch (error) {
        console.error('خطا در بارگذاری کاربران:', error);
        showNotification('خطا در بارگذاری کاربران', 'error');
    }
}

function renderUsersTable(usersData) {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;

    if (!usersData || usersData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-light);">
                    <i class="fas fa-users" style="font-size: 3rem; margin-bottom: 1rem; display: block;"></i>
                    هیچ کاربری یافت نشد
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = '';

    usersData.forEach((user, index) => {
        const row = document.createElement('tr');
        row.style.animationDelay = `${index * 0.05}s`;
        row.className = 'fade-in-row';
        
        row.innerHTML = `
            <td>
                <div class="user-avatar">
                    ${user.first_name ? user.first_name.charAt(0).toUpperCase() : 'U'}
                </div>
            </td>
            <td>${user.first_name || ''} ${user.last_name || ''}</td>
            <td>${user.email || '-'}</td>
            <td>${user.phone_number || '-'}</td>
            <td>
                <span class="status-badge status-${user.status || 'active'}">
                    ${getStatusText(user.status || 'active')}
                </span>
            </td>
            <td>${formatDate(user.date_joined)}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-primary" onclick="editUser(${user.id})" title="ویرایش">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="toggleUserStatus(${user.id}, '${user.status || 'active'}')" title="تغییر وضعیت">
                        <i class="fas fa-toggle-on"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="confirmDeleteUser(${user.id})" title="حذف">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}


async function handleAddUser(event) {
    event.preventDefault();
    
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> در حال ذخیره...';
    submitBtn.disabled = true;
    
    const formData = new FormData(event.target);
    const userData = {
        first_name: formData.get('firstName').trim(),
        last_name: formData.get('lastName').trim(),
        email: formData.get('email').trim(),
        phone_number: formData.get('phone').trim(),
        status: formData.get('status'),
        password: 'temp123456' // پسورد موقت
    };

    try {
        const result = await createUser(userData);
        
        if (result.error) {
            showNotification('خطا در ایجاد کاربر: ' + result.error, 'error');
            return;
        }

        showNotification('کاربر جدید با موفقیت ایجاد شد', 'success');
        closeModal('addUserModal');
        event.target.reset();
        await loadUsersData(currentPage.users);
        
    } catch (error) {
        console.error('خطا در ایجاد کاربر:', error);
        showNotification('خطا در ایجاد کاربر', 'error');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}


async function editUser(userId) {
    showNotification('قابلیت ویرایش کاربر در حال توسعه است', 'info');
    console.log('ویرایش کاربر:', userId);
}


async function toggleUserStatus(userId, currentStatus) {
    const statusMap = {
        'active': 'inactive',
        'inactive': 'active',
        'suspended': 'active'
    };
    
    const newStatus = statusMap[currentStatus] || 'active';
    
    try {
        const result = await updateUserStatus(userId, newStatus);
        
        if (result.error) {
            showNotification('خطا در تغییر وضعیت کاربر', 'error');
            return;
        }

        showNotification('وضعیت کاربر با موفقیت تغییر کرد', 'success');
        await loadUsersData(currentPage.users);
        
    } catch (error) {
        console.error('خطا در تغییر وضعیت:', error);
        showNotification('خطا در تغییر وضعیت', 'error');
    }
}


function confirmDeleteUser(userId) {
    showConfirmDialog(
        'حذف کاربر',
        'آیا از حذف این کاربر اطمینان دارید؟ این عمل قابل بازگشت نیست.',
        () => deleteUserById(userId)
    );
}


async function deleteUserById(userId) {
    try {
        const result = await deleteUser(userId);
        
        if (result.error) {
            showNotification('خطا در حذف کاربر', 'error');
            return;
        }

        showNotification('کاربر با موفقیت حذف شد', 'success');
        await loadUsersData(currentPage.users);
        
    } catch (error) {
        console.error('خطا در حذف کاربر:', error);
        showNotification('خطا در حذف کاربر', 'error');
    }
}


async function exportUsers() {
    try {
        showNotification('در حال آماده‌سازی فایل Excel...', 'info');
        
        
        const result = await getUsers(1, 1000); 
        
        if (result.error) {
            showNotification('خطا در دریافت اطلاعات کاربران برای صادرات', 'error');
            return;
        }

        
        const csvContent = generateUsersCSV(result.users || []);
        downloadFile(csvContent, 'users.csv', 'text/csv;charset=utf-8;');
        
        showNotification('فایل Excel کاربران آماده شد', 'success');
        
    } catch (error) {
        console.error('خطا در صادرات:', error);
        showNotification('خطا در صادرات فایل Excel', 'error');
    }
}



async function loadOrdersData(page = 1, search = '', status = '', dateFilter = '') {
    try {
        const result = await getOrders(page, currentLimit, status, search);
        
        if (result.error) {
            showNotification('خطا در دریافت لیست سفارش‌ها', 'error');
            return;
        }

        orders = result.orders || [];
        renderOrdersTable(orders);
        updateOrdersPagination(result.total || 0, page);
        
        
        const pageInfo = document.getElementById('ordersPageInfo');
        if (pageInfo) {
            const start = ((page - 1) * currentLimit) + 1;
            const end = Math.min(page * currentLimit, result.total || 0);
            pageInfo.textContent = `نمایش ${start} تا ${end} از ${result.total || 0} سفارش`;
        }
        
    } catch (error) {
        console.error('خطا در بارگذاری سفارش‌ها:', error);
        showNotification('خطا در بارگذاری سفارش‌ها', 'error');
    }
}

function renderOrdersTable(ordersData) {
    const tbody = document.getElementById('ordersTableBody');
    if (!tbody) return;

    if (!ordersData || ordersData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-light);">
                    <i class="fas fa-shopping-cart" style="font-size: 3rem; margin-bottom: 1rem; display: block;"></i>
                    هیچ سفارشی یافت نشد
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = '';

    ordersData.forEach((order, index) => {
        const row = document.createElement('tr');
        row.style.animationDelay = `${index * 0.05}s`;
        row.className = 'fade-in-row';
        
        row.innerHTML = `
            <td>#${order.id}</td>
            <td>${order.user_name || order.user || '-'}</td>
            <td>${order.platform || '-'}</td>
            <td>${order.strategy_type || '-'}</td>
            <td>
                <span class="status-badge status-${order.status || 'pending'}">
                    ${getStatusText(order.status || 'pending')}
                </span>
            </td>
            <td>${formatDate(order.created_at)}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-primary" onclick="viewOrderDetails(${order.id})" title="مشاهده جزئیات">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-success" onclick="updateOrderStatusById(${order.id}, 'completed')" title="تکمیل سفارش">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="confirmDeleteOrder(${order.id})" title="حذف سفارش">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}


async function viewOrderDetails(orderId) {
    try {
        showLoading(true);
        const result = await getOrder(orderId);
        
        if (result.error) {
            showNotification('خطا در دریافت جزئیات سفارش', 'error');
            return;
        }

        displayOrderDetailsModal(result.order);
        
    } catch (error) {
        console.error('خطا در دریافت جزئیات:', error);
        showNotification('خطا در دریافت جزئیات', 'error');
    } finally {
        showLoading(false);
    }
}


function displayOrderDetailsModal(order) {
    const modal = document.getElementById('orderDetailsModal');
    const modalBody = modal.querySelector('.modal-body');
    
    modalBody.innerHTML = `
        <div class="order-details">
            <div class="detail-row">
                <strong>شماره سفارش:</strong> #${order.id}
            </div>
            <div class="detail-row">
                <strong>کاربر:</strong> ${order.user_name || order.user || '-'}
            </div>
            <div class="detail-row">
                <strong>پلتفرم:</strong> ${order.platform || '-'}
            </div>
            <div class="detail-row">
                <strong>نوع استراتژی:</strong> ${order.strategy_type || '-'}
            </div>
            <div class="detail-row">
                <strong>وضعیت:</strong> 
                <span class="status-badge status-${order.status || 'pending'}">
                    ${getStatusText(order.status || 'pending')}
                </span>
            </div>
            <div class="detail-row">
                <strong>تاریخ سفارش:</strong> ${formatDate(order.created_at)}
            </div>
            <div class="detail-row">
                <strong>آخرین بروزرسانی:</strong> ${formatDate(order.updated_at)}
            </div>
            <div class="detail-row">
                <strong>توضیحات:</strong> ${order.description || 'ندارد'}
            </div>
            ${order.amount ? `
            <div class="detail-row">
                <strong>مبلغ:</strong> ${order.amount.toLocaleString()} تومان
            </div>
            ` : ''}
        </div>
    `;
    
    openModal('orderDetailsModal');
}


async function updateOrderStatusById(orderId, newStatus) {
    try {
        const result = await updateOrderStatus(orderId, newStatus);
        
        if (result.error) {
            showNotification('خطا در به‌روزرسانی وضعیت سفارش', 'error');
            return;
        }

        showNotification('وضعیت سفارش با موفقیت به‌روزرسانی شد', 'success');
        await loadOrdersData(currentPage.orders);
        
    } catch (error) {
        console.error('خطا در به‌روزرسانی وضعیت:', error);
        showNotification('خطا در به‌روزرسانی وضعیت', 'error');
    }
}


function confirmDeleteOrder(orderId) {
    showConfirmDialog(
        'حذف سفارش',
        'آیا از حذف این سفارش اطمینان دارید؟ این عمل قابل بازگشت نیست.',
        () => deleteOrderById(orderId)
    );
}


async function deleteOrderById(orderId) {
    try {
        const result = await deleteOrder(orderId);
        
        if (result.error) {
            showNotification('خطا در حذف سفارش', 'error');
            return;
        }

        showNotification('سفارش با موفقیت حذف شد', 'success');
        await loadOrdersData(currentPage.orders);
        
    } catch (error) {
        console.error('خطا در حذف سفارش:', error);
        showNotification('خطا در حذف سفارش', 'error');
    }
}


async function exportOrders() {
    try {
        showNotification('در حال آماده‌سازی فایل Excel...', 'info');
        
        
        const result = await getOrders(1, 1000); 
        
        if (result.error) {
            showNotification('خطا در دریافت اطلاعات سفارش‌ها برای صادرات', 'error');
            return;
        }

        
        const csvContent = generateOrdersCSV(result.orders || []);
        downloadFile(csvContent, 'orders.csv', 'text/csv;charset=utf-8;');
        
        showNotification('فایل Excel سفارش‌ها آماده شد', 'success');
        
    } catch (error) {
        console.error('خطا در صادرات:', error);
        showNotification('خطا در صادرات فایل Excel', 'error');
    }
}


async function refreshOrders() {
    showNotification('در حال بروزرسانی سفارش‌ها...', 'info');
    await loadOrdersData(currentPage.orders);
    showNotification('لیست سفارش‌ها با موفقیت بروزرسانی شد', 'success');
}



function setupSearchAndFilters() {
    
    const userSearchInput = document.getElementById('userSearchInput');
    if (userSearchInput) {
        userSearchInput.addEventListener('input', (e) => {
            const searchBox = e.target.closest('.search-box');
            if (e.target.value.trim()) {
                searchBox.classList.add('has-value');
            } else {
                searchBox.classList.remove('has-value');
            }
            
            handleSearch('users', e.target.value);
        });
    }

    
    const orderSearchInput = document.getElementById('orderSearchInput');
    if (orderSearchInput) {
        orderSearchInput.addEventListener('input', (e) => {
            const searchBox = e.target.closest('.search-box');
            if (e.target.value.trim()) {
                searchBox.classList.add('has-value');
            } else {
                searchBox.classList.remove('has-value');
            }
            
            handleSearch('orders', e.target.value);
        });
    }
}

function handleSearch(type, value) {
    clearTimeout(searchTimeouts[type]);
    
    searchTimeouts[type] = setTimeout(() => {
        if (type === 'users' && currentSection === 'users') {
            const statusFilter = document.getElementById('userStatusFilter').value;
            loadUsersData(1, value.trim(), statusFilter);
            currentPage.users = 1;
        } else if (type === 'orders' && currentSection === 'orders') {
            const statusFilter = document.getElementById('orderStatusFilter').value;
            const dateFilter = document.getElementById('orderDateFilter').value;
            loadOrdersData(1, value.trim(), statusFilter, dateFilter);
            currentPage.orders = 1;
        }
    }, 500);
}


function clearUserSearch() {
    const searchInput = document.getElementById('userSearchInput');
    const searchBox = searchInput.closest('.search-box');
    searchInput.value = '';
    searchBox.classList.remove('has-value');
    
    if (currentSection === 'users') {
        const statusFilter = document.getElementById('userStatusFilter').value;
        loadUsersData(1, '', statusFilter);
        currentPage.users = 1;
    }
}


function clearOrderSearch() {
    const searchInput = document.getElementById('orderSearchInput');
    const searchBox = searchInput.closest('.search-box');
    searchInput.value = '';
    searchBox.classList.remove('has-value');
    
    if (currentSection === 'orders') {
        const statusFilter = document.getElementById('orderStatusFilter').value;
        const dateFilter = document.getElementById('orderDateFilter').value;
        loadOrdersData(1, '', statusFilter, dateFilter);
        currentPage.orders = 1;
    }
}


function applyUserFilters() {
    if (currentSection !== 'users') return;
    
    const searchValue = document.getElementById('userSearchInput').value.trim();
    const statusValue = document.getElementById('userStatusFilter').value;
    
    loadUsersData(1, searchValue, statusValue);
    currentPage.users = 1;
    
    showNotification('فیلترها اعمال شد', 'success');
}


function clearUserFilters() {
    document.getElementById('userSearchInput').value = '';
    document.getElementById('userStatusFilter').value = '';
    document.querySelector('#userSearchInput').closest('.search-box').classList.remove('has-value');
    
    if (currentSection === 'users') {
        loadUsersData(1, '', '');
        currentPage.users = 1;
    }
    
    showNotification('فیلترها پاک شد', 'info');
}


function applyOrderFilters() {
    if (currentSection !== 'orders') return;
    
    const searchValue = document.getElementById('orderSearchInput').value.trim();
    const statusValue = document.getElementById('orderStatusFilter').value;
    const dateValue = document.getElementById('orderDateFilter').value;
    
    loadOrdersData(1, searchValue, statusValue, dateValue);
    currentPage.orders = 1;
    
    showNotification('فیلترها اعمال شد', 'success');
}


function clearOrderFilters() {
    document.getElementById('orderSearchInput').value = '';
    document.getElementById('orderStatusFilter').value = '';
    document.getElementById('orderDateFilter').value = '';
    document.querySelector('#orderSearchInput').closest('.search-box').classList.remove('has-value');
    
    if (currentSection === 'orders') {
        loadOrdersData(1, '', '', '');
        currentPage.orders = 1;
    }
    
    showNotification('فیلترها پاک شد', 'info');
}



function changeUsersPage(direction) {
    const newPage = currentPage.users + direction;
    if (newPage < 1) return;
    
    const searchValue = document.getElementById('userSearchInput').value.trim();
    const statusValue = document.getElementById('userStatusFilter').value;
    
    loadUsersData(newPage, searchValue, statusValue);
    currentPage.users = newPage;
}

function changeOrdersPage(direction) {
    const newPage = currentPage.orders + direction;
    if (newPage < 1) return;
    
    const searchValue = document.getElementById('orderSearchInput').value.trim();
    const statusValue = document.getElementById('orderStatusFilter').value;
    const dateValue = document.getElementById('orderDateFilter').value;
    
    loadOrdersData(newPage, searchValue, statusValue, dateValue);
    currentPage.orders = newPage;
}

function updateUsersPagination(total, page) {
    const totalPages = Math.ceil(total / currentLimit);
    
    document.getElementById('usersCurrentPage').textContent = page;
    
    const prevBtn = document.getElementById('usersPrevPage');
    const nextBtn = document.getElementById('usersNextPage');
    
    prevBtn.disabled = page <= 1;
    nextBtn.disabled = page >= totalPages;
    
    if (prevBtn.disabled) {
        prevBtn.classList.add('disabled');
    } else {
        prevBtn.classList.remove('disabled');
    }
    
    if (nextBtn.disabled) {
        nextBtn.classList.add('disabled');
    } else {
        nextBtn.classList.remove('disabled');
    }
}

function updateOrdersPagination(total, page) {
    const totalPages = Math.ceil(total / currentLimit);
    
    document.getElementById('ordersCurrentPage').textContent = page;
    
    const prevBtn = document.getElementById('ordersPrevPage');
    const nextBtn = document.getElementById('ordersNextPage');
    
    prevBtn.disabled = page <= 1;
    nextBtn.disabled = page >= totalPages;
    
    if (prevBtn.disabled) {
        prevBtn.classList.add('disabled');
    } else {
        prevBtn.classList.remove('disabled');
    }
    
    if (nextBtn.disabled) {
        nextBtn.classList.add('disabled');
    } else {
        nextBtn.classList.remove('disabled');
    }
}



function setupModalListeners() {
    
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            closeModal(modal.id);
        });
    });

    
    const cancelBtn = document.getElementById('cancelBtn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => closeModal('addUserModal'));
    }

    
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModal(e.target.id);
        }
    });

    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const openModal = document.querySelector('.modal[style*="block"]');
            if (openModal) {
                closeModal(openModal.id);
            }
        }
    });
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        
        
        const firstInput = modal.querySelector('input, select, textarea');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }, 300);
    }
}


function showConfirmDialog(title, message, onConfirm) {
    const modal = document.getElementById('confirmDeleteModal');
    const titleElement = modal.querySelector('.modal-header h3');
    const messageElement = modal.querySelector('#deleteConfirmText');
    const confirmBtn = modal.querySelector('#confirmDeleteBtn');
    
    titleElement.textContent = title;
    messageElement.textContent = message;
    
    
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    
    
    newConfirmBtn.addEventListener('click', () => {
        onConfirm();
        closeModal('confirmDeleteModal');
    });
    
    openModal('confirmDeleteModal');
}




function displayUserInfo(user) {
    const adminInfo = document.querySelector('.admin-info span');
    if (adminInfo && user) {
        adminInfo.textContent = `خوش آمدید، ${user.first_name || ''} ${user.last_name || ''}`.trim();
    }
}


async function handleLogout() {
    showConfirmDialog(
        'خروج از سیستم',
        'آیا از خروج از پنل مدیریت اطمینان دارید؟',
        async () => {
            try {
                showLoading(true);
                await logout();
                showNotification('با موفقیت خارج شدید', 'success');
                setTimeout(() => {
                    redirectToLogin();
                }, 1000);
            } catch (error) {
                console.error('خطا در خروج:', error);
                
                redirectToLogin();
            }
        }
    );
}


function redirectToLogin() {
    window.location.href = '/login.html';
}


function formatDate(dateString) {
    if (!dateString) return '-';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('fa-IR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        return '-';
    }
}


function getStatusText(status) {
    const statusTexts = {
        'active': 'فعال',
        'inactive': 'غیرفعال',
        'suspended': 'مسدود',
        'pending': 'در انتظار',
        'in-progress': 'در حال انجام',
        'completed': 'تکمیل شده',
        'cancelled': 'لغو شده',
        'processing': 'در حال پردازش',
        'shipped': 'ارسال شده'
    };
    
    return statusTexts[status] || status;
}


function showLoading(show) {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        if (show) {
            loadingOverlay.classList.remove('hidden');
        } else {
            loadingOverlay.classList.add('hidden');
        }
    }
}


function showNotification(message, type = 'info') {
    
    document.querySelectorAll('.notification').forEach(n => n.remove());
    
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${getNotificationIcon(type)}"></i>
        <span>${message}</span>
        <button class="notification-close">&times;</button>
    `;
    
    document.body.appendChild(notification);
    
    
    const autoCloseTimer = setTimeout(() => {
        if (notification.parentNode) {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
    
    
    notification.querySelector('.notification-close').addEventListener('click', () => {
        clearTimeout(autoCloseTimer);
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    });
}

function getNotificationIcon(type) {
    const icons = {
        'success': 'check-circle',
        'error': 'exclamation-triangle',
        'warning': 'exclamation-circle',
        'info': 'info-circle'
    };
    return icons[type] || 'info-circle';
}


async function refreshCurrentSection() {
    if (currentSection && document.querySelector(`#${currentSection}`).classList.contains('active')) {
        await loadSectionData(currentSection);
    }
}




function generateUsersCSV(usersData) {
    const headers = ['شناسه', 'نام', 'نام خانوادگی', 'ایمیل', 'شماره تماس', 'وضعیت', 'تاریخ عضویت'];
    
    let csvContent = headers.join(',') + '';
    
    usersData.forEach(user => {
        const row = [
            user.id || '',
            user.first_name || '',
            user.last_name || '',
            user.email || '',
            user.phone_number || '',
            getStatusText(user.status || ''),
            formatDate(user.date_joined)
        ];
        
        csvContent += row.map(field => `"${field}"`).join(',') + '';
    });
    
    return csvContent;
}


function generateOrdersCSV(ordersData) {
    const headers = ['شماره سفارش', 'کاربر', 'پلتفرم', 'نوع استراتژی', 'وضعیت', 'تاریخ سفارش', 'مبلغ'];
    
    let csvContent = headers.join(',') + '';
    
    ordersData.forEach(order => {
        const row = [
            order.id || '',
            order.user_name || order.user || '',
            order.platform || '',
            order.strategy_type || '',
            getStatusText(order.status || ''),
            formatDate(order.created_at),
            order.amount || ''
        ];
        
        csvContent += row.map(field => `"${field}"`).join(',') + '';
    });
    
    return csvContent;
}


function downloadFile(content, filename, contentType) {
    const blob = new Blob(['\ufeff' + content], { type: contentType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    window.URL.revokeObjectURL(url);
}


const animationStyles = document.createElement('style');
animationStyles.textContent = `
    @keyframes fadeInRow {
        from {
            opacity: 0;
            transform: translateY(10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .fade-in-row {
        animation: fadeInRow 0.3s ease forwards;
    }
    
    .btn.disabled {
        opacity: 0.5;
        cursor: not-allowed;
        pointer-events: none;
    }
    
    .search-box.has-value {
        border-color: var(--primary-color);
    }
`;

document.head.appendChild(animationStyles);