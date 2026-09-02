const loginForm =
document.getElementById("loginForm");

const adminUsername =
document.getElementById("adminUsername");

const adminPassword =
document.getElementById("adminPassword");

const showPassword =
document.getElementById("showPassword");

const loginError =
document.getElementById("loginError");

const loginButton =
document.getElementById("loginButton");

// =====================================
// إظهار / إخفاء كلمة المرور
// =====================================

if (showPassword) {

showPassword.addEventListener(
"click",
function () {

  if (adminPassword.type === "password") {

    adminPassword.type = "text";

    showPassword.textContent =
      "إخفاء";

  } else {

    adminPassword.type = "password";

    showPassword.textContent =
      "إظهار";
  }

}

);

}

// =====================================
// تسجيل دخول الأدمن
// =====================================

if (loginForm) {

loginForm.addEventListener(
"submit",
async function (event) {

  event.preventDefault();

  hideError();

  const email =
    adminUsername.value.trim();

  const password =
    adminPassword.value.trim();


  if (!email || !password) {

    showError(
      "أدخل البريد الإلكتروني وكلمة المرور."
    );

    return;
  }


  try {

    loginButton.disabled = true;

    loginButton.textContent =
      "جاري تسجيل الدخول...";


    const result =
      await firebase.auth()
        .signInWithEmailAndPassword(
          email,
          password
        );


    if (result.user) {

      window.location.href =
        "dashboard.html";

    }

  } catch (error) {

    console.error(
      "Firebase Login Error:",
      error
    );


    let message =
      "فشل تسجيل الدخول.";


    switch (error.code) {

      case "auth/invalid-email":

        message =
          "البريد الإلكتروني غير صحيح.";

        break;


      case "auth/invalid-credential":

        message =
          "البريد الإلكتروني أو كلمة المرور غير صحيحة.";

        break;


      case "auth/user-not-found":

        message =
          "حساب الأدمن غير موجود.";

        break;


      case "auth/wrong-password":

        message =
          "كلمة المرور غير صحيحة.";

        break;


      case "auth/too-many-requests":

        message =
          "تم إجراء محاولات كثيرة. حاول لاحقًا.";

        break;


      case "auth/network-request-failed":

        message =
          "تحقق من اتصال الإنترنت.";

        break;


      default:

        message =
          "حدث خطأ أثناء تسجيل الدخول.";

    }


    showError(message);

    loginButton.disabled = false;

    loginButton.textContent =
      "تسجيل الدخول";

  }

}

);

}

// =====================================
// إظهار الخطأ
// =====================================

function showError(message) {

if (!loginError) return;

loginError.textContent =
message;

loginError.style.display =
"block";
}

// =====================================
// إخفاء الخطأ
// =====================================

function hideError() {

if (!loginError) return;

loginError.textContent =
"";

loginError.style.display =
"none";
}
