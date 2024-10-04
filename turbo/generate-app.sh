#!/bin/bash

set -e

# Function to prompt for input if not provided as an argument
prompt_if_empty() {
    local var_name="$1"
    local prompt_message="$2"
    local default_value="$3"

    if [ -z "${!var_name}" ]; then
        read -p "$prompt_message [$default_value]: " user_input
        eval "$var_name=\"${user_input:-$default_value}\""
    fi
}

# Function to select template type
select_template_type() {
    echo "Select a template type:"
    select template in "react-library" "regular-package" "app" "desktop-app" "mobile-app" "cloudflare-worker" "typescript-library"
    do
        case $template in
            react-library|regular-package|app|desktop-app|mobile-app|cloudflare-worker|typescript-library)
                echo $template
                return
                ;;
            *) echo "Invalid selection. Please try again.";;
        esac
    done
}

# Check if arguments are provided, otherwise prompt
if [ "$#" -eq 2 ]; then
    template_type="$1"
    new_project_name="$2"
else
    template_type=$(select_template_type)
    prompt_if_empty new_project_name "Enter the new project name" "my-new-project"
fi

base_template_dir="generator/templates"
base_target_dir=""

# Define template directories and target directories based on template type
case "$template_type" in
    "react-library")
        template_dir="$base_template_dir/react-package"
        base_target_dir="packages"
        ;;
    "regular-package")
        template_dir="$base_template_dir/package"
        base_target_dir="packages"
        ;;
    "app")
        template_dir="$base_template_dir/app"
        base_target_dir="apps"
        ;;
    "desktop-app")
        template_dir="$base_template_dir/desktop-app"
        base_target_dir="apps"
        ;;
    "mobile-app")
        template_dir="$base_template_dir/mobile-app"
        base_target_dir="apps"
        ;;
    "cloudflare-worker")
        template_dir="$base_template_dir/cloudflare-worker"
        base_target_dir="packages"
        ;;
    "typescript-library")
        template_dir="$base_template_dir/typescript-library"
        base_target_dir="packages"
        ;;
    *)
        echo "Error: Unknown template type '$template_type'"
        exit 1
        ;;
esac

target_dir="$base_target_dir/$new_project_name"

echo "Template type: $template_type"
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
find "$target_dir" -type f -name "*.hbs" -print0 | while IFS= read -r -d '' file; do
    newname="${file%.hbs}"
    echo "Renaming $file to $newname"
    mv -v "$file" "$newname"
done

# Replace template placeholders with the new project name in all files
find "$target_dir" -type f -print0 | xargs -0 sed -i'' -e "s/{{kebabCase name}}/$new_project_name/g"
find "$target_dir" -type f -print0 | xargs -0 sed -i'' -e "s/{{pascalCase name}}/${new_project_name^}/g"
find "$target_dir" -type f -print0 | xargs -0 sed -i'' -e "s/{{camelCase name}}/${new_project_name,}/g"

echo "Files in target directory after renaming and placeholder replacement:"
find "$target_dir" -type f -print0 | xargs -0 ls -la

# Perform template-specific post-processing
case "$template_type" in
    "desktop-app")
        echo "Updating Electron configuration..."
        # Add specific commands for desktop app setup
        ;;
    "mobile-app")
        echo "Initializing React Native project..."
        # Add specific commands for mobile app setup
        ;;
    # Add more cases for other template types if needed
esac

echo "Project '$new_project_name' of type '$template_type' created successfully in $target_dir"