// Simple test for DataService
import { DataService } from "./services/DataService";

console.log("Testing DataService...");

try {
  const friends = DataService.getAllFriends();
  console.log("Friends loaded:", friends.length);

  const splittedBills = DataService.getAllSplittedBills();
  console.log("Split bills loaded:", splittedBills.length);

  console.log("DataService test passed!");
} catch (error) {
  console.error("DataService test failed:", error);
}
