(function () {
  'use strict';

  var recipient = 'felipe@consultordaprotecao.com.br';
  var quoteEndpoint = 'https://formsubmit.co/ajax/' + recipient;
  var adsConversion = 'AW-17928910662/ZSiYCOTqlNYcEMbuleVC';

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
        if (input === mobile) input.value = formatMobile(input.value);
        if (input === plate) input.value = input.value.toUpperCase();
        markInvalid(input, false);
        setStatus(form, '');
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
        setStatus(form, 'Informe seu nome e um WhatsApp válido com DDD para continuar.', 'error');
        return;
      }
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
        setStatus(form, 'Selecione o tipo de veículo e preencha marca, ano e modelo corretamente. A placa é opcional.', 'error');
        return;
      }
      setStatus(form, '');
      showStep(step3, step2);
    });

    field(form, 'pwr_step_3_back').addEventListener('click', function () {
      setStatus(form, '');
      showStep(step2, step3);
    });

    field(form, 'pwr_step_3_go').addEventListener('click', function () {
      var invalidState = state.value.trim().length < 2;
      var invalidCity = city.value.trim().length < 2;
      markInvalid(state, invalidState);
      markInvalid(city, invalidCity);

      if (invalidState || invalidCity) {
        setStatus(form, 'Informe seu estado e cidade para enviar sua cotação.', 'error');
        return;
      }

      var vehicleType = form.querySelector('input[name="pwr_field_type-' + index + '"]:checked');
      var sendButton = field(form, 'pwr_step_3_go');
      var originalButtonText = sendButton.textContent;
      var quoteData = {
        'Nome': name.value.trim(),
        'WhatsApp': mobile.value.trim(),
        'Tipo de veículo': vehicleType.nextElementSibling.textContent.trim(),
        'Marca': brand.value.trim(),
        'Ano': year.value.trim(),
        'Modelo': model.value.trim(),
        'Placa': plate.value.trim(),
        'Estado': state.value.trim(),
        'Cidade': city.value.trim(),
        'Uso em táxi/aplicativo': field(form, 'pwr_field_uber').checked ? 'Sim' : 'Não',
        '_subject': 'Nova cotação de proteção veicular',
        '_template': 'table',
        '_url': 'https://consultordaprotecao.com.br/'
      };

      sendButton.disabled = true;
      sendButton.textContent = 'Enviando...';
      setStatus(form, 'Enviando sua solicitação de cotação...', 'loading');

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
          if (payload && payload.success === false) throw new Error('O serviço de envio recusou a solicitação.');
          trackEvent('lead_form_submit', {
            form_name: 'cotacao_protecao_veicular',
            page_location: window.location.pathname,
            lead_source: 'website'
          });
          setStatus(form, 'Solicitação enviada com sucesso. Redirecionando...', 'success');
          sendAdsConversion(function () { window.location.assign('/obrigado'); });
        })
        .catch(function () {
          sendButton.disabled = false;
          sendButton.textContent = originalButtonText;
          setStatus(form, 'Não foi possível enviar agora. Tente novamente ou fale com Felipe no WhatsApp.', 'error');
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

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.pwr_form').forEach(setupForm);
    setupTracking();
    setupFloatingWhatsapp();
  });
}());
