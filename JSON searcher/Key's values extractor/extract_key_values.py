import argparse
import os
import json

def initialize_parser():
    parser = argparse.ArgumentParser(
        description='''A CMD tool to search exctract a key's possible values across multiple files.
        By default, the extract values are unique.''')
    parser.add_argument('key',
                        help="Key to search for in the JSON files.")
    parser.add_argument('folderpath',
                        help="Absolute path to a directory to search from.")
    return parser.parse_args()

def find_key(directory: str, key: str) -> set:
    vals = set()  # Use a set to avoid duplicates

    # Walk through the directory
    for root, dirs, files in os.walk(directory):
        for file in files:
            # Process only JSON files
            if file.endswith('.json'):
                file_path = os.path.join(root, file)
                print(f"Processing file: {file_path}")  # Debug: print file path
                try:
                    with open(file_path, 'r') as f:
                        data = json.load(f)
                        
                        # Search for key in the JSON
                        vals.update(extract_value(data, key))
                except (json.JSONDecodeError, FileNotFoundError) as e:
                    print(f"Error reading {file_path}: {e}")

    return vals

def extract_value(data, key_arg: str) -> set:
    vals = set()

    # If data is a dictionary, check for the requested key
    if isinstance(data, dict):
        if key_arg in data:
            vals.add(data[key_arg])
        # Recursively search in all dictionary values
        for key, value in data.items():
            vals.update(extract_value(value, key_arg))
    
    # If data is a list, recursively search each item
    elif isinstance(data, list):
        for item in data:
            vals.update(extract_value(item, key_arg))
    
    return vals

if __name__ == "__main__":
    args = initialize_parser()
    vals = find_key(args.folderpath, args.key)

    print("\nFound {} unique values:".format(len(vals)))
    for val in vals:
        print(val)
