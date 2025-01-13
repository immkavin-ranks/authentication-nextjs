"use server";
import { verifySession } from "@/app/lib/dal";

export async function serverAction(formData: FormData) {
  const session = await verifySession();
  const userRole = session?.user?.role;

  // Return early if user is not authorized to perform the action
  if (userRole !== "admin") {
    return null;
  }

  // Proceed with the action for authorized users
  const data = Object.fromEntries(formData.entries());

  // Perform the desired action with the form data
  // For example, save the data to the database or process it as needed
  const result = await someDatabaseFunction(data);

  return result;
}
