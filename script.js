$(document).ready(function () {
  // Checkboxes dont support setting wrapper class
  const user_sites_checkbox = $("#batch_connect_session_context_python_no_user_site");
  user_sites_checkbox.parent().parent().addClass("advanced");

  const system_site_packages_checkbox = $("#batch_connect_session_context_venv_system_site_packages");
  system_site_packages_checkbox.parent().parent().addClass("advanced");

  const show_advanced = $("#batch_connect_session_context_advanced");

  show_advanced.change(update_advanced);
  update_advanced();

  const venv = $("#batch_connect_session_context_venv");
  if (venv) {
    venv.change(validate_venv);
  }
});

function update_advanced() {
  const show_advanced = $("#batch_connect_session_context_advanced");

  const show = show_advanced.prop("checked");

  const advanced_fields = $(".advanced");
  advanced_fields.each( function () {
    if (show) {
      $(this).show();
    }
    else {
      $(this).hide();
    }
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
        venv[0].setCustomValidity("Directory does not seem to be a valid virtual environment")
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
