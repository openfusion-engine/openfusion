"use strict";

const fs = require("node:fs");
const argv = Object.freeze(process.argv);
const illegal_keywords = "@%^&*()|[{}];:',<.>/?";
const version = "0.0.2";
let compiled = String();
let original = String();
let module_from = "";
let _module = Object();
let export_to = "";
let import_froms = Array();
let parsed_moduleFrom = false;
let parsed_exportTo = false;
let added_interval = false;
let parsing_when = false;
let when_is_loaded = false;
let when_is_loadeds = 0;

if (argv.length == 2) {
  console.log("Dwarf language compiler (v" + version + ")");
  process.exit(0);
}

function split_tokens(tokens, i) {
  if (typeof(tokens) !== "object")
  {
    console.error("Variable \"tokens\" is not an object.");
    process.exit(1);
  }

  if (typeof(i) !== "number")
  {
    console.error("Variable \"i\" is not a number.");
    process.exit(1);
  }

  if (tokens.length === 0 && tokens[0] === "")
  { return []; }

  while (tokens[0] === "")
  { tokens.splice(0, 1); }

  for (let j = 0; j < tokens.length; j++)
  {
    for (let k = 0; k < illegal_keywords.length; k++)
    {
      if (tokens[j] !== illegal_keywords[k])
      { continue; }

      console.error("Line: '" + original + "'", "contains illegal keyword \"" + illegal_keywords[k] + "\".");
      process.exit(1);
    }
    
    if (tokens[j].startsWith("\"") && !tokens[j].endsWith("\""))
    {
      for (let l = j + 1; l < tokens.length; l++)
      {
        if (tokens[l][tokens[l].length - 1] !== "\"")
        {
          tokens[j] += tokens[l];
          tokens.splice(l, 1);
        }

        tokens[j] += tokens[l];
        tokens.splice(l, 1);
        break;
      }

      if (!tokens[j].endsWith("\""))
      {
        console.error("Line: '" + original + "'", "string is not terminated in the correct way.");
        process.exit(1);
      }
    }
  }

  return tokens;
}

function split_seperators(tokens, lines, i) {
  if (typeof(tokens) !== "object")
  {
    console.error("Variable \"tokens\" is not an object.");
    process.exit(1);
  }

  if (typeof(lines) !== "object")
  {
    console.error("Variable \"lines\" is not an object.");
    process.exit(1);
  }

  if (typeof(i) !== "number")
  {
    console.error("Variable \"i\" is not a number.");
    process.exit(1);
  }

  if (i % 1 !== 0)
  {
    console.error("Variable \"i\" is not a number.");
    process.exit(1);
  }

  while (tokens.includes("\\"))
  {
    const index = tokens.indexOf(
      tokens.find(element => element.startsWith("\\"))
    );

    let leftovers = Array(tokens);
    leftovers.splice(0, index + 1);
    tokens.splice(index);
    
    if (leftovers.length !== 0)
    {
      leftovers = split_string(leftovers);
      tokens.push(leftovers[0]);
    }

    i++;
    let next_tokens = lines[i].split(" ");
    next_tokens = split_tokens(next_tokens, i);
    
    for (let j = 0; j < next_tokens.length; j++)
    { tokens.push(next_tokens[j]); }
  }

  return tokens;
}

function check_string(token) {
  if (typeof(token) !== "string")
  { return false; }

  if (token.startsWith("\"") && token.endsWith("\""))
  { return true; }

  return false;
}

function check_number(token) {
  if (typeof(token) !== "string")
  { return false; }

  if (isNaN(parseInt(token)))
  { return false; }

  return true;
}

function check_instance(token) {
  if (typeof(token) !== "string")
  { return false; }

  if (token.startsWith("$"))
  { return true; }

  return false;
}

function check_type(token) {
  if (typeof(token) !== "string")
  { return false; }

  switch (token)
  {
    case "string":
    case "counter":
    case "active":
    case "backdrop":
      return true;
  }

  return false;
}

