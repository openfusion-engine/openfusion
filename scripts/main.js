"use strict";

let user_agent = navigator.userAgent;

if (user_agent.includes("Android") || (user_agent.includes("iOS") || user_agent.includes("iPad")))
{
  large_icon.hidden = true;
  small_icon.hidden = false;
  menu_btns.hidden = true;
  install.hidden = false;
  menu.style.borderColor = "rgba(0, 0, 0, 0)";
}

switch (window.location.protocol)
{
  case "http:":
  case "https:":
    main_btns.hidden = false;
    menu_btns.hidden = true;
    version.hidden = true;
    break;
  case "localhost:":
  case "file:":
    main_btns.hidden = true;
    menu_btns.hidden = false;
    current_version.hidden = false;
    break;
  default:
    main_btns.hidden = false;
    menu_btns.hidden = true;
    version.hidden = true;
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
  "scenes": [],
  "instances": [],
});

const default_instance = Object.freeze({
  "name": "Instance",
  "type": "",
});

const version = "0.0.2";
let bytecode = Object.assign({}, default_bytecode);
current_version.innerText = "(" + version + ")";

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
  bytecode["color"] = parseInt(form_data["app_background"]);
  menu.hidden = true;
  editor.hidden = false;
  app_creation.hidden = true;
  app_creation_form.reset();
  new_app.disabled = true;
  ret_menu.disabled = false;
  ret_editor.disabled = true;
  close_app.disabled = false;
  parse_bytecode();
}

cancel_app_creation.onclick = function(event) {
  app_creation.hidden = true;
  app_creation_form.reset();
}

open_app.onclick = function() {
  file_input_app.click();
};

