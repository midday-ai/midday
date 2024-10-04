#!/bin/bash

# Function to add .hbs extension to a file
add_hbs_extension() {
    local file="$1"
    local dir=$(dirname "$file")
    local base=$(basename "$file")

    # Check if the file already has .hbs extension
    if [[ "$base" != *.hbs ]]; then
        # Rename the file by adding .hbs
        mv "$file" "${dir}/${base}.hbs"
        echo "Renamed: $file -> ${dir}/${base}.hbs"
    else
        echo "Skipped (already .hbs): $file"
    fi
}

# Check if a directory path is provided
if [ $# -eq 0 ]; then
    echo "Usage: $0 <directory_path>"
    exit 1
fi

# Use the provided directory path
target_directory="$1"

# Check if the provided path is a directory
if [ ! -d "$target_directory" ]; then
    echo "Error: '$target_directory' is not a valid directory."
    exit 1
fi

# Use find to locate all files in the target directory and apply the renaming function
find "$target_directory" -type f | while read -r file; do
    add_hbs_extension "$file"
done

echo "Conversion complete in directory: $target_directory"