function parse_condition(line, tokens)
{
  if (typeof(line) !== "string")
  {
    console.error("Variable \"line\" is not an string.");
    process.exit(1);
  }

  if (typeof(tokens) !== "object")
  {
    console.error("Variable \"tokens\" is not an object.");
    process.exit(1);
  }

  switch (tokens[1])
  {
    case "LOADED":
      line += "loaded";
      break;
    case "HOVER":
      if (!check_instance(tokens[2]))
      {
        console.error("Line \"" + original + "\"", "expected instance name.");
        process.exit(1);
      }
      
      tokens[2] = tokens[2].substr(1, tokens[2].length);
      line += tokens[2];
      line += ".matches(\":hover\")";
      break;
    default:
      console.error("Line: '" + original + "'", "expected instance name or action.");
      process.exit(1);
  }

  return line;
}

function check_action(token) {
  if (typeof(token) !== "string")
  { return false; }

  switch (token)
  {
    case "HOVER":
    case "CLICK":
      return true;
  }

  return false;
}

function process_tokens(tokens) {
  if (typeof(tokens) !== "object")
  {
    console.error("Variable \"tokens\" is not an object.");
    process.exit(1);
  }

  if (typeof(module_from) !== "string")
  {
    console.error("Variable \"module_from\" is not a string.");
    process.exit(1);
  }

  if (typeof(export_to) !== "string")
  {
    console.error("Variable \"export_to\" is not a string.");
    process.exit(1);
  }

  if (parsed_moduleFrom && parsed_exportTo && !added_interval)
  {
    added_interval = true;
    compiled += "setInterval(function() {\n";
  }

  original = tokens.join(" ");
  let line = String();

  switch (tokens[0])
  {
    case "moduleFrom":
      if (tokens.length < 2)
      {
        console.error("Line: '" + original + "'", "too few arguments.");
        process.exit(1);
      }

      if (tokens.length > 2)
      {
        console.error("Line: '" + original + "'", "too many arguments.");
        process.exit(1);
      }

      if (!check_string(tokens[1]))
      {
        console.error("Line: '" + original + "'", "argument is not a string.");
        process.exit(1);
      }

      if (module_from !== "")
      {
        console.error("Line: '" + original + "'", "cannot use \"moduleFrom\" more than once.");
        process.exit(1);
      }

      tokens[1] = tokens[1].substr(1, tokens[1].length - 2);

      if (!fs.existsSync(tokens[1]))
      {
        console.error("Line: '" + original + "'", "cannot find the module.");
        process.exit(1);
      }

      let module_data = fs.readFileSync(tokens[1]);
      _module = JSON.parse(module_data.toString());

      if (typeof(_module.version) !== "string")
      {
        console.error("Line: '" + original + "'", "invalid module structure.");
        process.exit(1);
      }

      if (typeof(_module.title) !== "string")
      {
        console.error("Line: '" + original + "'", "invalid module structure.");
        process.exit(1);
      }

      if (typeof(_module.width) !== "number")
      {
        console.error("Line: '" + original + "'", "invalid module structure.");
        process.exit(1);
      }

      if (typeof(_module.height) !== "number")
      {
        console.error("Line: '" + original + "'", "invalid module structure.");
        process.exit(1);
      }

      if (typeof(_module.color) !== "string")
      {
        console.error("Line: '" + original + "'", "invalid module structure.");
        process.exit(1);
      }

      if (typeof(_module.script) !== "string")
      {
        console.error("Line: '" + original + "'", "invalid module structure.");
        process.exit(1);
      }

      if (typeof(_module.scenes) !== "object")
      {
        console.error("Line: '" + original + "'", "invalid module structure.");
        process.exit(1);
      }

      if (typeof(_module.instances) !== "object")
      {
        console.error("Line: '" + original + "'", "invalid module structure.");
        process.exit(1);
      }

      if (_module.version !== version)
      {
        console.error("Line: '" + original + "'", "cannot use other version, current is \"" + version + "\".");
        process.exit(1);
      }

      module_from = tokens[1];
      parsed_moduleFrom = true;
      break;
    case "exportTo":
      if (tokens.length < 2)
      {
        console.error("Line: '" + original + "'", "too few arguments.");
        process.exit(1);
      }

      if (tokens.length > 2)
      {
        console.error("Line: '" + original + "'", "too many arguments.");
        process.exit(1);
      }

      if (!check_string(tokens[1]))
      {
        console.error("Line: '" + original + "'", "argument is not a string.");
        process.exit(1);
      }

      if (export_to !== "")
      {
        console.error("Line: '" + original + "'", "cannot use \"exportTo\" more than once.");
        process.exit(1);
      }

      tokens[1] = tokens[1].substr(1, tokens[1].length - 2);
      export_to = tokens[1];
      parsed_exportTo = true;
      break;
    case "importFrom":
      if (tokens.length < 4)
      {
        console.error("Line: '" + original + "'", "too few arguments.");
        process.exit(1);
      }

      if (tokens.length > 4)
      {
        console.error("Line: '" + original + "'", "too many arguments.");
        process.exit(1);
      }

      if (!check_instance(tokens[1]))
      {
        console.error("Line: '" + original + "'", "argument is not a instance.");
        process.exit(1);
      }

      if (tokens[2] !== "as")
      {
        console.error("Line: '" + original + "'", "expected \"as\" after the instance name.");
        process.exit(1);
      }

      if (!check_type(tokens[3]))
      {
        console.error("Line: '" + original + "'", "expected type after the \"as\" keyword.");
        process.exit(1);
      }

      if (import_froms.length > 512)
      {
        console.error("Line: '" + original + "'", "too many \"importFrom\" commands.");
        process.exit(1);
      }

      if (module_from === "")
      {
        console.error("Line: '" + original + "'", "no module specified.");
        process.exit(1);
      }

      tokens[1] = tokens[1].substr(1, tokens[1].length);
      import_froms.push(tokens[1]);
      line = "const " + tokens[1] + " = scene.querySelector(\"#" + tokens[1] + "\");\n";
      line += "if (" + tokens[1] + " === null) {\n";
      line += "throw new Error(\"This script isn't compatible with your application.\");\n";
      line += "}\n";
      break;
    case "when":
      if (parsing_when)
      {
        console.error("Line: '" + original + "'", "cannot stack \"when\" statement.");
        process.exit(1);
      }

      line = "if (";
      let i = 0;
      let no_and = true;
      let parse_after_and = false;
      tokens.splice(0, 1);

      if (tokens[0] === "IS" && tokens[1] === "LOADED" && tokens.length === 2)
      { when_is_loaded = true; }

      if (tokens[0] === "IS" && tokens[1] === "LOADED" && tokens.length === 2 && when_is_loadeds > 0)
      {
        console.error("Line: '" + original + "'", "cannot use \"when IS LOADED\" more than once.");
        process.exit(1);
      }

      if (tokens.includes("LOADED") && when_is_loadeds > 0)
      {
        console.error("Line: '" + original + "'", "cannot use \"LOADED\" keyword more than once.");
        process.exit(1);
      }

      while (tokens[0] !== undefined)
      {
        switch (tokens[0])
        {
          case "AND":
            if (!no_and && !parse_after_and)
            {
              console.error("Line: '" + original + "'", "cannot use \"AND\" to connect after \"AND\" keyword.");
              process.exit(1);
            }
            
            if (!line.endsWith(")"))
            {
              console.error("Line: '" + original + "'", "stray \"AND\" keyword.");
              process.exit(1);
            }

            line += " && ";
            no_and = false;
            parse_after_and = false;
            tokens.splice(0, 1);
            break;
          case "IS":
            if (!parse_after_and)
            { parse_after_and = true; }

            line += "(";
            
            if (check_instance(tokens[1]))
            {
              tokens[1] = tokens[1].substr(1, tokens[1].length);
              
              if (!import_froms.includes(tokens[1]))
              {
                console.error("Line: '" + original + "'", "unknown instance name.");
                process.exit(1);
              }
              
              line += tokens[1];
              line += ")";
              tokens.splice(0, 1);
              break;
            }

            line = parse_condition(line, tokens);
            line += ")";
            tokens.splice(0, 1);
            
            if (check_action(tokens[0]))
            { tokens.splice(0, 2); }
            else
            { tokens.splice(0, 1); }

            break;
          case "NOT":
            if (!parse_after_and)
            { parse_after_and = true; }

            line += "!(";

            if (check_instance(tokens[1]))
            {
              tokens[1] = tokens[1].substr(1, tokens[1].length);

              if (!import_froms.includes(tokens[1]))
              {
                console.error("Line: '" + original + "'", "unknown instance name.");
                process.exit(1);
              }

              line += tokens[1];
              line += ")";
              tokens.splice(0, 1);
              break;
            }

            line = parse_condition(line, tokens);
            line += ")";
            tokens.splice(0, 1);

            if (check_action(tokens[0]))
            { tokens.splice(0, 2); }
            else
            { tokens.splice(0, 1); }

            break;
          default:
            console.error("Line: '" + original + "'", "expected \"IS\" or \"NOT\" keyword.");
            process.exit(1);
        }
      }

      if (!no_and && !parse_after_and)
      {
        console.error("Line: '" + original + "'", "unterminated \"AND\" keyword.");
        process.exit(1);
      }
      
      line += ") {";
      parsing_when = true;
      break;
    case "end":
      if (tokens.length < 1)
      {
        console.error("Line: '" + original + "'", "too few arguments.");
        process.exit(1);
      }

      if (tokens.length > 1)
      {
        console.error("Line: '" + original + "'", "too many arguments.");
        process.exit(1);
      }

      if (!parsing_when)
      {
        console.error("Line: '" + original + "'", "stray \"end\" keyword.");
        process.exit(1);
      }

      if (when_is_loaded == true)
      {
        when_is_loaded = false;
        when_is_loadeds++;
        line += "loaded = false;\n";
      }
      
      line += "}";
      parsing_when = false;
      break;
    case "locate":
      if (tokens.length < 4)
      {
        console.error("Line: '" + original + "'", "too few arguments.");
        process.exit(1);
      }

      if (tokens.length > 4)
      {
        console.error("Line: '" + original + "'", "too many arguments.");
        process.exit(1);
      }

      if (!check_instance(tokens[1]))
      {
        console.error("Line: '" + original + "'", "expected instance name.");
        process.exit(1);
      }
      else
      {
        tokens[1] = tokens[1].substr(1, tokens[1].length);
        if (!import_froms.includes(tokens[1]))
        {
          console.error("Line: '" + original + "'", "unknown instance name.");
          process.exit(1);
        }
      }

      if (!check_number(tokens[2]) && tokens[2] !== "center")
      {
        console.error("Line: '" + original + "'", "expected number or \"center\" keyword after the instance name.");
        process.exit(1);
      }

      if (!check_number(tokens[3]) && tokens[3] !== "center")
      {
        console.error("Line: '" + original + "'", "expected number or \"center\" keyword after the x position.");
        process.exit(1);
      }

      if (tokens[2] === "center")
      { tokens[2] = String(_module.width / 2); }

      if (tokens[3] === "center")
      { tokens[3] = String(_module.height / 2); }

      line += tokens[1] + ".style.x = \"" + tokens[2] + "px\";\n";
      line += tokens[1] + ".style.y = \"" + tokens[3] + "px\";";
      break;
    case "size":
      if (tokens.length < 4)
      {
        console.error("Line: '" + original + "'", "too few arguments.");
        process.exit(1);
      }

      if (tokens.length > 4)
      {
        console.error("Line: '" + original + "'", "too many arguments.");
        process.exit(1);
      }

      if (!check_instance(tokens[1]))
      {
        console.error("Line: '" + original + "'", "expected instance name.");
        process.exit(1);
      }
      else
      {
        tokens[1] = tokens[1].substr(1, tokens[1].length);
        if (!import_froms.includes(tokens[1]))
        {
          console.error("Line: '" + original + "'", "unknown instance name.");
          process.exit(1);
        }
      }

      if (!check_number(tokens[2]) && tokens[2] !== "full")
      {
        console.error("Line: '" + original + "'", "expected number or \"full\" keyword after the instance name.");
        process.exit(1);
      }
      
      if (!check_number(tokens[3]) && tokens[3] !== "full")
      {
        console.error("Line: '" + original + "'", "expected number or \"full\" keyword after the width size.");
        process.exit(1);
      }

      if (tokens[2] === "full")
      { tokens[2] = String(_module.width); }

      if (tokens[3] === "full")
      { tokens[3] = String(_module.height); }

      line += tokens[1] + ".style.width = \"" + tokens[2] + "px\";\n";
      line += tokens[1] + ".style.height = \"" + tokens[3] + "px\";";
      break;
    case "setAttribute":
      if (tokens.length < 4)
      {
        console.error("Line: '" + original + "'", "too few arguments.");
        process.exit(1);
      }

      if (tokens.length > 4)
      {
        console.error("Line: '" + original + "'", "too many arguments.");
        process.exit(1);
      }

      if (!check_instance(tokens[1]))
      {
        console.error("Line: '" + original + "'", "expected instance name.");
        process.exit(1);
      }
      else
      {
        tokens[1] = tokens[1].substr(1, tokens[1].length);
        if (!import_froms.includes(tokens[1]))
        {
          console.error("Line: '" + original + "'", "unknown instance name.");
          process.exit(1);
        }
      }

      if (!check_string(tokens[2]))
      {
        console.error("Line: '" + original + "'", "expected string after the instance name.");
        process.exit(1);
      }
      
      if (!check_string(tokens[3]) && !check_number(tokens[3]))
      {
        console.error("Line: '" + original + "'", "expected string or number after the attribute name.");
        process.exit(1);
      }

      tokens[2] = tokens[2].substr(1, tokens[2].length - 2);

      switch (tokens[2])
      {
        case "text":
          if (!check_string(tokens[3]))
          {
            console.error("Line: '" + original + "'", "expected string after the attribute name.");
            process.exit(1);
          }

          tokens[3] = tokens[3].substr(1, tokens[3].length - 2);
          line += tokens[1] + ".innerText = \"" + tokens[3] + "\";";
          break;
        case "font":
          if (!check_string(tokens[3]))
          {
            console.error("Line: '" + original + "'", "expected string after the attribute name.");
            process.exit(1);
          }

          tokens[3] = tokens[3].substr(1, tokens[3].length - 2);
          line += tokens[1] + ".style.fontFamily = \"" + tokens[3] + "\";";
          break;
        case "fontSize":
          if (!check_number(tokens[3]))
          {
            console.error("Line: '" + original + "'", "expected number after the attribute name.");
            process.exit(1);
          }

          line += tokens[1] + ".style.fontSize = \"" + tokens[3] + "px\";";
          break;
        case "textAlign":
          if (!check_string(tokens[3]))
          {
            console.error("Line: '" + original + "'", "expected string after the attribute name.");
            process.exit(1);
          }

          tokens[3] = tokens[3].substr(1, tokens[3].length - 2);

          switch (tokens[3])
          {
            case "left":
              line += tokens[1] + ".style.textAlign = \"left\";\n";
              line += tokens[1] + ".style.lineHeight = " + tokens[1] + ".style.height;";
              break;
            case "center":
              line += tokens[1] + ".style.textAlign = \"center\";\n";
              line += tokens[1] + ".style.lineHeight = " + tokens[1] + ".style.height;";
              break;
            case "right":
              line += tokens[1] + ".style.textAlign = \"right\";\n";
              line += tokens[1] + ".style.lineHeight = " + tokens[1] + ".style.height;";
              break;
            default:
              console.error("Line: '" + original + "'", "expected string after the attribute name.");
              process.exit(1);
          }

          break;
        default:
          console.error("Line: '" + original + "'", "unknown attribute name.");
          process.exit(1);
      }

      break;
    case "show":
      if (tokens.length < 2)
      {
        console.error("Line: '" + original + "'", "too few arguments.");
        process.exit(1);
      }

      if (tokens.length > 2)
      {
        console.error("Line: '" + original + "'", "too many arguments.");
        process.exit(1);
      }

      if (!check_instance(tokens[1]))
      {
        console.error("Line: '" + original + "'", "expected instance name.");
        process.exit(1);
      }

      tokens[1] = tokens[1].substr(1, tokens[1].length);
      
      if (!import_froms.includes(tokens[1]))
      {
        console.error("Line: '" + original + "'", "unknown instance name.");
        process.exit(1);
      }

      line += tokens[1] + ".style.hidden = false;";
      break;
  }

  return line;
}