close_app.onclick = function() {
  const link = document.createElement("a");
  link.href = "data:text/javascript;";
  link.href += "charset=utf-8,";
  link.href += JSON.stringify(bytecode);
  link.href = link.href.replaceAll("#", "%23");
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

build_app.onclick = function() {
  const link = document.createElement("a");
  link.href = "data:application/html;";
  link.href += "charset=utf-8,";
  link.href += "<!DOCTYPE html>\n";
  link.href += "<html>\n";
  link.href += "\t<head>\n";
  link.href += "\t\t<title>" + bytecode["title"] + "</title>\n";
  link.href += "\t\t<meta charset=\"utf-8\">\n";
  link.href += "\t\t<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n";
  link.href += "\t\t<style>\n";
  link.href += "\t\t\tbody {\n";
  link.href += "\t\t\t\tbackground-color: #222529;\n";
  link.href += "\t\t\t}\n";
  link.href += "\t\t\t#scene {\n";
  link.href += "\t\t\t\tposition: absolute;\n";
  link.href += "\t\t\t\ttop: 50%;\n";
  link.href += "\t\t\t\tleft: 50%;\n";
  link.href += "\t\t\t\ttransform: translate(-50%, -50%);\n";
  link.href += "\t\t\t\tbackground-color: " + parse_color(bytecode["color"]) + ";\n";
  link.href += "\t\t\t\tpadding: 12px;\n";
  link.href += "\t\t\t\tborder-radius: 12px;\n";
  link.href += "\t\t\t\twidth: " + bytecode["width"] + "px;\n";
  link.href += "\t\t\t\theight: " + bytecode["height"] + "px;\n";
  link.href += "\t\t\t}\n";
  link.href += "\t\t\t#scene * {\n";
  link.href += "\t\t\t\tposition: absolute;\n";
  link.href += "\t\t\t}\n";
  link.href += "\t\t</style>\n";
  link.href += "\t</head>\n";
  link.href += "\t<body>\n";
  link.href += "\t\t<div id=\"scene\">\n";

  for (let i = 0; i < bytecode["instances"].length; i++)
  {
    const instance = bytecode["instances"][i];
    switch (instance["type"])
    {
      case "active":
        link.href += "<img id=\"" + instance["name"] + "\">\n";
        break;
      case "string":
        link.href += "<span id=\"" + instance["name"] + "\"></span>\n";
        break;
      case "counter":
        link.href += "<span id=\"" + instance["name"] + "\"></span>\n";
        break;
    }
  }

  link.href += "\t\t</div>\n";
  link.href += "\t</body>\n";
  link.href += "\t<script src=\"" + bytecode["script"] + "\"></script>";
  link.href += "\t<noscript>\n"
  link.href += "\t\t<span>JavaScript is required to run this application.</span>\n"
  link.href += "\t</noscript>\n";
  link.href += "</html>\n";
  link.href = link.href.replaceAll("#", "%23");
  link.download = bytecode["title"] + ".html";
  link.click();
  link.remove();
}

load_script.onclick = function() {
  file_input_script.click();
};

new_instance.onclick = function() {
  if (instance_creation.hidden)
  { instance_creation.hidden = false; }
}

instance_creation_form.onsubmit = function(event) {
  event.preventDefault();
  let form_data = Object.fromEntries(new FormData(instance_creation_form));

  if (form_data["instance_name"] === "" || form_data["instance_type"] === "")
  { return; }

  for (let i = 0; i < bytecode["instances"].length; i++)
  {
    if (bytecode["instances"][i].name === form_data["instance_name"])
    { return; }

    continue;
  }

  const instance = Object.assign({}, default_instance);
  instance["name"] = form_data["instance_name"];
  instance["type"] = form_data["instance_type"];
  bytecode["instances"].push(instance);
  instance_creation.hidden = true;
  instance_creation_form.reset();
  const instance_child = document.createElement("span");
  instance_child.innerText = instance["name"] + " [";
  instance_child.innerText += instance["type"].charAt(0).toUpperCase();
  instance_child.innerText += instance["type"].substr(1, instance["type"].length);
  instance_child.innerText += "]";
  instances.append(instance_child);
  instances.append(document.createElement("hr"));
}

cancel_instance_creation.onclick = function() {
  instance_creation.hidden = true;
  instance_creation_form.reset();
}

function parse_bytecode() { 
  scene.style.width = bytecode["width"].toString() + "px";
  scene.style.height = bytecode["height"].toString() + "px";

  for (let i = 0; i < bytecode["instances"]; i++)
  {
    const instance_child = document.createElement("span");
    instance_child.innerText = instances[i]["name"];
    instances.append(instance_child);
    instances.append(document.createElement("hr"));
  }

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

  for (let i = 0; i < bytecode["instances"].length; i++)
  {
    const instance = bytecode["instances"][i];
    const instance_child = document.createElement("span");
    instance_child.innerText = instance["name"] + " [";
    instance_child.innerText += instance["type"].charAt(0).toUpperCase();
    instance_child.innerText += instance["type"].substr(1, instance["type"].length);
    instance_child.innerText += "]";
    instances.append(instance_child);
    instances.append(document.createElement("hr"));
  }
}

function parse_color(color) {
  if (typeof(color) !== "string")
  { return ""; }

  switch (true)
  {
    case color.startsWith("HEX::"):
      color = color.replace("HEX::", "#");
      break;
    case color.startsWith("RGB::"):
      color = color.replace("RGB::", "");
      color = color.split(",");
      color = "rgb(" + color.join(", ") + ")";
      break;
    case color.startsWith("RGBA::"):
      color = color.replace("RGBA::", "");
      color = color.split(",");
      color = "rgba(" + color.join(", ") + ")";
      break;
  }

  return color;
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
      
      switch (true)
      {
        case typeof(bytecode.version) !== "string":
        case typeof(bytecode.title) !== "string":
        case typeof(bytecode.width) !== "number":
        case typeof(bytecode.height) !== "number":
        case typeof(bytecode.color) !== "string":
        case typeof(bytecode.script) !== "string":
        case typeof(bytecode.scenes) !== "object":
        case typeof(bytecode.instances) !== "object":
        case bytecode.version !== version:
          throw new Error();
      }
      
      parse_bytecode();
      menu.hidden = true;
      editor.hidden = false;
      new_app.disabled = true;
      ret_menu.disabled = false;
      ret_editor.disabled = true;
      close_app.disabled = false;
    }
    catch
    { return; }
  };

  reader.onerror = function() {
    return;
  };

  reader.readAsText(files[0]); 
}

file_input_script.onchange = function(event) {
  if (file_input_script.files.length !== 1)
  { return; }

  const files = event.target.files;
  bytecode["script"] = files[0].name;
};

color_selector.onchange = function(event) {
  const color = event.target.value;
  scene.style.backgroundColor = color;
  bytecode["color"] = "HEX::" + color.substr(1, color.length);
}

modify_metadata.onclick = function(event) {
  if (metadata_modification.hidden)
  { metadata_modification.hidden = false; }
}

metadata_modification_form.onsubmit = function(event) {
  event.preventDefault();
  let form_data = Object.fromEntries(new FormData(app_creation_form));
  bytecode["title"] = form_data["app_name"];
  bytecode["width"] = parseInt(form_data["app_width"]);
  bytecode["height"] = parseInt(form_data["app_height"]);
  const color = form_data["app_background"];
  bytecode["color"] = "HEX::" + color.substr(1, color.length);
  metadata_modification_form.hidden = true;
  metadata_modification_form.reset();
  parse_bytecode();
}

cancel_metadata_modification.onclick = function() {
  metadata_modification.hidden = true;
  metadata_modification_form.reset();
}
