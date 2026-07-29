(function () {
  'use strict';

  var recipient = 'felipe@consultordaprotecao.com.br';
  var quoteEndpoint = 'https://formsubmit.co/ajax/' + recipient;
  var whatsappNumber = '5519998766431';
  function field(form, name) {
    return form.querySelector('[data-field="' + name + '"]');
  }

  function trackEvent(eventName, details) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(Object.assign({ event: eventName }, details || {}));
  }

  function trackQuoteSuccess(form, eventName, flagName, quoteId, options) {
    if (form.dataset[flagName] === 'true') return;
    form.dataset[flagName] = 'true';
    window.dataLayer = window.dataLayer || [];
    var eventData = {
      event: eventName,
      lead_id: String(quoteId)
    };
    if (options && typeof options.eventCallback === 'function') eventData.eventCallback = options.eventCallback;
    if (options && options.eventTimeout) eventData.eventTimeout = options.eventTimeout;
    window.dataLayer.push(eventData);
  }

  function setStatus(form, message, state) {
    var status = form.querySelector('.form-status');
    if (!status) return;
    status.textContent = message || '';
    status.dataset.state = state || '';
  }

  function markInvalid(element, isInvalid) {
    element.classList.toggle('required', isInvalid);
    element.classList.toggle('input-true', !isInvalid && element.value.trim() !== '');
    element.setAttribute('aria-invalid', isInvalid ? 'true' : 'false');
  }

  function getMobileDigits(value) {
    var digits = String(value || '').replace(/\D/g, '');
    if ((digits.length === 12 || digits.length === 13) && digits.indexOf('55') === 0) digits = digits.slice(2);
    return digits.slice(0, 11);
  }

  function formatMobile(value) {
    var digits = getMobileDigits(value);
    if (digits.length === 0) return '';
    if (digits.length <= 2) return '(' + digits;
    if (digits.length <= 7) return '(' + digits.slice(0, 2) + ') ' + digits.slice(2);
    return '(' + digits.slice(0, 2) + ') ' + digits.slice(2, 7) + '-' + digits.slice(7);
  }

  function normalizeMobile(value) {
    var digits = getMobileDigits(value);
    return digits ? '+55 ' + digits : '';
  }

  function formatPlate(value) {
    return String(value || '').replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 7);
  }

  function isValidPlate(value) {
    return /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(value);
  }

  function addIfPresent(target, label, value) {
    if (value === undefined || value === null || String(value).trim() === '') return;
    target[label] = String(value).trim();
  }

  function getUtmParameters() {
    var params = new URLSearchParams(window.location.search);
    var utms = {};
    ['source', 'medium', 'campaign', 'content', 'term'].forEach(function (name) {
      var value = params.get('utm_' + name);
      if (value) utms['UTM ' + name.charAt(0).toUpperCase() + name.slice(1)] = value;
    });
    if (params.get('gclid')) utms.GCLID = params.get('gclid');
    return utms;
  }

  function getSubmittedAt() {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'medium',
      timeZone: 'America/Sao_Paulo'
    }).format(new Date());
  }

  function buildWhatsAppUrl(details) {
    var vehicle = [details.brand, details.model, details.year].filter(Boolean).join(' ');
    var lines = [
      'Olá, Felipe! Acabei de preencher a cotação no site.',
      '',
      'Nome: ' + details.name,
      'Tipo de veículo: ' + details.vehicleType,
      'Placa: ' + details.plate
    ];

    if (vehicle) lines.push('Veículo: ' + vehicle);
    if (details.city || details.state) lines.push('Cidade: ' + [details.city, details.state].filter(Boolean).join('/'));
    lines.push('Uso em aplicativo: ' + details.uber);
    lines.push('', 'Gostaria de receber as opções de proteção veicular.');

    return 'https://wa.me/' + whatsappNumber + '?text=' + encodeURIComponent(lines.join('\n'));
  }

  function setWhatsAppFallback(form, url, isVisible) {
    var fallback = form.querySelector('.form-whatsapp-fallback');
    if (!fallback) return;
    fallback.href = url || '#';
    fallback.hidden = !isVisible;
  }

  function isManualWhatsAppUrl(href) {
    return /^(https:\/\/(?:wa\.me|api\.whatsapp\.com|web\.whatsapp\.com)\/|whatsapp:\/\/send(?:[/?]|$))/i.test(String(href || '').trim());
  }

  function replaceWithInput(form, name, placeholder, type) {
    var original = field(form, name);
    if (original.tagName.toLowerCase() === 'input') {
      original.type = type || 'text';
      original.placeholder = placeholder;
      original.required = true;
      return original;
    }
    var input = document.createElement('input');
    input.type = type || 'text';
    input.placeholder = placeholder;
    input.autocomplete = 'off';
    input.dataset.field = name;
    input.id = original.id;
    input.required = true;
    original.replaceWith(input);
    return input;
  }

  function showStep(stepToShow, stepToHide) {
    stepToHide.style.display = 'none';
    stepToShow.style.display = 'block';
    stepToShow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function createQuoteId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') return 'CP-' + window.crypto.randomUUID();
    if (window.crypto && typeof window.crypto.getRandomValues === 'function') {
      var values = new Uint32Array(2);
      window.crypto.getRandomValues(values);
      return 'CP-' + Date.now().toString(36) + '-' + values[0].toString(36) + values[1].toString(36);
    }
    return 'CP-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 12);
  }

  function getQuoteId(form) {
    if (!form.dataset.quoteId) form.dataset.quoteId = createQuoteId();
    return form.dataset.quoteId;
  }

  function setFormCopy(form, step) {
    var title = Array.prototype.slice.call(form.children).find(function (element) { return element.tagName === 'SPAN'; });
    var description = form.querySelector('.form-description');
    if (!title || !description) return;
    if (step === 1) {
      title.textContent = 'Vamos encontrar uma opção para o seu veículo';
      description.textContent = 'Informe seu nome e WhatsApp para iniciar. Leva menos de 1 minuto.';
    } else {
      title.textContent = 'Agora precisamos identificar o seu veículo';
      description.textContent = 'Essas informações são necessárias para consultar os valores, benefícios e condições disponíveis.';
    }
  }

  function focusInvalid(element) {
    if (!element) return;
    element.focus({ preventScroll: true });
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function prepareFields(form, index) {
    form.querySelectorAll('[id]').forEach(function (element) {
      var originalId = element.id;
      element.dataset.field = originalId;
      element.id = originalId + '-' + index;
      form.querySelectorAll('label[for="' + originalId + '"]').forEach(function (label) {
        label.htmlFor = element.id;
      });
    });

    form.querySelectorAll('[data-field^="pwr_field_type_"]').forEach(function (radio) {
      radio.name = 'pwr_field_type-' + index;
    });

    form.querySelectorAll('[data-field^="pwr_field_uber_"]').forEach(function (radio) {
      radio.name = 'pwr_field_uber-' + index;
    });

    var name = field(form, 'pwr_field_name');
    var mobile = field(form, 'pwr_field_mobile');
    name.autocomplete = 'name';
    name.placeholder = 'Digite seu nome';
    name.required = true;
    mobile.type = 'tel';
    mobile.inputMode = 'tel';
    mobile.autocomplete = 'tel';
    mobile.placeholder = '(DDD) 00000-0000';
    mobile.maxLength = 15;
    mobile.pattern = '\\([0-9]{2}\\) [0-9]{4,5}-[0-9]{4}';
    mobile.required = true;

    replaceWithInput(form, 'pwr_field_brand', 'Marca do veículo');
    replaceWithInput(form, 'pwr_field_year', 'Ano do veículo', 'number').min = '1900';
    replaceWithInput(form, 'pwr_field_model', 'Modelo do veículo');
    var plate = field(form, 'pwr_field_plate');
    plate.placeholder = 'ABC1D23';
    plate.autocomplete = 'off';
    plate.maxLength = 7;
    plate.pattern = '[A-Z]{3}[0-9][A-Z0-9][0-9]{2}';
    plate.required = true;
    replaceWithInput(form, 'pwr_field_state', 'Estado');
    replaceWithInput(form, 'pwr_field_city', 'Cidade');

    form.querySelectorAll('button').forEach(function (button) {
      button.type = 'button';
    });
  }

  function requestQuote(payload) {
    return fetch(quoteEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (response) {
      if (!response.ok) throw new Error('Não foi possível enviar a cotação.');
      return response.json();
    }).then(function (payload) {
      if (!payload || payload.success === false || payload.success === 'false') throw new Error('O serviço de envio recusou a solicitação.');
      return payload;
    });
  }

  function addContext(target, quoteId, status) {
    addIfPresent(target, 'Identificador da cotação', quoteId);
    addIfPresent(target, 'Status', status);
    addIfPresent(target, 'Data e horário', getSubmittedAt());
    addIfPresent(target, 'URL da página', window.location.href);
    addIfPresent(target, 'Página de origem', document.referrer || 'Acesso direto');
    Object.keys(getUtmParameters()).forEach(function (label) {
      addIfPresent(target, label, getUtmParameters()[label]);
    });
  }

  function getVehicleType(form) {
    var selected = form.querySelector('input[name^="pwr_field_type-"]:checked');
    return selected ? selected.nextElementSibling.textContent.trim() : '';
  }

  function setupForm(form, index) {
    prepareFields(form, index);
    var formStarted = false;

    var step1 = field(form, 'pwr_step_1');
    var step2 = field(form, 'pwr_step_2');
    var name = field(form, 'pwr_field_name');
    var mobile = field(form, 'pwr_field_mobile');
    var brand = field(form, 'pwr_field_brand');
    var year = field(form, 'pwr_field_year');
    var model = field(form, 'pwr_field_model');
    var plate = field(form, 'pwr_field_plate');
    var state = field(form, 'pwr_field_state');
    var city = field(form, 'pwr_field_city');

    [name, mobile, brand, year, model, plate, state, city].forEach(function (input) {
      input.addEventListener('input', function () {
        if (!formStarted) {
          formStarted = true;
          trackEvent('form_start', { form_name: 'cotacao_protecao_veicular', form_location: 'hero' });
        }
        if (input === mobile) input.value = formatMobile(input.value);
        if (input === plate) input.value = formatPlate(input.value);
        markInvalid(input, false);
        setStatus(form, '');
        setWhatsAppFallback(form, '', false);
      });
    });

    mobile.addEventListener('paste', function () {
      window.setTimeout(function () { mobile.value = formatMobile(mobile.value); }, 0);
    });
    mobile.addEventListener('blur', function () {
      mobile.value = formatMobile(mobile.value);
    });

    field(form, 'pwr_step_1_next').addEventListener('click', function () {
      if (form.dataset.processing === 'true') return;
      var invalidName = name.value.trim().length < 2;
      var mobileDigits = getMobileDigits(mobile.value);
      var invalidMobile = mobileDigits.length !== 10 && mobileDigits.length !== 11;
      markInvalid(name, invalidName);
      markInvalid(mobile, invalidMobile);

      if (invalidName || invalidMobile) {
        trackEvent('form_validation_error', { form_name: 'cotacao_protecao_veicular', form_step: 1 });
        setStatus(form, 'Informe seu nome e um WhatsApp válido com DDD para continuar.', 'error');
        focusInvalid(invalidName ? name : mobile);
        return;
      }

      if (form.dataset.contactCaptured === 'true') {
        setStatus(form, '');
        setFormCopy(form, 2);
        showStep(step2, step1);
        return;
      }

      var quoteId = getQuoteId(form);
      var button = field(form, 'pwr_step_1_next');
      var originalText = button.textContent;
      var contactData = {
        '_subject': 'Cotação iniciada — ' + name.value.trim() + ' — ' + quoteId,
        '_template': 'table',
        '_url': window.location.href
      };
      addIfPresent(contactData, 'Nome', name.value.trim());
      addIfPresent(contactData, 'WhatsApp', normalizeMobile(mobile.value));
      addIfPresent(contactData, 'Aviso', 'Os dados do veículo ainda não foram concluídos.');
      addContext(contactData, quoteId, 'cotação iniciada');

      form.dataset.processing = 'true';
      button.disabled = true;
      button.textContent = 'Salvando seus dados...';
      setStatus(form, 'Salvando seus dados para continuar...', 'loading');
      requestQuote(contactData).then(function () {
        form.dataset.contactCaptured = 'true';
        form.dataset.processing = 'false';
        button.disabled = false;
        button.textContent = originalText;
        trackQuoteSuccess(form, 'cotacao_iniciada_sucesso', 'contactSuccessEventSent', quoteId);
        setStatus(form, '');
        setFormCopy(form, 2);
        showStep(step2, step1);
      }).catch(function () {
        form.dataset.processing = 'false';
        button.disabled = false;
        button.textContent = originalText;
        setStatus(form, 'Não foi possível salvar seus dados agora. Verifique sua conexão e tente novamente.', 'error');
      });
    });

    field(form, 'pwr_step_2_back').addEventListener('click', function () {
      setStatus(form, '');
      setFormCopy(form, 1);
      showStep(step1, step2);
    });

    field(form, 'pwr_step_2_go').addEventListener('click', function () {
      if (form.dataset.processing === 'true' || form.dataset.finalSubmitted === 'true') return;
      var vehicleType = getVehicleType(form);
      var invalidBrand = brand.value.trim().length < 2;
      var invalidYear = year.value.trim().length !== 4;
      var invalidModel = model.value.trim().length < 2;
      var plateValue = formatPlate(plate.value);
      var invalidPlate = !isValidPlate(plateValue);
      var invalidState = state.value.trim().length < 2;
      var invalidCity = city.value.trim().length < 2;
      markInvalid(brand, invalidBrand);
      markInvalid(year, invalidYear);
      markInvalid(model, invalidModel);
      markInvalid(plate, invalidPlate);
      markInvalid(state, invalidState);
      markInvalid(city, invalidCity);

      if (!vehicleType || invalidBrand || invalidYear || invalidModel || invalidPlate || invalidState || invalidCity) {
        trackEvent('form_validation_error', { form_name: 'cotacao_protecao_veicular', form_step: 2 });
        setStatus(form, 'Preencha todos os dados do veículo, incluindo uma placa válida, para receber sua cotação.', 'error');
        focusInvalid(!vehicleType ? form.querySelector('input[name^="pwr_field_type-"]') : invalidBrand ? brand : invalidYear ? year : invalidModel ? model : invalidPlate ? plate : invalidState ? state : city);
        return;
      }
      plate.value = plateValue;
      var sendButton = field(form, 'pwr_step_2_go');
      var originalButtonText = sendButton.textContent;
      var details = {
        name: name.value.trim(),
        mobile: mobile.value.trim(),
        mobileNormalized: normalizeMobile(mobile.value),
        vehicleType: vehicleType,
        brand: brand.value.trim(),
        year: year.value.trim(),
        model: model.value.trim(),
        plate: plateValue,
        state: state.value.trim(),
        city: city.value.trim(),
        uber: form.querySelector('input[name^="pwr_field_uber-"]:checked').value
      };
      var quoteId = getQuoteId(form);
      var quoteData = {
        '_subject': 'Cotação concluída — ' + details.name + ' — ' + quoteId,
        '_template': 'table',
        '_url': window.location.href
      };
      addIfPresent(quoteData, 'Nome', details.name);
      addIfPresent(quoteData, 'WhatsApp', details.mobileNormalized);
      addIfPresent(quoteData, 'Tipo de veículo', details.vehicleType);
      addIfPresent(quoteData, 'Marca', details.brand);
      addIfPresent(quoteData, 'Modelo', details.model);
      addIfPresent(quoteData, 'Ano', details.year);
      addIfPresent(quoteData, 'Placa', details.plate);
      addIfPresent(quoteData, 'Cidade/UF', details.city + '/' + details.state);
      addIfPresent(quoteData, 'Uso em aplicativo', details.uber);
      addIfPresent(quoteData, 'Origem', 'Landing page Consultor da Proteção');
      addContext(quoteData, quoteId, 'cotação concluída');
      var whatsappUrl = buildWhatsAppUrl(details);

      form.dataset.processing = 'true';
      sendButton.disabled = true;
      sendButton.textContent = 'Registrando sua cotação...';
      setWhatsAppFallback(form, '', false);
      setStatus(form, 'Registrando sua cotação...', 'loading');

      requestQuote(quoteData)
        .then(function () {
          form.dataset.processing = 'false';
          form.dataset.finalSubmitted = 'true';
          setStatus(form, 'Cotação registrada com sucesso! Estamos direcionando você para o WhatsApp.', 'success');
          var hasRedirected = false;
          var redirectFallback;
          function redirectToWhatsApp() {
            if (hasRedirected) return;
            hasRedirected = true;
            window.clearTimeout(redirectFallback);
            window.location.href = whatsappUrl;
          }
          redirectFallback = window.setTimeout(redirectToWhatsApp, 1200);
          trackQuoteSuccess(form, 'cotacao_concluida_sucesso', 'completionSuccessEventSent', quoteId, {
            eventCallback: redirectToWhatsApp,
            eventTimeout: 1000
          });
        })
        .catch(function () {
          form.dataset.processing = 'false';
          sendButton.disabled = false;
          sendButton.textContent = originalButtonText;
          setStatus(form, 'Não foi possível registrar sua cotação neste momento. Verifique sua conexão e tente novamente.', 'error');
          setWhatsAppFallback(form, whatsappUrl, true);
        });
    });
  }

  function setupTracking() {
    document.querySelectorAll('[data-scroll-form]').forEach(function (button) {
      button.addEventListener('click', function (event) {
        event.preventDefault();
        trackEvent('quote_cta_click', { cta_location: button.dataset.trackCta || 'page' });
        var mainForm = document.querySelector('.banner .pwr_form');
        mainForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
        field(mainForm, 'pwr_field_name').focus({ preventScroll: true });
      });
    });

    document.querySelectorAll('a.js-whatsapp-manual').forEach(function (button) {
      if (button.dataset.whatsappManualListener === 'true') return;
      button.dataset.whatsappManualListener = 'true';
      button.addEventListener('click', function () {
        if (!isManualWhatsAppUrl(button.getAttribute('href'))) return;
        trackEvent('whatsapp_click_manual', { cta_location: button.dataset.whatsappLocation || 'manual' });
      });
    });

    document.querySelectorAll('.faq-list details').forEach(function (item) {
      var summary = item.querySelector('summary');
      item.addEventListener('toggle', function () {
        summary.setAttribute('aria-expanded', item.open ? 'true' : 'false');
      });
    });
  }

  function setupFloatingWhatsapp() {
    var floatingWhatsapp = document.querySelector('.floating-whatsapp');
    if (!floatingWhatsapp || !('IntersectionObserver' in window)) return;
    var mobileQuery = window.matchMedia('(max-width: 768px)');
    var updateFloatingWhatsapp = function (entries) {
      if (!mobileQuery.matches) {
        floatingWhatsapp.classList.remove('is-hidden');
        return;
      }
      floatingWhatsapp.classList.toggle('is-hidden', entries.some(function (entry) { return entry.isIntersecting; }));
    };
    var formObserver = new IntersectionObserver(updateFloatingWhatsapp, { threshold: 0.15 });
    document.querySelectorAll('.pwr_form').forEach(function (form) { formObserver.observe(form); });
    mobileQuery.addEventListener('change', function () { floatingWhatsapp.classList.remove('is-hidden'); });
  }

  function placeBenefitsSection() {
    var banner = document.querySelector('.banner');
    var partners = document.querySelector('.partners-section');
    var benefits = document.querySelector('.section-boxs');
    var steps = document.querySelector('.steps-section');
    var consultant = document.querySelector('.consultant-section');
    if (banner && benefits) banner.insertAdjacentElement('afterend', benefits);
    if (benefits && partners) benefits.insertAdjacentElement('afterend', partners);
    if (steps && consultant) steps.insertAdjacentElement('afterend', consultant);
  }

  document.addEventListener('DOMContentLoaded', function () {
    placeBenefitsSection();
    document.querySelectorAll('.pwr_form').forEach(setupForm);
    setupTracking();
    setupFloatingWhatsapp();
  });
}());
