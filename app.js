const loginForm = document.getElementById("loginForm");
const adminUsername = document.getElementById("adminUsername");
const adminPassword = document.getElementById("adminPassword");
const showPassword = document.getElementById("showPassword");
const loginError = document.getElementById("loginError");

// ================================
// إظهار وإخفاء كلمة المرور
// ================================

if (showPassword) {

showPassword.addEventListener("click", function () {

if (adminPassword.type === "password") {

  adminPassword.type = "text";
  showPassword.textContent = "إخفاء";

} else {

  adminPassword.type = "password";
  showPassword.textContent = "إظهار";

}

});

}

// ================================
// تسجيل الدخول
// ================================

if (loginForm) {

loginForm.addEventListener("submit", function (event) {

event.preventDefault();

const username = adminUsername.value.trim();
const password = adminPassword.value.trim();

if (!username || !password) {

  showError("أدخل اسم المستخدم وكلمة المرور.");

  return;

}

/*
  سيتم ربط تسجيل دخول الأدمن
  بـ Firebase Authentication
  في الخطوة التالية.
*/

showError("سيتم ربط تسجيل الدخول بـ Firebase.");

});

}

// ================================
// عرض رسالة الخطأ
// ================================

function showError(message) {

if (!loginError) return;

loginError.textContent = message;
loginError.style.display = "block";

}
