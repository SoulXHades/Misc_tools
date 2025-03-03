import os
import shutil
import tempfile
import signal
import time
from selenium import webdriver
from selenium.webdriver.firefox.options import Options

# List to store profile paths and drivers
profile_paths = []
drivers = []

def create_firefox_instance():
    """Creates a temporary Firefox profile and launches a new instance."""
    profile_dir = tempfile.mkdtemp(prefix="firefox_profile_")
    profile_paths.append(profile_dir)

    options = Options()
    options.add_argument(f"-profile")
    options.add_argument(profile_dir)

    driver = webdriver.Firefox(options=options)
    drivers.append(driver)
    return driver

def cleanup_profiles():
    """Closes all browsers and removes profiles."""
    print("\n[INFO] Cleaning up Firefox instances...")
    for driver in drivers:
        driver.quit()
    for path in profile_paths:
        try:
            shutil.rmtree(path)
        except Exception as e:
            print(f"[WARNING] Failed to delete {path}: {e}")
    print("[INFO] Cleanup complete.")

def signal_handler(sig, frame):
    """Handles Ctrl+C to clean up before exiting."""
    cleanup_profiles()
    exit(0)

# Register the signal handler
signal.signal(signal.SIGINT, signal_handler)

# Number of browser instances to launch (EDIT if needed)
num_instances = 3

print(f"[INFO] Launching {num_instances} Firefox instances with unique profiles...")
for _ in range(num_instances):
    driver = create_firefox_instance()
    driver.get("https://www.example.com")  # Change URL as needed

# Keep script running
try:
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    cleanup_profiles()
