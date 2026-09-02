const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const admin = require("firebase-admin");

dotenv.config();


// ==================================================
// Firebase Admin
// ==================================================

const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),

    databaseURL:
        "https://bok-jack-default-rtdb.firebaseio.com"
});


// ==================================================
// Firebase Services
// ==================================================

const auth = admin.auth();
const db = admin.database();


// ==================================================
// Express
// ==================================================

const app = express();

app.use(cors());

app.use(
    express.json({
        limit: "1mb"
    })
);


// ==================================================
// Settings
// ==================================================

const PORT =
    process.env.PORT || 3000;

const ADMIN_UID =
    process.env.ADMIN_UID ||
    "rneRJQbNLNWUGyRbDs2ocI37R392";

const ACCOUNT_EMAIL_DOMAIN =
    process.env.ACCOUNT_EMAIL_DOMAIN ||
    "bok-ped.firebaseapp.com";

const SUBSCRIPTION_DAYS =
    Number(
        process.env.SUBSCRIPTION_DAYS || 30
    );


// ==================================================
// Home
// ==================================================

app.get("/", (req, res) => {

    res.json({
        success: true,
        message: "BOK JACK Backend is running",
        version: "1.0.0"
    });

});


// ==================================================
// Health Check
// ==================================================

app.get("/health", (req, res) => {

    res.json({
        success: true,
        status: "online"
    });

});


// ==================================================
// Verify Admin
// ==================================================

async function verifyAdmin(req, res, next) {

    try {

        const authorization =
            req.headers.authorization || "";


        if (
            !authorization.startsWith(
                "Bearer "
            )
        ) {

            return res.status(401).json({

                success: false,

                message:
                    "لم يتم إرسال رمز تسجيل الدخول"

            });

        }


        const idToken =
            authorization.substring(7);


        if (!idToken) {

            return res.status(401).json({

                success: false,

                message:
                    "رمز تسجيل الدخول غير موجود"

            });

        }


        // ==========================================
        // Verify Firebase ID Token
        // ==========================================

        const decodedToken =
            await auth.verifyIdToken(
                idToken
            );


        // ==========================================
        // Check Admin UID
        // ==========================================

        if (
            decodedToken.uid !==
            ADMIN_UID
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "هذا الحساب غير مصرح له بإدارة النظام"

            });

        }


        // ==========================================
        // Save Admin Information
        // ==========================================

        req.admin = decodedToken;


        next();

    }

    catch (error) {

        console.error(
            "ADMIN AUTH ERROR:",
            error
        );


        return res.status(401).json({

            success: false,

            message:
                "جلسة الأدمن غير صالحة أو منتهية"

        });

    }

}


// ==================================================
// Generate Account Number
// ==================================================

function generateAccountNumber() {

    const min =
        1000000;

    const max =
        9999999;


    return String(
        Math.floor(
            Math.random() *
            (max - min + 1)
        ) + min
    );

}


// ==================================================
// Get Unique Account Number
// ==================================================

async function getUniqueAccountNumber() {

    for (
        let attempt = 0;
        attempt < 20;
        attempt++
    ) {

        const account =
            generateAccountNumber();


        const snapshot =
            await db
                .ref("accounts")
                .child(account)
                .once("value");


        if (!snapshot.exists()) {

            return account;

        }

    }


    throw new Error(
        "تعذر إنشاء رقم حساب جديد"
    );

}


// ==================================================
// Create Account
// ==================================================

