"use strict";

let user_agent = navigator.userAgent;

if (user_agent.includes("Android") || (user_agent.includes("iOS") && !user_agent.includes("iPad")))
{
  large_icon.hidden = true;
  small_icon.hidden = false;
  menu_btns.hidden = true;
  install.disabled = false;
}

switch (window.location.protocol)
{
  case "http:":
  case "https:":
    menu_btns.hidden = true;
    break;
  case "file:":
    menu_btns.hidden = false;
    break;
  default:
    menu_btns.hidden = true;
    break;
}

const autosave_item = Object.freeze("OpenFusion_Autosave");

const default_bytecode = Object.freeze({
  "version": "0.0.1",
  "title": "OpenFusion Application",
  "width": 512,
  "height": 512,
  "color": "HEX::f0efe6",
  "script": "",
  "scenes": {},
  "objects": {},
});

let bytecode = Object.assign({}, default_bytecode);

window.onbeforeunload = function() {
  editor.hidden = true;
  menu.hidden = false;
  ret_menu.disabled = true;
  ret_editor.disabled = true;
  new_app.disabled = false;
  close_app.disabled = true;
  localStorage.setItem(autosave_item, JSON.stringify(bytecode));
};

install.onclick = function() {
  const useragent = navigator.userAgent;

  switch (true)
  {
    case useragent.includes("Android"):
      break;
    default:
      window.open("https://github.com/openfusion-engine/openfusion/archive/refs/heads/master.zip");
      break;
  }
};

ret_menu.onclick = function() {
  editor.hidden = true;
  menu.hidden = false;
  ret_menu.disabled = true;
  ret_editor.disabled = false;
};

ret_editor.onclick = function() {
  editor.hidden = false;
  menu.hidden = true;
  ret_menu.disabled = false;
  ret_editor.disabled = true;
};

new_app.onclick = function() {
  if (app_creation.hidden)
  { app_creation.hidden = false; } 
};

app_creation_form.onsubmit = function(event) {
  event.preventDefault();
  let form_data = Object.fromEntries(new FormData(app_creation_form));
  bytecode["title"] = form_data["app_name"];
  bytecode["width"] = parseInt(form_data["app_width"]);
  bytecode["height"] = parseInt(form_data["app_height"]);
  menu.hidden = true;
  editor.hidden = false;
  app_creation.hidden = true;
  new_app.disabled = true;
  ret_menu.disabled = false;
  ret_editor.disabled = true;
  close_app.disabled = false;
  parse_bytecode();
}

cancel_creation.onclick = function(event) {
  app_creation.hidden = true;
}

open_app.onclick = function() {
  file_input_app.click();
};

close_app.onclick = function() {
  const link = document.createElement("a");
  link.href = "data:text/javascript;";
  link.href += "charset=utf-8,";
  link.href += JSON.stringify(bytecode);
  link.download = bytecode["title"] + ".json";
  link.click();
  link.remove();

  bytecode = Object.assign({}, default_bytecode);
  editor.hidden = true;
  menu.hidden = false;
  ret_menu.disabled = true;
  ret_editor.disabled = true;
  close_app.disabled = true;
  new_app.disabled = false;
};

load_script.onclick = function() {
  file_input_script.click();
};

function parse_bytecode() {
  scene.style.width = bytecode["width"].toString() + "px";
  scene.style.height = bytecode["height"].toString() + "px";
  let color = bytecode["color"];
  
  switch (true)
  {
    case color.startsWith("HEX::"):
      color = color.replace("HEX::", "#");
      scene.style.backgroundColor = color;
      break;
    case color.startsWith("RGB::"):
      color = color.replace("RGB::", "");
      color = color.split(",");
      scene.style.backgroundColor = "rgb(" + color.join(", ") + ")";
      break;
    case color.startsWith("RGBA::"):
      color = color.replace("RGBA::", "");
      color = color.split(",");
      scene.style.backgroundColor = "rgba(" + color.join(", ") + ")";
      break;
  }
}

file_input_app.onchange = function(event) {
  if (file_input_app.files.length !== 1)
  { return; }

  const files = event.target.files;

  const reader = new FileReader();
  
  reader.onload = function() {
    try
    {
      bytecode = JSON.parse(reader.result);
      parse_bytecode();
    }
    catch
    { return; }
  };

  reader.onerror = function() {
    return;
  };

  reader.readAsText(files[0]);

  menu.hidden = true;
  editor.hidden = false;
  new_app.disabled = true;
  ret_menu.disabled = false;
  ret_editor.disabled = true;
  close_app.disabled = false; 
}

file_input_script.onchange = function(event) {
  if (file_input_script.files.length !== 1)
  { return; }

  const files = event.target.files;
  bytecode["script"] = files[0].name;
};
