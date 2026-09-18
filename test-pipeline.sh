#!/bin/bash
COOKIE=$(curl -s -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@hireflow.com","password":"Password123!"}' -c cookies.txt | grep '"success":true')
curl -s -b cookies.txt "http://localhost:3000/api/deals?limit=1000"
