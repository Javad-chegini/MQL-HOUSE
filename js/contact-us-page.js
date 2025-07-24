// ==================== Contact Form Validation & Submit (contact.js) ====================
document.addEventListener('DOMContentLoaded', () => {
    const form       = document.getElementById('contactForm');
    const successBox = document.getElementById('contactSuccess');

    form.addEventListener('submit', function(e) {
        e.preventDefault();

        const name    = form.name.value.trim();
        const email   = form.email.value.trim();
        const subject = form.subject.value.trim();
        const message = form.message.value.trim();

        // اعتبارسنجی ساده
        if (!name || !email || !subject || !message) {
            alert('لطفاً تمام فیلدها را تکمیل کنید.');
            return;
        }

        // اینجا میشه با fetch یا AJAX ارسال به سرور:
        // fetch('/api/contact', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({ name, email, subject, message })
        // })
        // .then(res => res.json())
        // .then(data => { … })

        // دمو:
        form.reset();
        successBox.style.display = 'block';
        setTimeout(() => successBox.style.display = 'none', 5000);
    });
});
