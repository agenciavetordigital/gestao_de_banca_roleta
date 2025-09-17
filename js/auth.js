import { db } from "./supabaseClient.js";

export async function checkUserSession() {
  const { data: { session } } = await db.auth.getSession();
  return session?.user || null;
}

export async function login(email, password) {
  return await db.auth.signInWithPassword({ email, password });
}

export async function register(email, password) {
  return await db.auth.signUp({ email, password });
}

export async function logout() {
  return await db.auth.signOut();
}
