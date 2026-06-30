import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import path from "node:path";

config({ path: path.resolve(process.cwd(), "../../.env.local") });
config({ path: path.resolve(process.cwd(), "../../.env") });
config({ path: path.resolve(process.cwd(), ".env.local") });
config({ path: path.resolve(process.cwd(), ".env") });

const rawName = process.env.SETUP_USER_NAME;
const rawEmail = process.env.SETUP_USER_EMAIL;
const rawPassword = process.env.SETUP_USER_PASSWORD;

if (!rawName || !rawEmail || !rawPassword) {
  console.error("Usage: SETUP_USER_NAME=YourName SETUP_USER_EMAIL=you@example.com SETUP_USER_PASSWORD=yourpassword npx tsx scripts/setup-user.ts");
  process.exit(1);
}

const name: string = rawName;
const email: string = rawEmail;
const password: string = rawPassword;

if (password.length < 6) {
  throw new Error("Password must be at least 6 characters");
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const directUrl = process.env.DIRECT_URL;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set");
  }
  if (!directUrl) {
    throw new Error("DIRECT_URL must be set");
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  console.log(`Creating account for ${email}...`);

  const { data, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });

  if (signUpError) {
    throw new Error(`Sign-up failed: ${signUpError.message}`);
  }

  if (!data.session) {
    console.log("Auto-confirming email via database...");
    const prisma = new PrismaClient({
      adapter: new PrismaPg({ connectionString: directUrl }),
    });
    await prisma.$executeRawUnsafe(
      `UPDATE auth.users SET email_confirmed_at = NOW(), confirmed_at = NOW() WHERE email = $1`,
      email
    );
    await prisma.$disconnect();
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: directUrl }),
  });

  const userId = data.user?.id;
  if (!userId) throw new Error("No user ID returned from sign-up");

  await prisma.user.upsert({
    where: { id: userId },
    update: { email, name },
    create: { id: userId, email, name },
  });

  const existingMembership = await prisma.workspaceMember.findFirst({
    where: { userId },
    select: { id: true },
  });

  if (!existingMembership) {
    await prisma.workspace.create({
      data: {
        name: `${name}'s Workspace`,
        members: { create: { userId, role: "OWNER" } },
      },
    });
  }

  await prisma.$disconnect();

  console.log(`\nDone! Log in at http://localhost:3000/login`);
  console.log(`  Email:    ${email}`);
  console.log(`  Password: ${password}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
