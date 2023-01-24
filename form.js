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
"use strict";
var slurm_limits = {};
var slurm_assoc_limits = {};
var slurm_submits = {};
var partition_override = "";

// Regex for dd-hh:mm:ss
// Currently allows values with e.g. seconds > 60
const TIME_REGEX = /^(?:(?:(?:(\d+)-)?(\d+):)?(\d+):)?(\d+)$/;

// Prefix for all form elements used by OOD
const BC_PREFIX = "batch_connect_session_context";

(function () {
  // Populate slurm_limits object with the limits
  const limits_input = $(`#${BC_PREFIX}_csc_slurm_limits`);
  slurm_limits = limits_input.data("limits") || {};
  slurm_assoc_limits = limits_input.data("assoc-limits") || {};
  const submits = limits_input.data("submits") || [];
  partition_override = limits_input.data("partition") || "";
  setup_form();

  save_original_limits();

  slurm_submits = count_running_resources(submits);

  // Register event handlers
  register_event_handlers();
  update_min_max(false);
})();

$(window).on("load", function () {
  setTimeout(validate_form, 100);
});

// Disable launch button disabling and validation of form
function setup_form() {
  const form = get_form();
  form.attr("novalidate", "")
  form.find(':submit').removeAttr('data-disable-with');
  form.submit(handle_submit);
}

// Store original min and max from form.yml to use when slurm limit is not defined
function save_original_limits() {
  const elements = get_inputs();
  elements.each((i, el) => {
    $(el).data("orig-min", $(el).attr("min"));
    $(el).data("orig-max", $(el).attr("max"));
  });
}

// Validate inputs and check submits on form changes
function register_event_handlers() {
  const part_input = get_partition_input();
  part_input.change(part_proj_change);
  const project_input = get_project_input();
  project_input.change(part_proj_change);

  const elements = get_inputs();
  elements.each((i, el) => {
    $(el).on("input propertychange", (ev) => validate_input($(ev.currentTarget)));
  });
}

function count_running_resources(submits) {
  const jobs = {
    "partition": {},
    "project": {},
    "numjobs": {}
  };
  if (submits == null) {
    return jobs;
  }
  for (const job of submits) {
    for (const [res, value] of Object.entries(job["tres"])) {
      if (job["state"] !== "R") {
        continue;
      }
      jobs["partition"][job["part"]] = jobs["partition"][job["part"]] || {};
      jobs["project"][job["acc"]] = jobs["project"][job["acc"]] || {};

      if (res in jobs["partition"][job["part"]]) {
        jobs["partition"][job["part"]][res] += value;
      } else {
        jobs["partition"][job["part"]][res] = value;
      }

      if (res in jobs["project"][job["acc"]]) {
        jobs["project"][job["acc"]][res] += value;
      } else {
        jobs["project"][job["acc"]][res] = value;
      }
    }
    const key = `${job["acc"]}_${job["part"]}`;
    if (key in jobs["numjobs"]) {
      jobs["numjobs"][key] += 1;
    } else {
      jobs["numjobs"][key] = 1;
    }
  }
  return jobs;
}

function part_proj_change() {
  // Need a short delay to let the normal OOD change handler run first. This is needed when
  // changing to a project that doesn't have access to the currently selected project
  setTimeout(update_min_max, 50);
}

function get_form() {
  return $(`#new_${BC_PREFIX}`);
}

// Get all number and text inputs
function get_inputs() {
  return get_form().find("input[type=number],input[type=text]");
}

function get_partition_input() {
  return $(`#${BC_PREFIX}_csc_slurm_partition`);
}

function get_project_input() {
  return $(`#${BC_PREFIX}_csc_slurm_project`);
}

// Get the limits for the currently selected partition
function get_current_limits() {
  const part = get_partition();
  return slurm_limits[part] || {};
}

// Gets the currently selected node type as a string
function get_partition() {
  if (partition_override) {
    return partition_override;
  }
  const part_input = get_partition_input();
  const part = part_input.val();
  return part;
}

function get_project() {
  const proj_input = get_project_input();
  const proj = proj_input.val();
  return proj;
}

// Ask user to submit if form has invalid data, otherwise just submit
function handle_submit(ev) {
  ev.preventDefault()

  validate_form();
  const valid = !ev.currentTarget.checkValidity || ev.currentTarget.checkValidity();
  if (valid) {
    submit_form();
  } else {
    show_confirm_modal("Form invalid", "The form contains invalid parameters. Are you sure you want to launch the application?", submit_form, "Launch");
    get_form()[0].reportValidity();
  }
}

// Actually submit the form bypassing the jQuery handler
function submit_form() {
  const form = get_form();
  form.find(':submit').prop('disabled', true);
  form[0].submit();
}

