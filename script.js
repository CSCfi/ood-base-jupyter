(function () {

  // Hide custom python module field when custom is not selected
  const python_module = $("#batch_connect_session_context_python_module");
  python_module.change(update_custom);
  update_custom();

  // Checkboxes dont support setting wrapper class
  const user_sites_checkbox = $("#batch_connect_session_context_python_user_site");
  user_sites_checkbox.parent().parent().addClass("advanced");

  const venv_checkbox = $("#batch_connect_session_context_enable_venv");
  venv_checkbox.parent().parent().addClass("advanced");

  const show_advanced = $("#batch_connect_session_context_advanced");

  show_advanced.change(update_advanced);
  venv_checkbox.change(update_advanced);
  user_sites_checkbox.change(update_advanced);
  update_advanced();

  const venv = $("#batch_connect_session_context_venv");
  venv.change(validate_venv);
  venv_checkbox.change(validate_venv);
})();

function update_advanced() {
  const show_advanced = $("#batch_connect_session_context_advanced");

  const show = show_advanced.prop("checked");

  update_visibility(".advanced", show);

  const venv = $("#batch_connect_session_context_enable_venv").prop("checked");
  update_visibility(".venv", show && venv);

  const user_packages_enabled = $("#batch_connect_session_context_python_user_site").prop("checked");
  update_visibility(".user_packages_field", show && user_packages_enabled);

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
  const venv_enabled = $("#batch_connect_session_context_enable_venv").prop("checked");
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