app.post(
    "/createAccount",
    verifyAdmin,
    async (req, res) => {

        let createdUser = null;

        let accountNumber = null;


        try {

            // ======================================
            // Read Request
            // ======================================

            const name =
                typeof req.body.name === "string"
                    ? req.body.name.trim()
                    : "";


            const password =
                typeof req.body.password === "string"
                    ? req.body.password.trim()
                    : "";


            const balance =
                Number(
                    req.body.balance
                );


            // ======================================
            // Validate Name
            // ======================================

            if (!name) {

                return res.status(400).json({

                    success: false,

                    message:
                        "أدخل اسم المستخدم"

                });

            }


            if (name.length > 100) {

                return res.status(400).json({

                    success: false,

                    message:
                        "اسم المستخدم طويل جدًا"

                });

            }


            // ======================================
            // Validate Password
            // ======================================

            if (
                !/^[0-9]{6,}$/.test(
                    password
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "كلمة المرور يجب أن تكون 6 أرقام أو أكثر"

                });

            }


            // ======================================
            // Validate Balance
            // ======================================

            if (
                !Number.isFinite(balance) ||
                balance < 0
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "الرصيد غير صحيح"

                });

            }


            // ======================================
            // Generate Account Number
            // ======================================

            accountNumber =
                await getUniqueAccountNumber();


            // ======================================
            // Firebase Auth Email
            // ======================================

            const email =
                accountNumber +
                "@" +
                ACCOUNT_EMAIL_DOMAIN;


            // ======================================
            // Create Firebase User
            // ======================================

            createdUser =
                await auth.createUser({

                    email:
                        email,

                    password:
                        password,

                    displayName:
                        name,

                    disabled:
                        false,

                    emailVerified:
                        false

                });


            const uid =
                createdUser.uid;


            // ======================================
            // Subscription
            // ======================================

            const now =
                Date.now();


            const subscriptionEnd =
                now +
                (
                    SUBSCRIPTION_DAYS *
                    24 *
                    60 *
                    60 *
                    1000
                );


            // ======================================
            // Account Data
            // ======================================

            const accountData = {

                accountNumber:
                    accountNumber,

                name:
                    name,

                uid:
                    uid,

                balance:
                    balance,

                active:
                    true,

                subscriptionStart:
                    now,

                subscriptionEnd:
                    subscriptionEnd,

                subscriptionType:
                    "monthly",

                subscriptionName:
                    SUBSCRIPTION_DAYS === 30
                        ? "اشتراك شهري"
                        : `${SUBSCRIPTION_DAYS} يوم`,

                createdAt:
                    now,

                createdBy:
                    ADMIN_UID

            };


            // ======================================
            // Save To Realtime Database
            // ======================================

            await db
                .ref("accounts")
                .child(accountNumber)
                .set(accountData);


            // ======================================
            // Success
            // ======================================

            return res.status(201).json({

                success:
                    true,

                message:
                    "تم إنشاء الحساب بنجاح",

                account:
                    accountNumber,

                uid:
                    uid,

                name:
                    name,

                balance:
                    balance,

                active:
                    true,

                subscriptionStart:
                    now,

                subscriptionEnd:
                    subscriptionEnd,

                subscriptionType:
                    "monthly",

                subscriptionName:
                    accountData.subscriptionName

            });

        }

        catch (error) {

            console.error(
                "CREATE ACCOUNT ERROR:",
                error
            );


            // ======================================
            // Cleanup Auth User If DB Failed
            // ======================================

            if (createdUser) {

                try {

                    await auth.deleteUser(
                        createdUser.uid
                    );

                }

                catch (deleteError) {

                    console.error(
                        "CLEANUP ERROR:",
                        deleteError
                    );

                }

            }


            // ======================================
            // Firebase Auth Errors
            // ======================================

            if (
                error &&
                error.code ===
                    "auth/email-already-exists"
            ) {

                return res.status(409).json({

                    success: false,

                    message:
                        "هذا الحساب موجود بالفعل، حاول مرة أخرى"

                });

            }


            if (
                error &&
                error.code ===
                    "auth/invalid-password"
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "كلمة المرور غير صالحة"

                });

            }


            // ======================================
            // General Error
            // ======================================

            return res.status(500).json({

                success: false,

                message:
                    "تعذر إنشاء الحساب"

            });

        }

    }
);


// ==================================================
// 404
// ==================================================

app.use(
    (req, res) => {

        res.status(404).json({

            success: false,

            message:
                "المسار غير موجود"

        });

    }
);


// ==================================================
// Global Error
// ==================================================

app.use(
    (error, req, res, next) => {

        console.error(
            "GLOBAL ERROR:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "حدث خطأ في الخادم"

        });

    }
);


// ==================================================
// Start Server
// ==================================================

app.listen(
    PORT,
    () => {

        console.log(
            "===================================="
        );

        console.log(
            "BOK JACK Backend"
        );

        console.log(
            "Server running on port:",
            PORT
        );

        console.log(
            "Create Account:",
            `/createAccount`
        );

        console.log(
            "===================================="
        );

    }
);
