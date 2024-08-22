(function () {

  // Hide custom python module field when custom is not selected
  const python_module = $("#batch_connect_session_context_python_module");
  python_module.change(update_custom);
  update_custom();

  setup_extra_packages_field();

  const show_advanced = $("#batch_connect_session_context_advanced");

  show_advanced.change(update_advanced);
  update_advanced();

  const venv = $("#batch_connect_session_context_venv");
  venv.change(validate_venv);
  $("#batch_connect_session_context_extra_packages_venv").change(validate_venv);
})();

function setup_extra_packages_field() {
  const label = $('label[for="batch_connect_session_context_extra_packages"]');
  const form_group = label.parent();
  const inputs = form_group.find("input[type=radio]");
  const divs = inputs.parent();
  // Style radio buttons into nav-pills style
  label.css("flex", "0 0 100%");
  form_group.addClass("nav-pills user-select-none").css("display", "flex").css("flex-wrap", "wrap");
  form_group.parent().addClass("advanced");
  inputs.css("opacity", "0");
  divs.removeClass("form-check").addClass("nav-link");
  const pill_div = $("<div></div>").css("display", "flex").css("flex-wrap", "nowrap");
  pill_div.append(divs);
  form_group.append(pill_div);

  pill_div.find(".form-check-label").css("height", "100%");

  inputs.change(function() {
    const input = $(this);
    const all = input.closest(".form-group");
    all.find(".active").removeClass("active");
    input.parent().addClass("active");
    $(".venv").toggleClass("d-none", !(this.value === "venv"));
    $(".user_packages_field").toggleClass("d-none", !(this.value === "user_packages"));
  });

  form_group.find("input:checked").trigger("change");
}

function update_advanced() {
  const show_advanced = $("#batch_connect_session_context_advanced");

  const show = show_advanced.prop("checked");

  update_visibility(".advanced", show);
}

function update_custom(){
  update_custom_module()
  update_custom_path()
}
function update_custom_module() {
  const python_module = $("#batch_connect_session_context_python_module").val();
  update_visibility(".custom_module", python_module === "Custom");
}
function update_custom_path() {
  const python_module = $("#batch_connect_session_context_python_module").val();
  update_visibility(".custom_path", python_module === "CustomPath");
}

function update_visibility(selector, show) {
  const fields = $(selector);
  fields.each( function () {
    $(this).toggle(!!show);
  });

}

function validate_venv() {
  const venv = $("#batch_connect_session_context_venv");
  const venv_enabled = $('input[name="batch_connect_session_context[extra_packages]"]:checked').val() == "venv";
  if (!venv_enabled) {
    venv[0].setCustomValidity("");
    venv[0].reportValidity();
    return;
  }
  if (venv.length) {
    check_venv(venv.val(),
      () => {
        venv[0].setCustomValidity("");
        venv[0].reportValidity();
      },
      () => {
        venv[0].setCustomValidity("Directory does not seem to be a valid virtual environment, a new virtual environment will be created")
        venv[0].reportValidity();
      }
    );
  }
}

function check_venv(venv, callback_valid, callback_invalid) {
  if (!venv.length) {
    callback_valid();
    return;
  }
  const basePath = "/pun/sys/dashboard/files/fs";
  const file = (`${basePath}${venv}/bin/activate`);
  $.get(file)
    .done(function(data, statusText, xhr) {
      const valid = data.includes("# This file must be used with \"source bin/activate\"");
      if (valid) {
        callback_valid();
      }
      else {
        callback_invalid();
      }
    })
    .fail(callback_invalid);

}
