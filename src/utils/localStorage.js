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
    console.error(`Error saving localStorage key "${key}":`, error);
  }
}
