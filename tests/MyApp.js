"use strict";
const scene = document.querySelector("#scene");
if (scene === null) {
throw new Error("This script isn't compatible with your application.");
}
let loaded = true;
setInterval(function() {
const MyString = scene.querySelector("#MyString");
if (MyString === null) {
throw new Error("This script isn't compatible with your application.");
}

if ((loaded)) {
MyString.style.x = "512px";
MyString.style.y = "384px";
MyString.style.width = "1024px";
MyString.style.height = "768px";
MyString.style.fontFamily = "monospace";
MyString.style.fontSize = "32px";
MyString.innerText = "Hello,World!";
MyString.style.textAlign = "center";
MyString.style.lineHeight = MyString.style.height;
MyString.style.hidden = false;
loaded = false;
}
if ((MyString.matches(":hover"))) {
MyString.style.fontSize = "48px";
}
if (!(MyString.matches(":hover"))) {
MyString.style.fontSize = "32px";
}
}, 1);