function update_min_max(validate = true) {
  const inputs = get_inputs();
  inputs.each((i, inp) => update_input($(inp)));
  if (validate) {
    validate_form();
  }
}

// Get the custom limits defined for the element (partition limit if defined, otherwise global or undefined)
function get_custom_limits(el) {
  const partition = get_partition_input().val();
  const partMin = el.attr(`min-${partition}`);
  const partMax = el.attr(`max-${partition}`);
  const origMin = el.data("orig-min");
  const origMax = el.data("orig-max");

  const min = partMin != null ? partMin : origMin;
  const max = partMax != null ? partMax : origMax;
  return [min, max];
}

// Update the min and max attributes of an input elements
function update_input(el) {
  // Use data-min and data-max to determine which slurm limit value to use
  const min = el.data("min");
  const max = el.data("max");

  const [customMin, customMax] = get_custom_limits(el);

  const parse = element_parse_function(el);

  const limits = get_current_limits();
  if (min != null || customMin != null) {
    let [limit, used, type] = get_limit(limits, min);
    if (customMin != null && (limit == null || parse(customMin) < parse(limit))) {
        limit = customMin;
        used = 0;
        type = "custom";
    }
    if (limit == null) {
      el.removeAttr("min");
      el.removeData("used");
      el.removeData("limit-type-min");
    } else {
      el.attr("min", limit);
      el.data("used", used);
      el.data("limit-type-min", type);
    }
  }
  if (max != null || customMax != null) {
    let [limit, used, type] = get_limit(limits, max);
    if (customMax != null && (limit == null || parse(customMax) < parse(limit))) {
        limit = customMax;
        used = 0;
        type = "custom";
    }
    if (limit == null) {
      el.removeAttr("max");
      el.removeData("used");
      el.removeData("limit-type-max");
    } else {
      el.attr("max", limit);
      el.data("used", used);
      el.data("limit-type-max", type);
    }
  }
}

function get_limit(limits, name) {
  let limit = limits[name];
  let limit_type = "";
  let used = 0;

  if (limit == null) {
    return [null, 0, ""];
  }

  const qos = limits["qos"] || {};
  if (Object.keys(qos).length === 0) {
    return [limit, 0, ""];
  }

  const maxtres = qos["maxtres"];
  if (name in maxtres) {
    if (maxtres[name] < limit) {
      limit = maxtres[name];
      limit_type = "job";
    }
  }

  const maxtrespa = qos["maxtrespa"];
  if (name in maxtrespa) {
    const proj_jobs = slurm_submits["project"][get_project()] || {};
    const proj_used = proj_jobs[name] || 0;
    if (maxtrespa[name] - proj_used < limit) {
      limit = maxtrespa[name]- proj_used;
      used = proj_used;
      limit_type = "project";
    }
  }

  const maxtrespu = qos["maxtrespu"];
  if (name in maxtrespu) {
    const part_jobs = slurm_submits["partition"][get_partition()] || {};
    const part_used = part_jobs[name] || 0;
    if (maxtrespu[name] - part_used < limit) {
      limit = maxtrespu[name] - part_used;
      used = part_used;
      limit_type = "user";
    }
  }
  return [limit, used, limit_type];
}

// Set the custom validity on a jQuery element, returns false if element didn't exist
function setValidity(jqEl, msg) {
  if (jqEl[0] == null) {
    return false;
  }
  jqEl[0].setCustomValidity(msg);
  return true;
}

// Check amount of submits by project and partition in the queue
function check_submits() {
  if (slurm_submits == null || slurm_assoc_limits == null) {
    return;
  }
  const part_input = get_partition_input();
  const proj_input = get_project_input();
  const partition = part_input.val() || partition_override;
  const project = proj_input.val();
  const proj_part = `${project}_${partition}`;
  const submits = slurm_submits["numjobs"][proj_part] || 0;
  const assoc_limits = slurm_assoc_limits[proj_part];
  if (assoc_limits == null || assoc_limits["maxsubmit"] == null)
    return;
  const maxsubmit = assoc_limits["maxsubmit"];

  setValidity(proj_input, "");
  setValidity(part_input, "");
  if (maxsubmit === 0) {
    setValidity(proj_input, "Project has no BU left");
  } else if (submits >= maxsubmit) {
    const msg = `${project} already has ${submits} job${submits > 1 ? "s" : ""} out of maximum ${maxsubmit} in the ${partition} queue`;
    // Attach message to project dropdown if partition dropdown is missing
    if (!setValidity(part_input, msg)) {
      setValidity(proj_input, msg);
    }
  }

  if (proj_input[0] != null) {
    proj_input[0].reportValidity();
  }
  if (part_input[0] != null) {
    part_input[0].reportValidity();
  }
  return false;
}

