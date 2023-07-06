(function () {

  // Checkboxes don't support wrapper in bootstrap_form, use data-class for propagating from form.
  $('[data-class="basic"').each(function() {
    $(this).closest(".form-group").addClass("basic");
  });

  const show_advanced = $("#batch_connect_session_context_advanced");
  show_advanced.change(update_advanced);
  update_advanced();
  const venv = $("#batch_connect_session_context_venv");
  venv.change(validate_venv);

})();

function update_advanced() {

  const show_advanced = $("#batch_connect_session_context_advanced").prop("checked");
  update_visibility(".advanced", show_advanced);
  update_visibility(".basic", !show_advanced);
}

function update_visibility(selector, show) {
  const fields = $(selector);
  fields.each( function () {
    // Use class d-none to not conflict with OOD_BC_DYNAMIC_JS (which toggles display: none);
    $(this).toggleClass("d-none", !show);
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
