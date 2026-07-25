(function () {
  'use strict';

  var recipient = 'euofelipemartins@gmail.com';
  var quoteEndpoint = 'https://formsubmit.co/ajax/' + recipient;
  var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function field(form, name) {
    return form.querySelector('[data-field="' + name + '"]');
  }

  function markInvalid(element, isInvalid) {
    element.classList.toggle('required', isInvalid);
    element.classList.toggle('input-true', !isInvalid && element.value.trim() !== '');
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
    var email = field(form, 'pwr_field_email');
    var mobile = field(form, 'pwr_field_mobile');
    name.autocomplete = 'name';
    name.required = true;
    email.type = 'email';
    email.autocomplete = 'email';
    email.required = true;
    mobile.type = 'tel';
    mobile.inputMode = 'tel';
    mobile.autocomplete = 'tel';
    mobile.required = true;

    replaceWithInput(form, 'pwr_field_brand', 'Marca do veículo');
    replaceWithInput(form, 'pwr_field_year', 'Ano do veículo', 'number').min = '1900';
    replaceWithInput(form, 'pwr_field_model', 'Modelo do veículo');
    var plate = field(form, 'pwr_field_plate');
    plate.placeholder = 'ABC1D23';
    plate.autocomplete = 'off';
    plate.required = true;
    replaceWithInput(form, 'pwr_field_state', 'Estado');
    replaceWithInput(form, 'pwr_field_city', 'Cidade');

    form.querySelectorAll('button').forEach(function (button) {
      button.type = 'button';
    });
  }

  function setupForm(form, index) {
    prepareFields(form, index);

    var step1 = field(form, 'pwr_step_1');
    var step2 = field(form, 'pwr_step_2');
    var step3 = field(form, 'pwr_step_3');
    var name = field(form, 'pwr_field_name');
    var email = field(form, 'pwr_field_email');
    var mobile = field(form, 'pwr_field_mobile');
    var brand = field(form, 'pwr_field_brand');
    var year = field(form, 'pwr_field_year');
    var model = field(form, 'pwr_field_model');
    var plate = field(form, 'pwr_field_plate');
    var state = field(form, 'pwr_field_state');
    var city = field(form, 'pwr_field_city');

    [name, email, mobile, brand, year, model, plate, state, city].forEach(function (input) {
      input.addEventListener('input', function () {
        if (input === mobile) input.value = formatMobile(input.value);
        if (input === plate) input.value = input.value.toUpperCase();
        markInvalid(input, false);
      });
    });

    field(form, 'pwr_step_1_next').addEventListener('click', function () {
      var invalidName = name.value.trim().length < 2;
      var invalidEmail = !emailPattern.test(email.value.trim());
      var invalidMobile = mobile.value.replace(/\D/g, '').length < 10;
      markInvalid(name, invalidName);
      markInvalid(email, invalidEmail);
      markInvalid(mobile, invalidMobile);

      if (!invalidName && !invalidEmail && !invalidMobile) {
        showStep(step2, step1);
      }
    });

    field(form, 'pwr_step_2_back').addEventListener('click', function () {
      showStep(step1, step2);
    });

    field(form, 'pwr_step_2_next').addEventListener('click', function () {
      var vehicleType = form.querySelector('input[name="pwr_field_type-' + index + '"]:checked');
      var invalidBrand = brand.value.trim().length < 2;
      var invalidYear = year.value.trim().length !== 4;
      var invalidModel = model.value.trim().length < 2;
      var invalidPlate = plate.value.replace(/[^A-Z0-9]/gi, '').length !== 7;
      markInvalid(brand, invalidBrand);
      markInvalid(year, invalidYear);
      markInvalid(model, invalidModel);
      markInvalid(plate, invalidPlate);

      if (!vehicleType) {
        window.alert('Selecione o tipo do veículo.');
      } else if (!invalidBrand && !invalidYear && !invalidModel && !invalidPlate) {
        showStep(step3, step2);
      }
    });

    field(form, 'pwr_step_3_back').addEventListener('click', function () {
      showStep(step2, step3);
    });

    field(form, 'pwr_step_3_go').addEventListener('click', function () {
      var invalidState = state.value.trim().length < 2;
      var invalidCity = city.value.trim().length < 2;
      markInvalid(state, invalidState);
      markInvalid(city, invalidCity);

      if (invalidState || invalidCity) return;

      var vehicleType = form.querySelector('input[name="pwr_field_type-' + index + '"]:checked');
      var sendButton = field(form, 'pwr_step_3_go');
      var originalButtonText = sendButton.textContent;
      var quoteData = {
        'Nome': name.value.trim(),
        'E-mail para resposta': email.value.trim(),
        'WhatsApp': mobile.value.trim(),
        'Tipo de veiculo': vehicleType.nextElementSibling.textContent.trim(),
        'Marca': brand.value.trim(),
        'Ano': year.value.trim(),
        'Modelo': model.value.trim(),
        'Placa': plate.value.trim(),
        'Estado': state.value.trim(),
        'Cidade': city.value.trim(),
        'Uso em taxi/aplicativo': field(form, 'pwr_field_uber').checked ? 'Sim' : 'Nao',
        '_subject': 'Nova cotacao de protecao veicular',
        '_template': 'table',
        '_replyto': email.value.trim(),
        '_url': 'https://consultordaprotecao.com.br/'
      };

      sendButton.disabled = true;
      sendButton.textContent = 'Enviando...';

      fetch(quoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(quoteData)
      })
        .then(function (response) {
          if (!response.ok) throw new Error('Nao foi possivel enviar a cotacao.');
          return response.json();
        })
        .then(function () {
          window.alert('Cotacao recebida! Em breve entraremos em contato.');
          form.querySelectorAll('input').forEach(function (input) {
            if (input.type === 'radio' || input.type === 'checkbox') {
              input.checked = false;
            } else {
              input.value = '';
            }
            input.classList.remove('input-true', 'required');
          });
          showStep(step1, step3);
        })
        .catch(function () {
          window.alert('Nao foi possivel enviar sua cotacao agora. Tente novamente ou fale conosco pelo WhatsApp.');
        })
        .then(function () {
          sendButton.disabled = false;
          sendButton.textContent = originalButtonText;
        });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.pwr_form').forEach(setupForm);

    document.querySelectorAll('[data-target="#cotation"]').forEach(function (button) {
      button.addEventListener('click', function (event) {
        event.preventDefault();
        var mainForm = document.querySelector('.banner .pwr_form');
        mainForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
        field(mainForm, 'pwr_field_name').focus({ preventScroll: true });
      });
    });
  });
}());
