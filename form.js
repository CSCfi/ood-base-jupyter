(function () {

  // Hide custom python module field when custom is not selected
  const python_module = $("#batch_connect_session_context_python_module");
  python_module.change(update_custom_module);
  update_custom_module();

  const show_advanced = $("#batch_connect_session_context_advanced");

  show_advanced.change(update_advanced);
  update_advanced();
  const venv = $("#batch_connect_session_context_venv");
  venv.change(validate_venv);

})();

function update_advanced() {

  const show_advanced = $("#batch_connect_session_context_advanced");
  
  const show = show_advanced.prop("checked");
  update_visibility(".advanced", show);
  const basic = $("#batch_connect_session_context_basic")
  update_visibility(".basic", !show);
  const custom_init = $("#batch_connect_session_context_env_script");
  custom_init[0].selectedIndex = 0;
  custom_init[0].dispatchEvent( new Event("change"));
  const python_module = $("#batch_connect_session_context_python_module");
  python_module[0].selectedIndex = 0;
  python_module[0].dispatchEvent( new Event("change"));

}

function update_custom_module() {
  const python_module = $("#batch_connect_session_context_python_module").val();
  update_visibility(".custom_module", python_module === "Custom");
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
