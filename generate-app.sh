#!/bin/bash

set -e
set -x

if [ "$#" -ne 1 ]; then
    echo "Usage: $0 <new_app_name>"
    exit 1
fi

new_app_name="$1"
template_dir="turbo/generator/templates/app"
target_dir="apps/$new_app_name"

echo "Template directory: $template_dir"
echo "Target directory: $target_dir"

# Check if the target directory already exists
if [ -d "$target_dir" ]; then
    echo "Error: Directory $target_dir already exists."
    exit 1
fi

# Create the target directory
mkdir -p "$target_dir"

# Use rsync to copy all contents, including hidden files
rsync -av "$template_dir/" "$target_dir/"

echo "Files in target directory before renaming:"
find "$target_dir" -type f -print0 | xargs -0 ls -la

# Rename files ending with .hbs by removing the .hbs extension
while IFS= read -r -d '' file; do
    if [[ "$file" == *.hbs ]]; then
        newname="${file%.hbs}"
        echo "Renaming $file to $newname"
        mv -v "$file" "$newname"
    fi
done < <(find "$target_dir" -type f -print0)

# Explicitly check for problematic files
for problematic_file in "next-env.d.ts.hbs" "next.config.mjs.hbs"; do
    full_path="$target_dir/$problematic_file"
    if [ -f "$full_path" ]; then
        newname="${full_path%.hbs}"
        echo "Explicitly renaming $full_path to $newname"
        mv -v "$full_path" "$newname"
    else
        echo "File not found: $full_path"
    fi
done

# Replace {{kebabCase name}} with the new app name in all files
find "$target_dir" -type f -print0 | xargs -0 perl -pi -e "s/\{\{kebabCase name\}\}/$new_app_name/g"

echo "Files in target directory after renaming:"
find "$target_dir" -type f -print0 | xargs -0 ls -la

echo "App '$new_app_name' created successfully in $target_dir"