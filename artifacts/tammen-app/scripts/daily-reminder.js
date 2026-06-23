const admin = require("firebase-admin");
const { createClient } = require("@supabase/supabase-js");

// Load from environment or local path
// const serviceAccount = require("../firebase-adminsdk.json"); 
// admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

// Alternatively, if deployed, it uses application default credentials:
if (!admin.apps.length) {
  admin.initializeApp();
}

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "YOUR_SUPABASE_URL";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "YOUR_SUPABASE_SERVICE_KEY";
const supabase = createClient(supabaseUrl, supabaseKey);

async function runDailyReminders() {
  console.log("Starting daily reminder job...");

  // 1. Fetch all users who have notifications enabled and have a push_token
  const { data: users, error: setErr } = await supabase
    .from("user_settings")
    .select("user_id, check_in_deadline_hour, reminder_minutes_before, notifications_enabled, push_token")
    .eq("notifications_enabled", true)
    .not("push_token", "is", null);

  if (setErr || !users) {
    console.error("Failed to fetch user settings:", setErr);
    return;
  }

  // 2. Fetch the latest check-in for each user
  const { data: checkIns, error: checkErr } = await supabase
    .from("last_check_in_per_user")
    .select("user_id, checked_in_at");

  if (checkErr) {
    console.error("Failed to fetch check-ins:", checkErr);
    return;
  }

  const checkInMap = new Map();
  if (checkIns) {
    for (const c of checkIns) {
      checkInMap.set(c.user_id, new Date(c.checked_in_at));
    }
  }

  const now = new Date();

  for (const user of users) {
    const { user_id, check_in_deadline_hour, reminder_minutes_before, push_token } = user;
    const lastCheckIn = checkInMap.get(user_id);

    // Calculate deadline for today
    const deadline = new Date();
    deadline.setHours(check_in_deadline_hour, 0, 0, 0);
    
    // Determine if they checked in today
    let checkedInToday = false;
    if (lastCheckIn) {
      if (
        lastCheckIn.getDate() === now.getDate() &&
        lastCheckIn.getMonth() === now.getMonth() &&
        lastCheckIn.getFullYear() === now.getFullYear()
      ) {
        checkedInToday = true;
      }
    }

    if (!checkedInToday) {
      // Calculate when to send the reminder
      const reminderTime = new Date(deadline.getTime() - reminder_minutes_before * 60000);
      
      // If it's currently past the reminder time but before the deadline
      if (now >= reminderTime && now < deadline) {
        console.log(`Sending reminder to user ${user_id}`);
        
        try {
          await admin.messaging().send({
            token: push_token,
            notification: {
              title: "موعد تسجيل الدخول!",
              body: "يرجى تسجيل دخولك (أنا بخير) قبل انتهاء الوقت لتجنب إرسال تنبيه الطوارئ.",
            },
            data: {
              type: "daily_reminder"
            }
          });
          console.log(`Success: Notification sent to ${user_id}`);
        } catch (pushErr) {
          console.error(`Failed to send to ${user_id}:`, pushErr);
        }
      }
    }
  }
  
  console.log("Finished daily reminder job.");
}

runDailyReminders();
