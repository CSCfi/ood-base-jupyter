(function () {
  create_tabs();

  const show_advanced = $("#batch_connect_session_context_advanced");
  show_advanced.change(update_advanced);
  update_advanced();
  const venv = $("#batch_connect_session_context_venv");
  venv.change(validate_venv);
})();

function update_advanced() {
  const show_advanced = $("#batch_connect_session_context_advanced").prop("checked");

  $("#basic_tab_link").toggleClass("active", !show_advanced);
  $("#advanced_tab_link").toggleClass("active", show_advanced);

  update_visibility(".advanced", show_advanced);
  update_visibility(".basic", !show_advanced);
}

function create_tabs() {
  const advanced_checkbox = $("#batch_connect_session_context_advanced");

  // Create basic tab with all .basic form elements and button for it.
  const basic_form_groups = $(".basic").closest(".form-group");
  const basic_tab = $("<div></div>", { "class": "basic" });
  const basic_option = $("<li></li>", { "class": "nav-item" });
  const basic_link = $("<a></a>", { "id": "basic_tab_link", "class": "nav-link" })
    .text("Basic")
    .on("click", () => advanced_checkbox.prop("checked", false).change());
  basic_option.append(basic_link);
  basic_tab.append(basic_form_groups);

  // Create advanced tab with all .advanced form elements and button for it.
  const advanced_form_groups = $(".advanced").closest(".form-group");
  const advanced_tab = $("<div></div>", { "class": "advanced" });
  const advanced_option = $("<li></li>", { "class": "nav-item" });
  const advanced_link = $("<a></a>", { "id": "advanced_tab_link", "class": "nav-link" })
    .text("Advanced")
    .on("click", () => advanced_checkbox.prop("checked", true).change());
  advanced_option.append(advanced_link);
  advanced_tab.append(advanced_form_groups);

  // Create add the buttons for switching tab where the advanced checkbox is.
  const nav_pills = $("<ul></ul>", {"class": "nav nav-pills mb-3 user-select-none", "css": {"width": "fit-content"}});
  nav_pills.append(basic_option);
  nav_pills.append(advanced_option);
  advanced_checkbox.closest(".form-group").after(nav_pills, basic_tab, advanced_tab);
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
