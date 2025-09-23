# cureka
# Install & Start
```
  git clone https://github.com/manishindiyaar/cureka.git
  cd cureka/apps/api
  pnpm install
  supabase start
  npx prisma db push
  pnpm dev
```

  # Test OTP
  curl -X POST http://localhost:3000/api/v1/auth/patient/otp/request \
      -H "Content-Type: application/json" \
      -d '{"phone_number":"+919373675705","user_type":"patient"}'

  # Verify OTP
  curl -X POST http://localhost:3000/api/v1/auth/patient/otp/verify \
      -H "Content-Type: application/json" \
      -d '{"phone_number":"+919373675705","otp_code":"7383"}'