// Check validity of all inputs in the form
function validate_form() {
  check_submits();
  const elements = get_inputs();
  elements.each((i, el) => {
    validate_input($(el));
  });
}

// Convert number fields to int, time to int (seconds), use strings for the rest
// Returns a function for parsing the field
function element_parse_function(el) {
  if (el.attr("type") === "number") {
    return parseInt;
  } else if (el.data("type") === `time`) {
    return parse_time;
  } else {
    return (v) => v;
  }
}

// Check the validity of an input element
function validate_input(el) {
  if (!(el.attr("type") === "number" || el.attr("type") === "text")) {
    return;
  }
  // Values as strings, keep as is for formatting output
  const min = el.attr("min");
  const max = el.attr("max");
  const val = el.val();

  const parse = element_parse_function(el);

  const n_min = parse(min);
  const n_max = parse(max);
  const n_val = parse(val);

  if (min != null && n_val < n_min) {
    const limit_type = el.data("limit-type-min");
    setValidity(el, `Value is less than the minimum ${limit_type == "custom" ? "allowed" : "for partition" } (${min})`);
  } else if (max != null && n_val > n_max) {
    const used = el.data("used") || 0;
    const limit_type = el.data("limit-type-max");
    const used_message = used > 0 ? `${used} used out of maximum ${n_max+used} per ${limit_type}` : `${max}`;
    setValidity(el, `Value exceeds the maximum ${limit_type == "custom" ? "allowed" : "for partition" } (${used_message})`);
    el.css('color', 'red');
    if ( el.parent()[0].childNodes[0].innerHTML.slice(-1) != "❗" ){
        el.parent()[0].childNodes[0].innerHTML = el.parent()[0].childNodes[0].innerHTML + '❗'
    }
  } else {
    // Input element value ok (pattern/format is checked automatically)
    setValidity(el, "");
    el.parent()[0].childNodes[0].innerHTML = el.parent()[0].childNodes[0].innerHTML
    el.css('color', 'black');
    if ( el.parent()[0].childNodes[0].innerHTML.slice(-1) == "❗" ){
     el.parent()[0].childNodes[0].innerHTML = el.parent()[0].childNodes[0].innerHTML.slice(0,-1) 
    }
  }
  el[0].reportValidity();
  return false;
}

// Return the time as seconds
function parse_time(time_str) {
  if (time_str == null) {
    return 0;
  }
  const match = time_str.match(TIME_REGEX);
  if (match == null)
    return 0;

  // Drop full match, convert match groups to ints
  const [d, h, m, s] = match.slice(1).map((e) => parseInt(e) || 0);

  // Time as seconds
  return d * 24 * 60 * 60 + h * 60 * 60 + m * 60 + s;
}

// Show the Bootstrap modal for confirming submit
function show_confirm_modal(title, text, callback, confirmText = "OK", cancelText = "close") {
  // HTML for the modal dialog
  const modal_html = `
  <div class="modal-dialog" role="document">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">${title}</h5>
        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <div class="modal-body">
        <p>${text}</p>
      </div>
      <div class="modal-footer">
        <button type="button" id="confirmButton" class="btn btn-primary">${confirmText}</button>
        <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
      </div>
    </div>
  </div>`

  let modal = $('#confirmModal');
  if (!modal.length) {
    $('body').append('<div class="modal" tabindex="-1" role="dialog" id="confirmModal"></div>');
    modal = $('#confirmModal');
  }
  modal.html(modal_html);
  modal.find('#confirmButton').on("click", callback);
  modal.modal("show");
}


// Reset defaults button

(function () {
  const reset_cache_field = $("#batch_connect_session_context_csc_reset_cache");
  if (reset_cache_field.length == 0) {
    return;
  }
  const form = reset_cache_field.parent();
  const reset_button = document.createElement("button");
  reset_button.className = "btn btn-secondary btn-block";
  reset_button.appendChild(document.createTextNode("Reset to default settings"));
  form.append(reset_button);
  $(reset_button).click(function(e) {
    e.preventDefault();
    const cache_file = reset_cache_field.data("app");
    deleteCache(cache_file);
  });
})();

function deleteCache(cache_file) {
  if (cache_file == null) {
    console.warn("No app specified for reset form button");
    return;
  }
  $.ajax({url: "/pun/sys/dashboard/transfers.json",
    type: "POST",
    contentType: "text/plain",
    data: JSON.stringify({"command": "rm", "files": [cache_file]}),
    success: () => {window.location.reload()}
  });
}
