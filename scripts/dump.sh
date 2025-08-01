#!/bin/bash

# Output file
OUT="project-source-dump.txt"
> "$OUT"  # Clear previous output

echo "Generating full source dump..."

# Find all relevant source files, excluding unwanted paths and files
find . \
  -type f \( -name "*.ts" -o -name "*.js" -o -name "*.json" \) \
  -not -name "package-lock.json" \
  -not -path "*/node_modules/*" \
  -not -path "*/.git/*" \
  -not -path "*/dist/*" \
  -not -path "*/infra/*" \
  | while read -r file; do
    echo -e "\n--- $file ---" >> "$OUT"
    cat "$file" >> "$OUT"
  done

echo "✅ Dump written to $OUT"
