(function () {
  'use strict';

  var recipient = 'felipe@consultordaprotecao.com.br';
  var quoteEndpoint = 'https://formsubmit.co/ajax/' + recipient;
  var adsConversion = 'AW-17928910662/ZSiYCOTqlNYcEMbuleVC';
  var whatsappNumber = '5519998766431';
  var isSubmitting = false;

  function field(form, name) {
    return form.querySelector('[data-field="' + name + '"]');
  }

  function trackEvent(eventName, details) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(Object.assign({ event: eventName }, details || {}));
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

  function formatMobile(value) {
    var digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length === 0) return '';
    if (digits.length <= 2) return '(' + digits;
    if (digits.length <= 7) return '(' + digits.slice(0, 2) + ') ' + digits.slice(2);
    return '(' + digits.slice(0, 2) + ') ' + digits.slice(2, 7) + '-' + digits.slice(7);
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
    var lines = [
      'Olá, Felipe! Acabei de solicitar uma cotação pelo site.',
      '',
      'Nome: ' + details.name,
      'Tipo de veículo: ' + details.vehicleType,
      'Marca/modelo: ' + details.brand + ' ' + details.model,
      'Ano: ' + details.year
    ];

    if (details.plate) lines.push('Placa: ' + details.plate);
    if (details.city || details.state) lines.push('Cidade/UF: ' + [details.city, details.state].filter(Boolean).join('/'));
    lines.push('Uso em aplicativo: ' + details.uber);
    if (details.preferences.length) lines.push('O que considero mais importante: ' + details.preferences.join(', '));
    lines.push('', 'Gostaria de conhecer as opções disponíveis para o meu perfil.');

    return 'https://wa.me/' + whatsappNumber + '?text=' + encodeURIComponent(lines.join('\n'));
  }

  function setWhatsAppFallback(form, url, isVisible) {
    var fallback = form.querySelector('.form-whatsapp-fallback');
    if (!fallback) return;
    fallback.href = url || '#';
    fallback.hidden = !isVisible;
  }

  function replaceWithInput(form, name, placeholder, type) {
    var original = field(form, name);
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

  function prepareFields(form, index) {
    form.querySelectorAll('[id]').forEach(function (element) {
      var originalId = element.id;
      element.dataset.field = originalId;
      element.id = originalId + '-' + index;
      form.querySelectorAll('label[for="' + originalId + '"]').forEach(function (label) {
        label.htmlFor = element.id;
      });
    });

    form.querySelectorAll('input[type="radio"]').forEach(function (radio) {
      radio.name = 'pwr_field_type-' + index;
    });

    var name = field(form, 'pwr_field_name');
    var mobile = field(form, 'pwr_field_mobile');
    name.autocomplete = 'given-name';
    name.required = true;
    mobile.type = 'tel';
    mobile.inputMode = 'tel';
    mobile.autocomplete = 'tel';
    mobile.placeholder = '(00) 00000-0000';
    mobile.maxLength = 15;
    mobile.pattern = '\\([0-9]{2}\\) [0-9]{4,5}-[0-9]{4}';
    mobile.required = true;

    replaceWithInput(form, 'pwr_field_brand', 'Marca do veículo');
    replaceWithInput(form, 'pwr_field_year', 'Ano do veículo', 'number').min = '1900';
    replaceWithInput(form, 'pwr_field_model', 'Modelo do veículo');
    var plate = field(form, 'pwr_field_plate');
    plate.placeholder = 'ABC1D23';
    plate.autocomplete = 'off';
    plate.required = false;
    replaceWithInput(form, 'pwr_field_state', 'Estado');
    replaceWithInput(form, 'pwr_field_city', 'Cidade');

    form.querySelectorAll('button').forEach(function (button) {
      button.type = 'button';
    });
  }

  function sendAdsConversion(onComplete) {
    var completed = false;
    function complete() {
      if (completed) return;
      completed = true;
      onComplete();
    }

    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    window.gtag('event', 'conversion', {
      send_to: adsConversion,
      value: 1.0,
      currency: 'BRL',
      event_callback: complete,
      event_timeout: 700
    });
    window.setTimeout(complete, 800);
  }

  function setupForm(form, index) {
    prepareFields(form, index);
    var formStarted = false;

    var step1 = field(form, 'pwr_step_1');
    var step2 = field(form, 'pwr_step_2');
    var step3 = field(form, 'pwr_step_3');
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
          trackEvent('form_start', { form_name: 'cotacao_protecao_veicular', form_location: index === 0 ? 'hero' : 'modal' });
        }
        if (input === mobile) input.value = formatMobile(input.value);
        if (input === plate) input.value = input.value.toUpperCase();
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
      var invalidName = name.value.trim().length < 2;
      var invalidMobile = mobile.value.replace(/\D/g, '').length < 10;
      markInvalid(name, invalidName);
      markInvalid(mobile, invalidMobile);

      if (invalidName || invalidMobile) {
        trackEvent('form_validation_error', { form_name: 'cotacao_protecao_veicular', form_step: 1 });
        setStatus(form, 'Informe seu nome e um WhatsApp válido com DDD para continuar.', 'error');
        return;
      }
      trackEvent('form_step_advance', { form_name: 'cotacao_protecao_veicular', form_step: 1 });
      setStatus(form, '');
      showStep(step2, step1);
    });

    field(form, 'pwr_step_2_back').addEventListener('click', function () {
      setStatus(form, '');
      showStep(step1, step2);
    });

    field(form, 'pwr_step_2_next').addEventListener('click', function () {
      var vehicleType = form.querySelector('input[name="pwr_field_type-' + index + '"]:checked');
      var invalidBrand = brand.value.trim().length < 2;
      var invalidYear = year.value.trim().length !== 4;
      var invalidModel = model.value.trim().length < 2;
      var plateValue = plate.value.replace(/[^A-Z0-9]/gi, '');
      var invalidPlate = plateValue.length > 0 && plateValue.length !== 7;
      markInvalid(brand, invalidBrand);
      markInvalid(year, invalidYear);
      markInvalid(model, invalidModel);
      markInvalid(plate, invalidPlate);

      if (!vehicleType || invalidBrand || invalidYear || invalidModel || invalidPlate) {
        trackEvent('form_validation_error', { form_name: 'cotacao_protecao_veicular', form_step: 2 });
        setStatus(form, 'Selecione o tipo de veículo e preencha marca, ano e modelo corretamente. A placa é opcional.', 'error');
        return;
      }
      trackEvent('form_step_advance', { form_name: 'cotacao_protecao_veicular', form_step: 2 });
      setStatus(form, '');
      showStep(step3, step2);
    });

    field(form, 'pwr_step_3_back').addEventListener('click', function () {
      setStatus(form, '');
      showStep(step2, step3);
    });

    field(form, 'pwr_step_3_go').addEventListener('click', function () {
      if (isSubmitting) return;

      var invalidState = state.value.trim().length < 2;
      var invalidCity = city.value.trim().length < 2;
      markInvalid(state, invalidState);
      markInvalid(city, invalidCity);

      if (invalidState || invalidCity) {
        trackEvent('form_validation_error', { form_name: 'cotacao_protecao_veicular', form_step: 3 });
        setStatus(form, 'Informe seu estado e cidade para enviar sua cotação.', 'error');
        return;
      }

      var vehicleType = form.querySelector('input[name="pwr_field_type-' + index + '"]:checked');
      var sendButton = field(form, 'pwr_step_3_go');
      var originalButtonText = sendButton.textContent;
      var details = {
        name: name.value.trim(),
        mobile: mobile.value.trim(),
        vehicleType: vehicleType.nextElementSibling.textContent.trim(),
        brand: brand.value.trim(),
        year: year.value.trim(),
        model: model.value.trim(),
        plate: plate.value.trim(),
        state: state.value.trim(),
        city: city.value.trim(),
        uber: field(form, 'pwr_field_uber').checked ? 'Sim' : 'Não',
        preferences: Array.prototype.slice.call(form.querySelectorAll('[data-preference]:checked')).map(function (input) { return input.value; })
      };
      var quoteData = {
        '_subject': 'Nova cotação pelo site — ' + details.name,
        '_template': 'table',
        '_url': window.location.href
      };
      addIfPresent(quoteData, 'Nome', details.name);
      addIfPresent(quoteData, 'WhatsApp', details.mobile);
      addIfPresent(quoteData, 'Tipo de veículo', details.vehicleType);
      addIfPresent(quoteData, 'Marca/modelo', details.brand + ' ' + details.model);
      addIfPresent(quoteData, 'Ano', details.year);
      addIfPresent(quoteData, 'Placa', details.plate);
      addIfPresent(quoteData, 'Cidade/UF', details.city + '/' + details.state);
      addIfPresent(quoteData, 'Uso em aplicativo', details.uber);
      addIfPresent(quoteData, 'O que é mais importante', details.preferences.join(', '));
      addIfPresent(quoteData, 'Origem', 'Landing page Consultor da Proteção');
      addIfPresent(quoteData, 'Data e horário', getSubmittedAt());
      var utmParameters = getUtmParameters();
      Object.keys(utmParameters).forEach(function (label) {
        addIfPresent(quoteData, label, utmParameters[label]);
      });
      var whatsappUrl = buildWhatsAppUrl(details);

      isSubmitting = true;
      sendButton.disabled = true;
      sendButton.textContent = 'Registrando sua cotação...';
      setWhatsAppFallback(form, '', false);
      setStatus(form, 'Registrando sua cotação...', 'loading');

      fetch(quoteEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(quoteData)
      })
        .then(function (response) {
          if (!response.ok) throw new Error('Não foi possível enviar a cotação.');
          return response.json();
        })
        .then(function (payload) {
          if (!payload || payload.success === false || payload.success === 'false') throw new Error('O serviço de envio recusou a solicitação.');
          trackEvent('lead_form_submit', {
            form_name: 'cotacao_protecao_veicular',
            page_location: window.location.pathname,
            lead_source: 'website'
          });
          setStatus(form, 'Cotação registrada com sucesso! Estamos direcionando você para o WhatsApp.', 'success');
          sendAdsConversion(function () {
            trackEvent('whatsapp_redirect', {
              form_name: 'cotacao_protecao_veicular',
              page_location: window.location.pathname,
              redirect_destination: 'whatsapp'
            });
            window.location.href = whatsappUrl;
          });
        })
        .catch(function () {
          isSubmitting = false;
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

    document.querySelectorAll('[data-track-whatsapp]').forEach(function (button) {
      button.addEventListener('click', function () {
        trackEvent('whatsapp_click', { cta_location: button.dataset.trackWhatsapp });
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
    var benefits = document.querySelector('.section-boxs');
    var steps = document.querySelector('.steps-section');
    var consultant = document.querySelector('.consultant-section');
    if (banner && benefits) banner.insertAdjacentElement('afterend', benefits);
    if (steps && consultant) steps.insertAdjacentElement('afterend', consultant);
  }

  document.addEventListener('DOMContentLoaded', function () {
    placeBenefitsSection();
    document.querySelectorAll('.pwr_form').forEach(setupForm);
    setupTracking();
    setupFloatingWhatsapp();
  });
}());