function compile(argv, i) {
  if (typeof(i) !== "number")
  {
    console.error("Variable \"i\" is not a number.");
    process.exit(1);
  }

  if (i % 1 !== 0)
  {
    console.error("Variable \"i\" is not a number.");
    process.exit(1);
  }

  fs.readFile(argv[i], "utf8", function(error, data) {
    if (error)
    {
      console.error("File: \"" + argv[i] + "\"", "doesn't exist or unreachable.");
      process.exit(1);
    }
    
    const lines = data.split("\n");
    compiled = "\"use strict\";\n";
    compiled += "const scene = document.querySelector(\"#scene\");\n";
    compiled += "if (scene === null) {\n";
    compiled += "throw new Error(\"This script isn't compatible with your application.\");\n";
    compiled += "}\n";
    compiled += "let loaded = true;\n";
    parsed_moduleFrom = false;
    parsed_exportTo = false;
    added_interval = false;
    
    for (let i = 0; i < lines.length; i++)
    {
      let tokens = lines[i].split(" ");
      tokens = split_tokens(tokens, i);
      tokens = split_seperators(tokens, lines, i);

      if (typeof(tokens) !== "object")
      {
        console.error("Variable \"tokens\" is not an object.");
        process.exit(1);
      }

      if (tokens.length === 0)
      { continue; }

      const processed = process_tokens(tokens);

      if (processed === "")
      { continue; }

      compiled += processed + "\n";
    }

    if (parsing_when)
    {
      console.error("File: \"" + argv[i] + "\"", "unterminated \"when\" statement.");
      process.exit(1);
    }

    if (compiled.includes("setInterval(function() {"))
    { compiled += "}, 1);\n"; }

    if (module_from === "")
    {
      console.error("File: \"" + argv[i] + "\"", "\"moduleFrom\" command is not specified.");
      process.exit(1);
    }

    if (export_to === "")
    {
      console.error("File: \"" + argv[i] + "\"", "\"exportTo\" command is not specified.");
      process.exit(1);
    }

    if (typeof(compiled) !== "string")
    {
      console.error("Variable \"compiled\" is not an string.");
      process.exit(1);
    }

    fs.writeFile(export_to, compiled, function(error) {
      if (error)
      {
        console.error("File: \"" + export_to + "\"", "is unreachable.");
        process.exit(1);
      }

      console.log("Successfully compiled file: \"" + argv[i] + "\" to JavaScript file: \"" + export_to + "\".");
    });
  });
}

function main() {
  for (let i = 2; i < argv.length; i++)
  {
    console.log("Parsing file:", argv[i]);
    compile(argv, i);
  }
}

main();
