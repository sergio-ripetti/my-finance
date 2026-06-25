// Gets and parses data from localStorage.
// Returns the fallback value if the key does not exist or fails.
export function getFromLocalStorage(key, fallbackValue) {
  try {
    const storedValue = localStorage.getItem(key);
    return storedValue ? JSON.parse(storedValue) : fallbackValue;
  } catch (error) {
    console.error(`Error reading localStorage key "${key}":`, error);
    return fallbackValue;
  }
}

// Saves data to localStorage after converting it to JSON.
export function saveToLocalStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    if (error.name === "QuotaExceededError") {
      console.error(
        "localStorage is full. Cannot save data. Please clear some data.",
        error
      );
      throw new Error(
        "Storage quota exceeded. Please delete old pay cycles to free up space."
      );
    }
    console.error(`Error saving localStorage key "${key}":`, error);
    throw error;
  }
}

// Clears all app data from localStorage
export function clearAllAppData() {
  try {
    const keys = [
      "payCycles",
      "expenses",
      "salary",
      "userInfo",
      "activePayCycleId",
    ];
    keys.forEach((key) => localStorage.removeItem(key));
  } catch (error) {
    console.error("Error clearing localStorage:", error);
  }
}
