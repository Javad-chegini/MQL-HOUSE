document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('wizard-form');
    const steps = Array.from(document.querySelectorAll('.step'));
    const wizSteps = Array.from(document.querySelectorAll('.wizard-step'));
    const nextBtn = document.getElementById('nextBtn');
    const prevBtn = document.getElementById('prevBtn');
    const submitBtn = document.getElementById('submitBtn');
    const skipBtn = document.getElementById('skipBtn');
    const indBox = document.querySelector('.indicator-params');
    const timeFrameSel = document.getElementById('timeFrame');
    let current = 0;
    let isSkipped = false;
    const savedData = localStorage.getItem('wizardFormData');
    const savedStep = localStorage.getItem('wizardFormStep');
    if (savedData) {
        try {
            const data = JSON.parse(savedData);
            if (confirm('اطلاعات فرم قبلی شما ذخیره شده است. آیا می‌خواهید آن را بازیابی کنید؟')) {
                setTimeout(() => {
                    Object.keys(data).forEach(key => {
                        const inputs = form.querySelectorAll(`[name="${key}"]`);
                        if (inputs.length > 0) {
                            if (inputs[0].type === 'radio') {
                                const radioInput = form.querySelector(`[name="${key}"][value="${data[key]}"]`);
                                if (radioInput) {
                                    radioInput.checked = true;
                                    radioInput.dispatchEvent(new Event('change', { bubbles: true }));
                                }
                            } else if (inputs[0].type === 'checkbox') {
                                inputs[0].checked = data[key] === 'on' || data[key] === true;
                                inputs[0].dispatchEvent(new Event('change', { bubbles: true }));
                            } else {
                                inputs[0].value = data[key];
                            }
                        }
                    });
                    if (savedStep) {
                        current = parseInt(savedStep);
                        isSkipped = localStorage.getItem('wizardFormSkipped') === 'true';
                        showStep(current);
                    }
                }, 100);
            } else {
                localStorage.removeItem('wizardFormData');
                localStorage.removeItem('wizardFormStep');
                localStorage.removeItem('wizardFormSkipped');
            }
        } catch (error) {
            console.error('خطا در بازیابی اطلاعات:', error);
            localStorage.removeItem('wizardFormData');
            localStorage.removeItem('wizardFormStep');
            localStorage.removeItem('wizardFormSkipped');
        }
    }
    const indicatorMap = {
        'RSI': ['بازه زمانی (Period)', null],
        'MACD': ['EMA کوتاه (Fast)', 'EMA بلند (Slow)'],
        'EMA': ['دوره EMA', null],
        'Bollinger Bands': ['دوره', 'انحراف معیار (StdDev)'],
        'سایر': [null, null],
        'other': [null, null]
    };
    const clearError = (group) => {
        group.classList.remove('has-error');
        const msg = group.querySelector('.error-message');
        if (msg) {
            msg.style.display = 'none';
            msg.textContent = '';
        }
    };
    const showError = (group, text) => {
        group.classList.add('has-error');
        const msg = group.querySelector('.error-message');
        if (msg) {
            msg.textContent = text;
            msg.style.display = 'block';
            const input = group.querySelector('input, select, textarea');
            if (input) {
                input.classList.add('shake');
                setTimeout(() => input.classList.remove('shake'), 300);
            }
        }
    };
    const validateStep = (idx) => {
        let valid = true;
        const groups = steps[idx].querySelectorAll('.form-group');
        groups.forEach(group => clearError(group));
        if (idx === 2) {
            const riskMgmtRadios = steps[idx].querySelectorAll('input[name="riskManagement"]');
            const riskMgmtSelected = Array.from(riskMgmtRadios).find(r => r.checked);
            if (!riskMgmtSelected) {
                const riskMgmtGroup = steps[idx].querySelector('input[name="riskManagement"]').closest('.form-group');
                showError(riskMgmtGroup, 'لطفاً نوع مدیریت ریسک را انتخاب کنید.');
                valid = false;
            } else {
                if (riskMgmtSelected.value === 'percentage') {
                    const percentageInput = steps[idx].querySelector('input[name="riskPercentage"]');
                    if (percentageInput && (!percentageInput.value.trim() || parseFloat(percentageInput.value) <= 0)) {
                        const percentageGroup = percentageInput.closest('.form-group');
                        showError(percentageGroup, 'لطفاً درصد ریسک معتبر وارد کنید.');
                        valid = false;
                    }
                }
                if (riskMgmtSelected.value === 'fixed') {
                    const fixedInput = steps[idx].querySelector('input[name="fixedLot"]');
                    if (fixedInput && (!fixedInput.value.trim() || parseFloat(fixedInput.value) <= 0)) {
                        const fixedGroup = fixedInput.closest('.form-group');
                        showError(fixedGroup, 'لطفاً حجم ثابت معتبر وارد کنید.');
                        valid = false;
                    }
                }
            }
            return valid;
        }
        for (const group of groups) {
            const reqs = group.querySelectorAll('[required]');
            if (!reqs.length) continue;
            if (reqs[0].disabled) continue;
            if (reqs[0].type === 'radio') {
                const name = reqs[0].name;
                if (!steps[idx].querySelector(`input[name="${name}"]:checked`)) {
                    showError(group, 'لطفاً یک گزینه را انتخاب کنید.');
                    valid = false;
                }
            } else if (reqs[0].type === 'checkbox') {
                const checkboxName = reqs[0].name;
                if (
                  checkboxName === 'activityTimeEnabled' ||
                  checkboxName === 'tradeLimitEnabled' ||
                  checkboxName === 'maxDrawdownEnabled' ||
                  checkboxName === 'forbiddenTimesEnabled' ||
                  checkboxName === 'trailingStop' ||
                  checkboxName === 'riskFree'
                ) continue;
            } else if (reqs[0].type === 'number') {
                const inp = reqs[0];
                if (!inp.value.trim()) {
                    showError(group, 'این فیلد الزامی است.');
                    valid = false;
                } else if (parseFloat(inp.value) < 0) {
                    showError(group, 'مقدار نمی‌تواند منفی باشد.');
                    valid = false;
                } else if (inp.name === 'maxDrawdown' && parseFloat(inp.value) > 100) {
                    showError(group, 'حداکثر Drawdown نمی‌تواند بیشتر از ۱۰۰٪ باشد.');
                    valid = false;
                }
            } else if (reqs[0].type === 'time') {
                const inp = reqs[0];
                if (!inp.value.trim()) {
                    showError(group, 'لطفاً زمان را وارد کنید.');
                    valid = false;
                }
            } else if (reqs[0].type === 'select-one') {
                const inp = reqs[0];
                if (!inp.value || inp.value === '') {
                    showError(group, 'لطفاً گزینه‌ای را انتخاب کنید.');
                    valid = false;
                }
            } else {
                const inp = reqs[0];
                if (!inp.value.trim()) {
                    showError(group, 'این فیلد الزامی است.');
                    valid = false;
                }
            }
        }
        return valid;
    };
    const showStep = (idx) => {
        document.documentElement.style.setProperty('--current-step', idx);
        steps.forEach((s, i) => s.classList.toggle('active', i === idx));
        wizSteps.forEach((w, i) => {
            w.classList.toggle('active', i === idx);
            w.classList.toggle('completed', i < idx);
        });
        prevBtn.style.display = idx === 0 ? 'none' : 'inline-block';
        nextBtn.style.display = (idx === steps.length - 1 && !isSkipped) ? 'none' : 'inline-block';
        submitBtn.style.display = (idx === steps.length - 1 || (idx === 3 && isSkipped)) ? 'inline-block' : 'none';
        skipBtn.style.display = idx === 0 ? 'inline-block' : 'none';
        if (idx === 3) {
            initializeStep4Fields();
        }
        if (idx === 3 && isSkipped) {
            document.querySelectorAll('.step:nth-child(4) .form-group').forEach(group => {
                const label = group.querySelector('label');
                if (label && (label.textContent.includes('شرایط ورود') ||
                              label.textContent.includes('شرایط خروج') ||
                              label.textContent.includes('توضیحات کلی'))) {
                    group.style.display = 'block';
                } else {
                    group.style.display = 'none';
                }
            });
            nextBtn.style.display = 'none';
        } else if (idx === 3) {
            document.querySelectorAll('.step:nth-child(4) .form-group').forEach(group => {
                group.style.display = 'block';
            });
        }
    };
    const saveFormState = () => {
        const formData = new FormData(form);
        const data = {};
        for (const [key, value] of formData.entries()) {
            data[key] = value;
        }
        localStorage.setItem('wizardFormData', JSON.stringify(data));
        localStorage.setItem('wizardFormStep', current.toString());
        localStorage.setItem('wizardFormSkipped', isSkipped.toString());
    };
    const nextStep = () => {
        if (!validateStep(current)) return;
        saveFormState(); 
        if (current < steps.length - 1) {
            current++;
            showStep(current);
            if (current === steps.length - 1) collectSummary();
        }
    };
    const prevStep = () => {
        if (current > 0) {
            if (isSkipped && current === 3) {
                current = 0;
                isSkipped = false;
            } else {
                current--;
            }
            showStep(current);
            saveFormState(); 
        }
    };
    const skipToStep4 = () => {
        current = 3;
        isSkipped = true;
        showStep(current);
        saveFormState(); 
    };
    const collectSummary = () => {
        const ul = document.querySelector('#summary ul');
        ul.innerHTML = '';
        const data = new FormData(form);
        for (const [key, val] of data.entries()) {
            if (key === 'confirm') continue;
            const li = document.createElement('li');
            li.textContent = `${key}: ${val}`;
            ul.appendChild(li);
        }
    };
    const collectFormData = () => {
        const formData = new FormData(form);
        const data = {};
        for (const [key, value] of formData.entries()) {
            if (key === 'confirm') continue;
            data[key] = value;
        }
        data.title = `ربات معاملاتی ${data.strategy || 'سفارشی'}`;
        data.description = generateDescription(data);
        data.tools_description = generateToolsDescription(data);
        return data;
    };
    const generateDescription = (data) => {
        let desc = "جزئیات ربات معاملاتی:\n";
        if (data.platform) desc += `📊 پلتفرم: ${data.platform}\n`;
        if (data.language) desc += `💻 زبان: ${data.language}\n`;
        if (data.strategy) desc += `⚡ استراتژی: ${data.strategy}\n`;
        if (data.market) desc += `🏪 مارکت: ${data.market}\n`;
        if (data.timeFrame) desc += `⏰ تایم‌فریم: ${data.timeFrame}\n`;
        if (data.indicator) {
            desc += `\n📈 اندیکاتور: ${data.indicator}\n`;
            if (data.indicatorParam1) desc += `🔧 پارامتر ۱: ${data.indicatorParam1}\n`;
            if (data.indicatorParam2) desc += `🔧 پارامتر ۲: ${data.indicatorParam2}\n`;
            if (data.overbought) desc += `📊 Overbought: ${data.overbought}\n`;
            if (data.oversold) desc += `📊 Oversold: ${data.oversold}\n`;
        }
        if (data.slTpType) {
            desc += `\n💰 نوع SL/TP: ${data.slTpType}\n`;
            if (data.stopLoss) desc += `🛑 Stop Loss: ${data.stopLoss} پیپ\n`;
            if (data.takeProfit) desc += `🎯 Take Profit: ${data.takeProfit} پیپ\n`;
        }
        if (data.riskManagement) {
            desc += `\n📊 مدیریت ریسک: ${data.riskManagement}\n`;
            if (data.riskPercentage) desc += `📈 درصد ریسک: ${data.riskPercentage}%\n`;
            if (data.fixedLot) desc += `📏 حجم ثابت: ${data.fixedLot} لات\n`;
        }
        if (data.activityTimeEnabled === 'on') {
            desc += `\n🕐 ساعت فعالیت: ${data.startTime} تا ${data.endTime}\n`;
        }
        if (data.tradeLimitEnabled === 'on') {
            desc += `\n📊 محدودیت معاملات: ${data.minTrades} تا ${data.maxTrades} در ${data.tradeTimeFrame}\n`;
        }
        if (data.trailingStop === 'on') {
            desc += `\n🔄 Trailing Stop: فعال\n`;
            if (data.trailingStopDescription) desc += `توضیحات: ${data.trailingStopDescription}\n`;
        }
        if (data.riskFree === 'on') {
            desc += `\n🔒 Risk-Free: فعال\n`;
            if (data.riskFreeDescription) desc += `توضیحات: ${data.riskFreeDescription}\n`;
        }
        if (data.maxDrawdownEnabled === 'on') {
            desc += `\n📉 حداکثر Drawdown: ${data.maxDrawdown}%\n`;
        }
        if (data.forbiddenTimesEnabled === 'on') {
            desc += `\n⛔ زمان‌های ممنوعه: ${data.forbiddenTimes}\n`;
        }
        if (data.entryConditions) {
            desc += `\n🎯 شرایط ورود:\n${data.entryConditions}\n`;
        }
        if (data.exitConditions) {
            desc += `\n🚪 شرایط خروج:\n${data.exitConditions}\n`;
        }
        if (data.generalDescription) {
            desc += `\n📝 توضیحات کلی:\n${data.generalDescription}\n`;
        }
        return desc;
    };
    const generateToolsDescription = (data) => {
        const tools = [];
        if (data.platform) tools.push(data.platform);
        if (data.language) tools.push(data.language);
        if (data.indicator) tools.push(data.indicator);
        if (data.strategy) tools.push(`${data.strategy} Strategy`);
        return tools.length > 0 ? tools.join(', ') : 'ابزارهای استاندارد معاملاتی';
    };
    const submitForm = async () => {
        try {
            const orderData = collectFormData();
            submitBtn.disabled = true;
            submitBtn.textContent = 'در حال ارسال...';
            saveFormState();
            const result = await subOrder(
                orderData.title,
                orderData.description,
                orderData.tools_description
            );
            if (result.error) {
                alert(`خطا در ارسال: ${result.msg || result.error}`);
                submitBtn.disabled = false;
                submitBtn.textContent = 'ارسال';
            } else {
                alert('سفارش با موفقیت ثبت شد! در حال انتقال به صفحه ورود...');
                localStorage.removeItem('wizardFormData');
                localStorage.removeItem('wizardFormStep');
                localStorage.removeItem('wizardFormSkipped');
                setTimeout(() => {
                    window.location.href = '/login/'; 
                }, 1500);
            }
        } catch (error) {
            console.error('خطا در ارسال فرم:', error);
            alert('خطا در اتصال به سرور. لطفاً دوباره تلاش کنید.');
            submitBtn.disabled = false;
            submitBtn.textContent = 'ارسال';
        }
    };
    form.addEventListener('input', () => {
        saveFormState(); 
    });
    form.addEventListener('change', () => {
        saveFormState(); 
    });
    const indicatorSelect = document.querySelector('select[name="indicator"]');
    if (indicatorSelect) {
        indicatorSelect.addEventListener('change', () => {
            const ind = indicatorSelect.value;
            const mappedParams = indicatorMap[ind] || [null, null];
            const param1Label = document.querySelector('label[for="indicatorParam1"]');
            const param2Label = document.querySelector('label[for="indicatorParam2"]');
            const param1Group = document.querySelector('.indicator-param1');
            const param2Group = document.querySelector('.indicator-param2');
            if (param1Label && mappedParams[0]) {
                param1Label.textContent = mappedParams[0];
                param1Group.style.display = 'block';
            } else if (param1Group) {
                param1Group.style.display = 'none';
            }
            if (param2Label && mappedParams[1]) {
                param2Label.textContent = mappedParams[1];
                param2Group.style.display = 'block';
            } else if (param2Group) {
                param2Group.style.display = 'none';
            }
            if (ind === 'RSI') {
                const oversoldGroup = document.querySelector('.oversold-group');
                const overboughtGroup = document.querySelector('.overbought-group');
                if (oversoldGroup) oversoldGroup.style.display = 'block';
                if (overboughtGroup) overboughtGroup.style.display = 'block';
            } else {
                const oversoldGroup = document.querySelector('.oversold-group');
                const overboughtGroup = document.querySelector('.overbought-group');
                if (oversoldGroup) oversoldGroup.style.display = 'none';
                if (overboughtGroup) overboughtGroup.style.display = 'none';
            }
        });
    }
    const activityTimeCheckbox = document.querySelector('input[name="activityTimeEnabled"]');
    const activityTimeFields = document.querySelector('.activity-time-fields');
    if (activityTimeCheckbox) {
        activityTimeCheckbox.addEventListener('change', () => {
            if (activityTimeCheckbox.checked) {
                activityTimeFields.style.display = 'block';
                activityTimeFields.querySelectorAll('input').forEach(input => {
                    input.disabled = false;
                    input.required = true;
                });
            } else {
                activityTimeFields.style.display = 'none';
                activityTimeFields.querySelectorAll('input').forEach(input => {
                    input.disabled = true;
                    input.required = false;
                });
            }
        });
    }
    const tradeLimitCheckbox = document.querySelector('input[name="tradeLimitEnabled"]');
    const tradeLimitFields = document.querySelector('.trade-limit-fields');
    const tradeValueFields = document.querySelector('.trade-value-fields');
    if (tradeLimitCheckbox) {
        tradeLimitCheckbox.addEventListener('change', () => {
            if (tradeLimitCheckbox.checked) {
                tradeLimitFields.style.display = 'block';
                tradeValueFields.style.display = 'block';
                tradeLimitFields.querySelectorAll('input, select').forEach(input => {
                    input.disabled = false;
                    input.required = true;
                });
                tradeValueFields.querySelectorAll('input').forEach(input => {
                    input.disabled = false;
                    input.required = true;
                });
            } else {
                tradeLimitFields.style.display = 'none';
                tradeValueFields.style.display = 'none';
                tradeLimitFields.querySelectorAll('input, select').forEach(input => {
                    input.disabled = true;
                    input.required = false;
                });
                tradeValueFields.querySelectorAll('input').forEach(input => {
                    input.disabled = true;
                    input.required = false;
                });
            }
        });
    }
    const riskManagementRadios = document.querySelectorAll('input[name="riskManagement"]');
    const riskPercentageField = document.querySelector('.risk-percentage-field');
    const riskFixedField = document.querySelector('.risk-fixed-field');
    if (riskManagementRadios) {
        riskManagementRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                if (radio.value === 'percentage' && radio.checked) {
                    riskPercentageField.style.display = 'block';
                    riskPercentageField.querySelector('input').disabled = false;
                    riskPercentageField.querySelector('input').required = true;
                    riskFixedField.style.display = 'none';
                    riskFixedField.querySelector('input').disabled = true;
                    riskFixedField.querySelector('input').required = false;
                } else if (radio.value === 'fixed' && radio.checked) {
                    riskFixedField.style.display = 'block';
                    riskFixedField.querySelector('input').disabled = false;
                    riskFixedField.querySelector('input').required = true;
                    riskPercentageField.style.display = 'none';
                    riskPercentageField.querySelector('input').disabled = true;
                    riskPercentageField.querySelector('input').required = false;
                }
            });
        });
    }
    const trailingStopCheckbox = document.querySelector('input[name="trailingStop"]');
    const riskFreeCheckbox = document.querySelector('input[name="riskFree"]');
    const trailingStopDetails = document.querySelector('.trailing-stop-details');
    const riskFreeDetails = document.querySelector('.risk-free-details');
    if (trailingStopCheckbox) {
        trailingStopCheckbox.addEventListener('change', () => {
            if (trailingStopCheckbox.checked) {
                trailingStopDetails.style.display = 'block';
                trailingStopDetails.querySelector('textarea').disabled = false;
                trailingStopDetails.querySelector('textarea').required = true;
            } else {
                trailingStopDetails.style.display = 'none';
                trailingStopDetails.querySelector('textarea').disabled = true;
                trailingStopDetails.querySelector('textarea').required = false;
            }
        });
    }
    if (riskFreeCheckbox) {
        riskFreeCheckbox.addEventListener('change', () => {
            if (riskFreeCheckbox.checked) {
                riskFreeDetails.style.display = 'block';
                riskFreeDetails.querySelector('textarea').disabled = false;
                riskFreeDetails.querySelector('textarea').required = true;
            } else {
                riskFreeDetails.style.display = 'none';
                riskFreeDetails.querySelector('textarea').disabled = true;
                riskFreeDetails.querySelector('textarea').required = false;
            }
        });
    }
    const forbiddenTimesCheckbox = document.querySelector('input[name="forbiddenTimesEnabled"]');
    const forbiddenTimesFields = document.querySelector('.forbidden-times-fields');
    if (forbiddenTimesCheckbox) {
        forbiddenTimesCheckbox.addEventListener('change', () => {
            if (forbiddenTimesCheckbox.checked) {
                forbiddenTimesFields.style.display = 'block';
                forbiddenTimesFields.querySelectorAll('input').forEach(input => {
                    input.disabled = false;
                    input.required = true;
                });
            } else {
                forbiddenTimesFields.style.display = 'none';
                forbiddenTimesFields.querySelectorAll('input').forEach(input => {
                    input.disabled = true;
                    input.required = false;
                });
            }
        });
    }
    const maxDrawdownCheckbox = document.querySelector('input[name="maxDrawdownEnabled"]');
    const maxDrawdownField = document.querySelector('.max-drawdown-field');
    if (maxDrawdownCheckbox) {
        maxDrawdownCheckbox.addEventListener('change', () => {
            if (maxDrawdownCheckbox.checked) {
                maxDrawdownField.style.display = 'block';
                maxDrawdownField.querySelector('input').disabled = false;
                maxDrawdownField.querySelector('input').required = true;
            } else {
                maxDrawdownField.style.display = 'none';
                maxDrawdownField.querySelector('input').disabled = true;
                maxDrawdownField.querySelector('input').required = false;
            }
        });
    }
    const timeFrameRadios = document.querySelectorAll('input[name="timeFrame"]');
    timeFrameRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            timeFrameRadios.forEach(r => {
                r.closest('.option-label').classList.remove('selected');
            });
            if (radio.checked) {
                radio.closest('.option-label').classList.add('selected');
            }
        });
    });
    document.querySelectorAll('.option-label input').forEach(inp => {
        inp.addEventListener('change', () => {
            const name = inp.name;
            if (inp.type === 'radio') {
                document.querySelectorAll(`.option-label input[name="${name}"]`)
                    .forEach(i => i.closest('.option-label').classList.remove('selected'));
                if (inp.checked) inp.closest('.option-label').classList.add('selected');
            } else {
                inp.closest('.option-label').classList.toggle('selected', inp.checked);
            }
        });
    });
    nextBtn.addEventListener('click', (e) => {
        e.preventDefault();
        nextStep();
    });
    prevBtn.addEventListener('click', (e) => {
        e.preventDefault();
        prevStep();
    });
    skipBtn.addEventListener('click', (e) => {
        e.preventDefault();
        skipToStep4();
    });
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (validateStep(current)) {
            submitForm();
        }
    });
    submitBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (validateStep(current)) {
            submitForm();
        }
    });
    initializeStep4Fields();
    showStep(0);
});
const indicatorSelect = document.querySelector('select[name="indicator"]');
const indicatorRadios = document.querySelectorAll('input[name="indicator"]');
if (indicatorRadios) {
    indicatorRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            if (radio.checked) {
                const ind = radio.value;
                const mappedParams = indicatorMap[ind] || [null, null];
                const param1Label = document.querySelector('label[for="indicatorParam1"]');
                const param2Label = document.querySelector('label[for="indicatorParam2"]');
                const param1Group = document.querySelector('.indicator-param1');
                const param2Group = document.querySelector('.indicator-param2');
                const indicatorParamsContainer = document.querySelector('.indicator-params');
                indicatorParamsContainer.style.display = 'block';
                if (param1Label && mappedParams[0]) {
                    param1Label.textContent = mappedParams[0];
                    param1Group.style.display = 'block';
                } else if (param1Group) {
                    param1Group.style.display = 'none';
                }
                if (param2Label && mappedParams[1]) {
                    param2Label.textContent = mappedParams[1];
                    param2Group.style.display = 'block';
                } else if (param2Group) {
                    param2Group.style.display = 'none';
                }
                if (ind === 'RSI') {
                    const oversoldGroup = document.querySelector('.oversold-group');
                    const overboughtGroup = document.querySelector('.overbought-group');
                    if (oversoldGroup) oversoldGroup.style.display = 'block';
                    if (overboughtGroup) overboughtGroup.style.display = 'block';
                } else {
                    const oversoldGroup = document.querySelector('.oversold-group');
                    const overboughtGroup = document.querySelector('.overbought-group');
                    if (oversoldGroup) oversoldGroup.style.display = 'none';
                    if (overboughtGroup) overboughtGroup.style.display = 'none';
                }
            }
        });
    });
}