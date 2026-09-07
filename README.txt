MERI GATHA — FULL COMMUNITY VERSION

WHAT THIS VERSION DOES
• Visitor thoughts are saved in Supabase instead of only the current browser.
• New thoughts start as "pending".
• Only approved thoughts appear in the public community feed.
• Likes are stored in the database.
• Contact messages are stored privately in Supabase.
• The site remains static-hosting friendly (for example, GitHub Pages).

SETUP

1. Create a Supabase project:
   https://supabase.com/

2. Open Supabase SQL Editor and run:
   supabase_schema.sql

3. In Supabase, copy:
   Project URL
   Publishable key

4. Open config.js and replace:
   PASTE_YOUR_SUPABASE_PROJECT_URL_HERE
   PASTE_YOUR_SUPABASE_PUBLISHABLE_KEY_HERE

5. Upload all files to your GitHub Pages repository:
   index.html
   style.css
   script.js
   config.js
   supabase_schema.sql
   README.txt

6. In Supabase Table Editor -> thoughts:
   Visitor submissions will appear with status "pending".
   Change a safe submission to "approved" for it to become public.
   Change unsuitable submissions to "rejected".

IMPORTANT SECURITY
• Use only the Supabase publishable key in config.js.
• NEVER put a service_role key or secret key in the website.
• The SQL enables Row Level Security.
• Do not collect unnecessary personal information from visitors.
• Because this is a public community website, keep moderation enabled.

OPTIONAL NEXT UPGRADE
For a full owner-only moderation dashboard inside Meri Gatha, add Supabase Auth and an admin role. The current version deliberately keeps moderation in the Supabase dashboard so you don't have to expose an admin secret in the browser.
