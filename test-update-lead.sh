#!/bin/bash
COOKIE=$(curl -s -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@hireflow.com","password":"Password123!"}' -c cookies.txt | grep '"success":true')

curl -s -X PATCH http://localhost:3000/api/leads/32080158-9384-4513-bb3e-e71007402df1 \
  -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test Updated",
    "assignedTo": null
  }'
