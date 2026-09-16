const button = document.querySelector("#action");
const output = document.querySelector("#output");

button.addEventListener("click", function () {
  output.textContent = "The cube jumps!";
});
