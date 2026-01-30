import { currentUser } from "@clerk/nextjs/server";
import { db } from "./prisma";

export const checkUser = async () => {
  const user = await currentUser();

  // Check if user is authenticated with Clerk
  if (!user) {
    return null;
  }

  try {
    // find the user in local database
    const loggedInUser = await db.user.findUnique({
      where: {
        clerkUserId: user.id,
      },
    });

    // If found, return the user
    if (loggedInUser) {
      return loggedInUser;
    }

    // Prepare user data
    const name = [user.firstName, user.lastName].filter(Boolean).join(" ");
    const email = user.emailAddresses[0].emailAddress;

    // If not found, create a new user in your database
    const newUser = await db.user.create({
      data: {
        clerkUserId: user.id,
        name,
        imageUrl: user.imageUrl,
        email,
      },
    });

    return newUser;

  } catch (error) {
    if (error instanceof Error) {
      console.error("Error in checkUser:", error.message);
    } else {
      console.error("An unknown error occurred in checkUser:", error);
    }
    
    return null;
  }
};