$(document).ready(function () {
  // Checkboxes dont support setting wrapper class
  const user_sites_checkbox = $("#batch_connect_session_context_python_no_user_site");
  user_sites_checkbox.parent().parent().addClass("advanced env-vars");

  const system_site_packages_checkbox = $("#batch_connect_session_context_venv_system_site_packages");
  system_site_packages_checkbox.parent().parent().addClass("advanced venv");

  const show_advanced = $("#batch_connect_session_context_advanced");

  show_advanced.change(update_advanced);
  update_advanced();

  const custom_env = $("#batch_connect_session_context_custom_environment");
  custom_env.change(update_advanced);

  const venv = $("#batch_connect_session_context_venv");
  venv.change(validate_venv);
});

function update_advanced() {
  const show_advanced = $("#batch_connect_session_context_advanced");

  const show = show_advanced.prop("checked");

  update_visibility(".advanced", show);

  const custom_env = $("#batch_connect_session_context_custom_environment").val();
  update_visibility(".env-vars", show && custom_env == "env_vars");
  update_visibility(".venv", show && custom_env == "venv");
}

function update_visibility(selector, show) {
  const fields = $(selector);
  fields.each( function () {
    $(this).toggle(!!show);
  });

}

function validate_venv() {
  const venv = $("#batch_connect_session_context_venv");
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
