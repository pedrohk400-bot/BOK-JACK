const functions = require("firebase-functions");
const admin = require("firebase-admin");

const cors = require("cors")({
  origin: true
});

admin.initializeApp();

const db = admin.database();
const auth = admin.auth();

const ADMIN_UID =
  "rneRJQbNLNWUGyRbDs2ocI37R392";

exports.createAccount = functions.https.onRequest(
  (req, res) => {

    cors(req, res, async () => {

      try {

        if (req.method !== "POST") {

          return res.status(405).json({
            success: false,
            message: "Method Not Allowed"
          });

        }


        // ========================================
        // Authorization Header
        // ========================================

        const authorization =
          req.headers.authorization || "";


        if (!authorization.startsWith("Bearer ")) {

          return res.status(401).json({
            success: false,
            message: "غير مصرح"
          });

        }


        const idToken =
          authorization.substring(7);


        // ========================================
        // Verify Firebase User
        // ========================================

        const decodedToken =
          await admin.auth()
            .verifyIdToken(idToken);


        // ========================================
        // Check Admin
        // ========================================

        if (decodedToken.uid !== ADMIN_UID) {

          return res.status(403).json({
            success: false,
            message:
              "هذا الحساب غير مصرح له بإدارة النظام"
          });

        }


        // ========================================
        // Get Data
        // ========================================

        const name =
          String(req.body.name || "").trim();

        const password =
          String(req.body.password || "").trim();

        const balance =
          Number(req.body.balance || 0);


        // ========================================
        // Validation
        // ========================================

        if (!name) {

          return res.status(400).json({
            success: false,
            message: "أدخل اسم المستخدم"
          });

        }


        if (
          password.length < 6 ||
          !/^[0-9]+$/.test(password)
        ) {

          return res.status(400).json({
            success: false,
            message:
              "كلمة المرور يجب أن تحتوي على 6 أرقام أو أكثر"
          });

        }


        if (
          !Number.isFinite(balance) ||
          balance < 0
        ) {

          return res.status(400).json({
            success: false,
            message: "الرصيد غير صحيح"
          });

        }


        // ========================================
        // Generate Account
        // ========================================

        let account;
        let exists = true;

        while (exists) {

          account =
            Math.floor(
              1000000 +
              Math.random() * 9000000
            ).toString();


          const snapshot =
            await db.ref(
              "accounts/" + account
            ).once("value");


          exists =
            snapshot.exists();

        }


        // ========================================
        // Firebase Authentication Email
        // ========================================

        const email =
          account +
          "@bok-ped.firebaseapp.com";


        // ========================================
        // Create Authentication User
        // ========================================

        const userRecord =
          await auth.createUser({

            email: email,

            password: password,

            displayName: name,

            disabled: false

          });


        // ========================================
        // Subscription
        // 30 days default
        // ========================================

        const now =
          Date.now();

        const subscriptionEnd =
          now +
          (30 * 24 * 60 * 60 * 1000);


        // ========================================
        // Account Data
        // ========================================

        const accountData = {

          name: name,

          account: account,

          uid: userRecord.uid,

          balance: balance,

          active: true,

          createdAt: now,

          subscriptionStart: now,

          subscriptionEnd: subscriptionEnd,

          subscriptionType: "30_days",

          subscriptionName: "30 يوم"

        };


        // ========================================
        // Save Database
        // ========================================

        await db.ref(
          "accounts/" + account
        ).set(accountData);


        // ========================================
        // Success
        // ========================================

        return res.status(200).json({

          success: true,

          message:
            "تم إنشاء الحساب بنجاح",

          account: account,

          uid: userRecord.uid,

          email: email,

          subscriptionEnd:
            subscriptionEnd

        });

      }

      catch (error) {

        console.error(error);


        // ========================================
        // Duplicate Email
        // ========================================

        if (
          error.code ===
          "auth/email-already-exists"
        ) {

          return res.status(409).json({

            success: false,

            message:
              "هذا الحساب موجود بالفعل"

          });

        }


        return res.status(500).json({

          success: false,

          message:
            error.message ||
            "حدث خطأ في الخادم"

        });

      }

    });

  }
);
