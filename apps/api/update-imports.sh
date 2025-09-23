#!/bin/bash

# Script to update all relative prisma imports to use path alias

echo "🔄 Updating all prisma imports to use @/lib/prisma.js..."

# Navigate to the project root
cd "$(dirname "$0")"

# Files to update
files=(
  "src/api/v1/auth/patient/patient.controller.ts"
  "src/api/v1/auth/patient/patient.service.ts"
  "src/api/v1/doctors/doctors.service.ts"
  "src/api/v1/hospitals/hospitals.service.ts"
  "src/services/database.service.ts"
  "src/services/otp-verify.service.ts"
  "src/services/staff-auth.service.ts"
  "src/services/twilio.service.ts"
  "src/api/v1/auth/patient/otp-verify.controller.ts"
)

# Function to update import statement
update_import() {
  local file="$1"
  local relative_path="$2"

  echo "📁 Updating: $file"
  echo "   From: import { prisma } from '$relative_path'"
  echo "   To:   import { prisma } from '@/lib/prisma.js'"

  # Replace the import statement
  sed -i "s|import\s*{\s*prisma\s*}\s*from\s*['\"]$relative_path['\"]|import { prisma } from '@/lib/prisma.js'|" "$file"
}

# Update all the files
update_import "src/api/v1/auth/patient/patient.controller.ts" "../../../../lib/prisma.js"
update_import "src/api/v1/auth/patient/patient.service.ts" "../../../../lib/prisma.js"
update_import "src/api/v1/doctors/doctors.service.ts" "../../../lib/prisma.js"
update_import "src/api/v1/hospitals/hospitals.service.ts" "../../../lib/prisma.js"
update_import "src/services/database.service.ts" "../lib/prisma.js"
update_import "src/services/otp-verify.service.ts" "../lib/prisma.js"
update_import "src/services/staff-auth.service.ts" "../lib/prisma.js"
update_import "src/services/twilio.service.ts" "../lib/prisma.js"

echo "✅ All imports updated successfully!"
echo ""
echo "Now all files use: import { prisma } from '@/lib/prisma.js'"
echo ""
echo "You can now run your TypeScript code without module resolution errors!"