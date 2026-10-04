// src/services/faqService.ts
// Handles reading chatbot FAQ data from Firestore.
// This data is PUBLIC — no login needed to read it.

import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebaseClient";

export interface ChatbotFAQ {
  id: string;
  question: string;
  answer: string;
  keywords: string[];
  category: string;
  language: string;
  isActive: boolean;
}

let cachedFAQs: ChatbotFAQ[] | null = null;

/**
 * Get all active FAQs. Cached in memory after the first call so the
 * chatbot doesn't hit Firestore on every single message typed.
 */
export async function getAllFAQs(): Promise<ChatbotFAQ[]> {
  if (cachedFAQs) return cachedFAQs;
  const snap = await getDocs(collection(db, "chatbotFAQs"));
  cachedFAQs = snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<ChatbotFAQ, "id">) }))
    .filter((f) => f.isActive);
  return cachedFAQs;
}

/**
 * Very simple keyword search: finds the best-matching FAQ for what the
 * user typed, by counting how many of the FAQ's keywords appear in their message.
 * Returns null if nothing matches well enough.
 */
export async function findBestFAQAnswer(
  userMessage: string,
): Promise<string | null> {
  const faqs = await getAllFAQs();
  const lower = userMessage.toLowerCase();

  let bestFaq: ChatbotFAQ | null = null;
  let bestScore = 0;

  for (const faq of faqs) {
    let score = 0;
    for (const keyword of faq.keywords) {
      if (lower.includes(keyword.toLowerCase())) score++;
    }
    // Also check if the question itself is close to what they typed
    if (lower.includes(faq.question.toLowerCase().slice(0, 10))) score += 2;

    if (score > bestScore) {
      bestScore = score;
      bestFaq = faq;
    }
  }

  return bestScore > 0 ? bestFaq!.answer : null;
}
