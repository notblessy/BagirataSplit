import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { DatabaseService } from "../services/DatabaseService";
import { Friend } from "../types";

interface UserProfileContextType {
  userProfile: Friend | null;
  setUserProfile: (profile: Friend | null) => void;
  refreshUserProfile: () => Promise<void>;
  updateUserProfile: (
    updates: Partial<Omit<Friend, "id" | "createdAt">>
  ) => Promise<boolean>;
}

const UserProfileContext = createContext<UserProfileContextType | undefined>(
  undefined
);

export const useUserProfile = () => {
  const context = useContext(UserProfileContext);
  if (context === undefined) {
    throw new Error("useUserProfile must be used within a UserProfileProvider");
  }
  return context;
};

interface UserProfileProviderProps {
  children: ReactNode;
}

export const UserProfileProvider: React.FC<UserProfileProviderProps> = ({
  children,
}) => {
  const [userProfile, setUserProfile] = useState<Friend | null>(null);

  const refreshUserProfile = async () => {
    try {
      await DatabaseService.initializeDatabase();
      const friends = DatabaseService.getAllFriends();
      const profile = friends.find((friend: Friend) => friend.me) || null;
      setUserProfile(profile);
    } catch (error) {
      console.error("Error refreshing user profile:", error);
    }
  };

  const updateUserProfile = async (
    updates: Partial<Omit<Friend, "id" | "createdAt">>
  ) => {
    try {
      if (userProfile) {
        const updated = DatabaseService.updateFriend(userProfile.id, updates);
        if (updated) {
          setUserProfile(updated);
          return true;
        }
      } else {
        // Create new profile
        const newProfile = DatabaseService.addFriend({
          ...updates,
          me: true,
          name: updates.name || "User",
          accentColor:
            updates.accentColor || DatabaseService.getRandomAccentColor(),
        });
        if (newProfile) {
          setUserProfile(newProfile);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error("Error updating user profile:", error);
      return false;
    }
  };

  useEffect(() => {
    refreshUserProfile();
  }, []);

  const value: UserProfileContextType = {
    userProfile,
    setUserProfile,
    refreshUserProfile,
    updateUserProfile,
  };

  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  );
};
